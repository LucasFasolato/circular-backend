import { AppError, ErrorDetail } from './app.error';

export class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 401;

  constructor(message: string, details: ErrorDetail[] = []) {
    super(message, details);
  }
}
