import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '../errors/app.error';

interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details: Array<{ field?: string; message: string }>;
  };
  meta: {
    timestamp: string;
    path: string;
  };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const envelope = this.buildEnvelope(exception, request.url);

    if (envelope.error.code === 'INTERNAL_ERROR') {
      this.logger.error(
        `[${request.method}] ${request.url} → ${envelope.error.message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(this.resolveStatus(exception)).json(envelope);
  }

  private buildEnvelope(exception: unknown, path: string): ErrorEnvelope {
    const meta = {
      timestamp: new Date().toISOString(),
      path,
    };

    if (exception instanceof AppError) {
      return {
        success: false,
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
        },
        meta,
      };
    }

    if (exception instanceof UnauthorizedException) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
          details: [],
        },
        meta,
      };
    }

    if (exception instanceof HttpException) {
      const responseBody = exception.getResponse();
      const message =
        typeof responseBody === 'object' &&
        responseBody !== null &&
        'message' in responseBody
          ? Array.isArray((responseBody as Record<string, unknown>)['message'])
            ? (
                (responseBody as Record<string, unknown>)['message'] as string[]
              ).join(', ')
            : String((responseBody as Record<string, unknown>)['message'])
          : exception.message;

      const details: Array<{ field?: string; message: string }> =
        typeof responseBody === 'object' &&
        responseBody !== null &&
        'message' in responseBody &&
        Array.isArray((responseBody as Record<string, unknown>)['message'])
          ? (
              (responseBody as Record<string, unknown>)['message'] as string[]
            ).map((msg) => ({ message: msg }))
          : [];

      return {
        success: false,
        error: {
          code: this.resolveHttpCode(exception.getStatus()),
          message,
          details,
        },
        meta,
      };
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again later.',
        details: [],
      },
      meta,
    };
  }

  private resolveStatus(exception: unknown): number {
    if (exception instanceof AppError) {
      return exception.statusCode;
    }

    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveHttpCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_ERROR',
    };

    return map[status] ?? `HTTP_${status}`;
  }
}
