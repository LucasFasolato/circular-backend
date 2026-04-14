import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MatchExpirationService } from '../modules/matches/application/match-expiration.service';
import { SystemIntegrityAuditService } from '../modules/matches/application/system-integrity-audit.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const expirationService = app.get(MatchExpirationService);
    const auditService = app.get(SystemIntegrityAuditService);

    const expirationResult = await expirationService.expireDueMatches();
    const auditResult = await auditService.run();

    console.log(
      JSON.stringify(
        {
          success: true,
          data: {
            expiration: expirationResult,
            audit: auditResult,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

bootstrap().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }),
  );
  process.exit(1);
});
