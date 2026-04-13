import { AppError, ErrorDetail } from './app.error';

export class ValidationAppError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 422;

  constructor(message: string, details: ErrorDetail[] = []) {
    super(message, details);
  }
}
