import { AppError, ErrorDetail } from './app.error';

export class ForbiddenError extends AppError {
  readonly code = 'FORBIDDEN';
  readonly statusCode = 403;

  constructor(message: string, details: ErrorDetail[] = []) {
    super(message, details);
  }
}
