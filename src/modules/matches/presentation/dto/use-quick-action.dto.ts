import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { QuickActionCode } from '../../domain/quick-action-code.enum';

export class UseQuickActionDto {
  @ApiProperty({ enum: QuickActionCode })
  @IsEnum(QuickActionCode)
  action: QuickActionCode;
}
