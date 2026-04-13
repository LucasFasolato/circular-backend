export interface ErrorDetail {
  field?: string;
  message: string;
}

export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  readonly details: ErrorDetail[];

  constructor(message: string, details: ErrorDetail[] = []) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): object {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}
