import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/**
 * Application-level field encryption for sensitive health data (diagnosis text, PROM answers,
 * etc.) so it is unreadable directly from a database dump/backup, independent of disk-level
 * encryption the hosting provider offers.
 *
 * Dev/demo key comes from FIELD_ENCRYPTION_KEY (.env). In production this must be replaced by a
 * key issued and rotated through a real KMS (AWS KMS / GCP KMS) — this service only handles the
 * envelope format, not key management.
 */
@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(private readonly config: ConfigService) {
    const base64Key = this.config.get<string>('FIELD_ENCRYPTION_KEY');
    if (!base64Key) {
      throw new Error('FIELD_ENCRYPTION_KEY is not set');
    }
    this.key = Buffer.from(base64Key, 'base64');
    if (this.key.length !== 32) {
      throw new Error('FIELD_ENCRYPTION_KEY must decode to exactly 32 bytes');
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv, authTag, ciphertext].map((b) => b.toString('base64')).join('.');
  }

  decrypt(payload: string): string {
    const [ivB64, authTagB64, ciphertextB64] = payload.split('.');
    if (!ivB64 || !authTagB64 || !ciphertextB64) {
      throw new Error('Malformed encrypted payload');
    }
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }

  encryptJson(value: unknown): string {
    return this.encrypt(JSON.stringify(value));
  }

  decryptJson<T = unknown>(payload: string): T {
    return JSON.parse(this.decrypt(payload)) as T;
  }
}
