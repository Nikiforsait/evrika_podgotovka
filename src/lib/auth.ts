// Registration rules and password hashing (PBKDF2 via Web Crypto; works in browsers and Node).

export interface RegistrationInput {
  email: string;
  name: string;
  password: string;
}

export type FieldErrors = Partial<Record<keyof RegistrationInput, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const NAME_MAX = 24;
export const PASSWORD_MIN = 8;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Validate the registration form. Returns an empty object when everything is fine. */
export function validateRegistration(input: RegistrationInput): FieldErrors {
  const errors: FieldErrors = {};
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  if (!email) errors.email = 'Введите почту.';
  else if (!EMAIL.test(email)) errors.email = 'Похоже, в адресе ошибка. Пример: name@example.com';
  if (!name) errors.name = 'Введите имя.';
  else if (name.length < 2) errors.name = 'Имя слишком короткое.';
  else if (name.length > NAME_MAX) errors.name = `Имя не длиннее ${NAME_MAX} символов.`;
  if (!input.password) errors.password = 'Придумайте пароль.';
  else if (input.password.length < PASSWORD_MIN) errors.password = `Пароль не короче ${PASSWORD_MIN} символов.`;
  else if (!/\d/.test(input.password) || !/[^\d]/.test(input.password)) errors.password = 'В пароле нужны и буквы, и цифры.';
  return errors;
}

/** 0–3: how strong the password looks, for the strength meter. */
export function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= PASSWORD_MIN) score++;
  if (password.length >= 12) score++;
  if (/\d/.test(password) && /[a-zA-Zа-яА-Я]/.test(password)) score++;
  if (/[^\w\sа-яА-Я]/.test(password)) score++;
  return Math.min(3, score);
}

const subtle = () => globalThis.crypto.subtle;
const toHex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');

export function makeSalt(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return toHex(bytes.buffer);
}

/** PBKDF2-SHA-256, 100 000 iterations. Returns a hex string. */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const key = await subtle().importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await subtle().deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(salt), iterations: 100_000 },
    key,
    256,
  );
  return toHex(bits);
}

/** Constant-time string comparison, so timing doesn't leak how many characters matched. */
export function timingSafeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export async function verifyPassword(password: string, salt: string, hash: string): Promise<boolean> {
  return timingSafeEqual(await hashPassword(password, salt), hash);
}
