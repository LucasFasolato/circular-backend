/**
 * TypeORM CLI datasource.
 *
 * Used exclusively by the TypeORM CLI (migration:generate, migration:run, etc.).
 * The NestJS application uses its own config via src/config/database.config.ts.
 *
 * Usage:
 *   npm run migration:run
 *   npm run migration:revert
 *   npm run migration:generate -- src/database/migrations/MyMigrationName
 */
import 'dotenv/config';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';

// ---------------------------------------------------------------------------
// SSL resolution — mirrors database.config.ts logic exactly
// ---------------------------------------------------------------------------

type SslOption = false | { rejectUnauthorized: boolean };

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

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Build DataSourceOptions
// ---------------------------------------------------------------------------

const isCompiled = __filename.endsWith('.js');
const nodeEnv = process.env['NODE_ENV'] ?? 'development';
const databaseUrl = process.env['DATABASE_URL'];
const explicitSsl =
  process.env['DATABASE_SSL'] !== undefined
    ? process.env['DATABASE_SSL'] === 'true'
    : undefined;

const entities = [
  join(__dirname, '..', '**', isCompiled ? '*.entity.js' : '*.entity.ts'),
];
const migrations = [
  join(__dirname, 'migrations', isCompiled ? '*.js' : '*.ts'),
];

function buildDataSourceOptions(): DataSourceOptions {
  if (databaseUrl) {
    const ssl = resolveSsl(nodeEnv, hostnameFromUrl(databaseUrl), explicitSsl);
    return {
      type: 'postgres',
      url: databaseUrl,
      ssl,
      entities,
      migrations,
      synchronize: false,
      logging: ['query', 'error', 'schema'],
    };
  }

  const host = process.env['DATABASE_HOST'] ?? 'localhost';
  const ssl = resolveSsl(nodeEnv, host, explicitSsl);

  return {
    type: 'postgres',
    host,
    port: parseInt(process.env['DATABASE_PORT'] ?? '5432', 10),
    username: process.env['DATABASE_USER'] ?? 'postgres',
    password: process.env['DATABASE_PASSWORD'] ?? 'postgres',
    database: process.env['DATABASE_NAME'] ?? 'circular_db',
    ssl,
    entities,
    migrations,
    synchronize: false,
    logging: ['query', 'error', 'schema'],
  };
}

export const AppDataSource = new DataSource(buildDataSourceOptions());
