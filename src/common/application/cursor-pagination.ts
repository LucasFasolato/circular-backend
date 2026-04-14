import { ValidationAppError } from '../errors/validation-app.error';

export function encodeCursor<T extends Record<string, string>>(
  payload: T,
): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

export function decodeCursor<T extends Record<string, unknown>>(
  cursor: string,
): T {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    return JSON.parse(raw) as T;
  } catch {
    throw new ValidationAppError('Invalid cursor', [
      { field: 'cursor', message: 'cursor must be a valid opaque cursor' },
    ]);
  }
}
