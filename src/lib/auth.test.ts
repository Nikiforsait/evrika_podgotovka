import { describe, expect, it } from 'vitest';
import { hashPassword, makeSalt, passwordStrength, validateRegistration, verifyPassword } from './auth.ts';

describe('registration', () => {
  it('validates email, name and password', () => {
    expect(validateRegistration({ email: 'a@b.cd', name: 'Аня', password: 'abc12345' })).toEqual({});
    const bad = validateRegistration({ email: 'nope', name: 'A', password: 'short' });
    expect(Object.keys(bad).sort()).toEqual(['email', 'name', 'password']);
    expect(validateRegistration({ email: 'a@b.cd', name: 'Аня', password: '12345678' }).password).toBeTruthy();
  });
  it('rates password strength', () => {
    expect(passwordStrength('abc')).toBe(0);
    expect(passwordStrength('abc12345')).toBe(2);
    expect(passwordStrength('abc12345!longer')).toBe(3);
  });
  it('hashes with a salt and verifies', async () => {
    const salt = makeSalt();
    const hash = await hashPassword('secret123', salt);
    expect(hash).toHaveLength(64);
    expect(await verifyPassword('secret123', salt, hash)).toBe(true);
    expect(await verifyPassword('secret124', salt, hash)).toBe(false);
    expect(await hashPassword('secret123', makeSalt())).not.toBe(hash);
  });
});
