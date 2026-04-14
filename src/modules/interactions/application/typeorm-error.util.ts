import { QueryFailedError } from 'typeorm';

interface PostgresErrorLike {
  code?: string;
  constraint?: string;
}

export function isUniqueViolation(
  error: unknown,
  constraintName?: string,
): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }

  const driverError = error.driverError as PostgresErrorLike;
  if (driverError?.code !== '23505') {
    return false;
  }

  if (!constraintName) {
    return true;
  }

  return driverError.constraint === constraintName;
}
