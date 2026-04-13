import { AppError, ErrorDetail } from './app.error';

export class ConflictError extends AppError {
  readonly code = 'CONFLICT';
  readonly statusCode = 409;

  constructor(message: string, details: ErrorDetail[] = []) {
    super(message, details);
  }
}
