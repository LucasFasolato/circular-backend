import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: 'circular-backend' })
  service: string;

  @ApiProperty({ example: '0.1.0' })
  version: string;

  @ApiProperty({ example: 'abc1234' })
  commitSha: string;

  @ApiProperty({ example: 'development' })
  environment: string;

  @ApiProperty({
    example: {
      status: 'up',
      latencyMs: 5,
    },
  })
  database: {
    status: 'up' | 'down';
    latencyMs: number | null;
  };
}
