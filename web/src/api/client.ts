import type { AuthUser } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Same dev-bypass auth pattern as the mobile app (see backend/src/auth/jwt-auth.guard.ts) — no
 * real Auth0 tenant is provisioned yet. Once one exists, swap this for a real bearer token.
 */
export async function apiFetch<T>(
  user: AuthUser,
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-dev-user-sub': user.sub,
      'x-dev-user-email': user.email,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new ApiError(response.status, text || response.statusText);
  }
  if (response.status === 204) return undefined as T;
  // NestJS sends an empty body (not the literal string "null") for a handler that returns
  // null/undefined — e.g. GET /organizations/mine for a user with no org yet. response.json()
  // throws "Unexpected end of JSON input" on an empty body, so check for that first.
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}
