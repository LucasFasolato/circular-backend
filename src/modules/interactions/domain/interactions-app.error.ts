import { AppError, ErrorDetail } from '../../../common/errors/app.error';

export class InteractionsAppError extends AppError {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    details: ErrorDetail[] = [],
  ) {
    super(message, details);
  }
}
