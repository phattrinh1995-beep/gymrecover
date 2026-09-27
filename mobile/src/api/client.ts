import type { AuthUser } from '../types';

// Expo exposes env vars prefixed EXPO_PUBLIC_ to client code at build time.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Thin fetch wrapper. Auth is via dev-bypass headers (x-dev-user-sub/x-dev-user-email) because
 * no real Auth0 tenant is provisioned yet — see backend/src/auth/jwt-auth.guard.ts. Once a real
 * tenant exists, this should send `Authorization: Bearer <token>` instead.
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

  if (response.status === 204) {
    return undefined as T;
  }
  // NestJS sends an empty body (not the literal string "null") for a handler that returns
  // null/undefined. response.json() throws "Unexpected end of JSON input" on an empty body, so
  // check for that first (same fix as web/src/api/client.ts).
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}
