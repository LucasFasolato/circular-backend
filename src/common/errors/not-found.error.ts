import { AppError, ErrorDetail } from './app.error';

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;

  constructor(message: string, details: ErrorDetail[] = []) {
    super(message, details);
  }
}
