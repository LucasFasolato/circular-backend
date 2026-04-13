import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './domain/user.entity';
import { RefreshTokenEntity } from './domain/refresh-token.entity';
import { UserRepository } from './infrastructure/user.repository';
import { RefreshTokenRepository } from './infrastructure/refresh-token.repository';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { JwtAuthGuard } from './infrastructure/jwt-auth.guard';
import { AuthService } from './application/auth.service';
import { AuthController } from './presentation/auth.controller';
import { AuthConfig } from '../../config/auth.config';
import { parseDurationToSeconds } from '../../shared/parse-duration';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const authConf = configService.get<AuthConfig>('auth');
        return {
          secret: authConf?.accessSecret,
          signOptions: {
            expiresIn: parseDurationToSeconds(
              authConf?.accessExpiresIn ?? '15m',
            ),
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    RefreshTokenRepository,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard, JwtStrategy],
})
export class AuthModule {}
