import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthResponseDto } from './dto/health-response.dto';
import { AppConfig } from '../../config/app.config';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  check(): HealthResponseDto {
    const appConf = this.configService.get<AppConfig>('app');

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: appConf?.name ?? 'circular-backend',
      version: appConf?.version ?? '0.1.0',
      environment: appConf?.nodeEnv ?? 'development',
    };
  }
}
