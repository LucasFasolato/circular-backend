/**
 * TypeORM CLI datasource.
 *
 * Used exclusively by the TypeORM CLI (migration:generate, migration:run, etc.).
 * The NestJS application uses its own TypeORM config via database.config.ts.
 *
 * Usage:
 *   npx typeorm-ts-node-commonjs -d src/database/data-source.ts migration:run
 */
import 'dotenv/config';
import { join } from 'path';
import { DataSource } from 'typeorm';

const isCompiled = __filename.endsWith('.js');

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env['DATABASE_HOST'] ?? 'localhost',
  port: parseInt(process.env['DATABASE_PORT'] ?? '5432', 10),
  username: process.env['DATABASE_USER'] ?? 'postgres',
  password: process.env['DATABASE_PASSWORD'] ?? 'postgres',
  database: process.env['DATABASE_NAME'] ?? 'circular_db',

  /**
   * Entity discovery: glob resolves relative to the directory of this file.
   * When running via ts-node:  src/database → src/**\/*.entity.ts
   * When running from dist:    dist/database → dist/**\/*.entity.js
   */
  entities: [
    join(__dirname, '..', '**', isCompiled ? '*.entity.js' : '*.entity.ts'),
  ],

  /**
   * Migration files: always colocated in src/database/migrations/.
   */
  migrations: [join(__dirname, 'migrations', isCompiled ? '*.js' : '*.ts')],

  synchronize: false,
  logging: ['query', 'error', 'schema'],

  ssl:
    process.env['NODE_ENV'] === 'production'
      ? { rejectUnauthorized: false }
      : false,
});
