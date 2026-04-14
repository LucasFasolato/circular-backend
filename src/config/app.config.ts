import { registerAs } from '@nestjs/config';
import { execSync } from 'child_process';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  name: string;
  version: string;
  commitSha: string;
}

function resolveCommitSha(): string {
  const explicitCommitSha =
    process.env['APP_COMMIT_SHA'] ?? process.env['COMMIT_SHA'];

  if (explicitCommitSha) {
    return explicitCommitSha;
  }

  try {
    return execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString('utf8')
      .trim();
  } catch {
    return 'unknown';
  }
}

export const appConfig = registerAs(
  'app',
  (): AppConfig => ({
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    port: parseInt(process.env['PORT'] ?? '3000', 10),
    name: process.env['APP_NAME'] ?? 'circular-backend',
    version: process.env['APP_VERSION'] ?? '0.1.0',
    commitSha: resolveCommitSha(),
  }),
);
