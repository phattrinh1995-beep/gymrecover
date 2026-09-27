import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service.js';

function makeService(key = 'ZGV2LW9ubHktZW5jcnlwdGlvbi1rZXktMzJieXRlcyE='): EncryptionService {
  const config = { get: () => key } as unknown as ConfigService;
  return new EncryptionService(config);
}

describe('EncryptionService', () => {
  it('round-trips a plaintext string', () => {
    const service = makeService();
    const ciphertext = service.encrypt('sensitive diagnosis text');
    expect(ciphertext).not.toContain('sensitive');
    expect(service.decrypt(ciphertext)).toBe('sensitive diagnosis text');
  });

  it('round-trips JSON values', () => {
    const service = makeService();
    const payload = { q1: 'no pain', q2: 3 };
    const ciphertext = service.encryptJson(payload);
    expect(service.decryptJson(ciphertext)).toEqual(payload);
  });

  it('produces different ciphertext for the same plaintext (random IV)', () => {
    const service = makeService();
    const a = service.encrypt('same input');
    const b = service.encrypt('same input');
    expect(a).not.toBe(b);
  });

  it('throws on a malformed payload', () => {
    const service = makeService();
    expect(() => service.decrypt('not-a-valid-payload')).toThrow();
  });

  it('throws at construction if the key is not 32 bytes', () => {
    expect(() => makeService(Buffer.from('too-short').toString('base64'))).toThrow();
  });
});
