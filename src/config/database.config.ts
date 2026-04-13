import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

// ---------------------------------------------------------------------------
// SSL resolution
// ---------------------------------------------------------------------------

type SslOption = false | { rejectUnauthorized: boolean };

/**
 * Determines the SSL config to use.
 *
 * Priority:
 *  1. Explicit DATABASE_SSL env var.
 *  2. Auto-detect: SSL on when the host is not local AND NODE_ENV is not
 *     development/test. This covers Railway, Render, Heroku, Supabase, etc.
 */
function resolveSsl(
  nodeEnv: string,
  host: string,
  explicitSsl: boolean | undefined,
): SslOption {
  const sslEnabled =
    explicitSsl !== undefined
      ? explicitSsl
      : !isLocalHost(host) && nodeEnv !== 'development' && nodeEnv !== 'test';

  return sslEnabled ? { rejectUnauthorized: false } : false;
}

function isLocalHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

/**
 * Extract the hostname from a postgres:// URL string.
 * Falls back to empty string (which is not a local host, triggering SSL).
 */
function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Config factory
// ---------------------------------------------------------------------------

export const databaseConfig = registerAs(
  'database',
  (): TypeOrmModuleOptions => {
    const nodeEnv = process.env['NODE_ENV'] ?? 'development';
    const databaseUrl = process.env['DATABASE_URL'];
    const explicitSsl =
      process.env['DATABASE_SSL'] !== undefined
        ? process.env['DATABASE_SSL'] === 'true'
        : undefined;

    const sharedOptions: Partial<TypeOrmModuleOptions> = {
      type: 'postgres',
      entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
      migrations: [
        join(__dirname, '..', 'database', 'migrations', '*.{ts,js}'),
      ],
      synchronize: false,
      logging: nodeEnv === 'development',
    };

    if (databaseUrl) {
      const ssl = resolveSsl(
        nodeEnv,
        hostnameFromUrl(databaseUrl),
        explicitSsl,
      );
      return {
        ...sharedOptions,
        url: databaseUrl,
        ssl,
      } as TypeOrmModuleOptions;
    }

    const host = process.env['DATABASE_HOST'] ?? 'localhost';
    const ssl = resolveSsl(nodeEnv, host, explicitSsl);

    return {
      ...sharedOptions,
      host,
      port: parseInt(process.env['DATABASE_PORT'] ?? '5432', 10),
      username: process.env['DATABASE_USER'],
      password: process.env['DATABASE_PASSWORD'],
      database: process.env['DATABASE_NAME'],
      ssl,
    } as TypeOrmModuleOptions;
  },
);
