import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { HealthResponseDto } from './dto/health-response.dto';
import { AppConfig } from '../../config/app.config';

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async check(): Promise<HealthResponseDto> {
    const appConf = this.configService.get<AppConfig>('app');
    const startedAt = Date.now();
    let databaseStatus: 'up' | 'down' = 'up';
    let latencyMs: number | null = null;

    try {
      await this.dataSource.query('SELECT 1');
      latencyMs = Date.now() - startedAt;
    } catch {
      databaseStatus = 'down';
    }

    return {
      status: databaseStatus === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      service: appConf?.name ?? 'circular-backend',
      version: appConf?.version ?? '0.1.0',
      commitSha: appConf?.commitSha ?? 'unknown',
      environment: appConf?.nodeEnv ?? 'development',
      database: {
        status: databaseStatus,
        latencyMs,
      },
    };
  }
}
