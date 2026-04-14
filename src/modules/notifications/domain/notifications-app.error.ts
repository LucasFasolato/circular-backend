import { AppError, ErrorDetail } from '../../../common/errors/app.error';

export class NotificationsAppError extends AppError {
  constructor(
    readonly code: string,
    readonly statusCode: number,
    message: string,
    details: ErrorDetail[] = [],
  ) {
    super(message, details);
  }
}
