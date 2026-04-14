import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    APP_NAME: z.string().min(1).default('circular-backend'),
    APP_VERSION: z.string().min(1).default('0.1.0'),
    APP_COMMIT_SHA: z.string().min(1).optional(),
    COMMIT_SHA: z.string().min(1).optional(),

    // -------------------------------------------------------------------------
    // Database — either a full URL or individual connection params.
    // DATABASE_URL takes precedence when present.
    // -------------------------------------------------------------------------
    DATABASE_URL: z.string().optional(),

    DATABASE_HOST: z.string().min(1).optional(),
    DATABASE_PORT: z.coerce.number().int().positive().default(5432),
    DATABASE_USER: z.string().min(1).optional(),
    DATABASE_PASSWORD: z.string().min(1).optional(),
    DATABASE_NAME: z.string().min(1).optional(),

    /**
     * Explicit SSL toggle.
     * When omitted, SSL is auto-enabled for non-local, non-dev environments.
     * Accepts the literal strings "true" / "false" from .env files.
     */
    DATABASE_SSL: z
      .preprocess((v) => {
        if (v === 'true') return true;
        if (v === 'false') return false;
        return v;
      }, z.boolean().optional())
      .optional(),

    // -------------------------------------------------------------------------
    // JWT
    // -------------------------------------------------------------------------
    JWT_ACCESS_SECRET: z.string().min(16),
    JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
    JWT_REFRESH_SECRET: z.string().min(16),
    JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('7d'),
  })
  .superRefine((data, ctx) => {
    // When DATABASE_URL is absent, all individual connection params are required.
    if (!data.DATABASE_URL) {
      const required: Array<keyof typeof data> = [
        'DATABASE_HOST',
        'DATABASE_USER',
        'DATABASE_PASSWORD',
        'DATABASE_NAME',
      ];

      for (const field of required) {
        if (!data[field]) {
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: `Required when DATABASE_URL is not set`,
          });
        }
      }
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  [${issue.path.join('.')}] ${issue.message}`)
      .join('\n');

    throw new Error(
      `Environment validation failed:\n${formatted}\n\nProvide either DATABASE_URL or DATABASE_HOST + DATABASE_USER + DATABASE_PASSWORD + DATABASE_NAME.`,
    );
  }

  return result.data;
}
