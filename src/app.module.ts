import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { validateEnv } from './config/env.validation';
import { appConfig } from './config/app.config';
import { authConfig } from './config/auth.config';
import { databaseConfig } from './config/database.config';
import { HealthModule } from './modules/health/health.module';
import { ListingsModule } from './modules/listings/listings.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { InteractionsModule } from './modules/interactions/interactions.module';
import { MatchesModule } from './modules/matches/matches.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReputationModule } from './modules/reputation/reputation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [appConfig, authConfig, databaseConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const dbConf = configService.get<TypeOrmModuleOptions>('database');

        if (!dbConf) {
          throw new Error('Database configuration is missing');
        }

        return dbConf;
      },
    }),
    HealthModule,
    AuthModule,
    ProfilesModule,
    ReputationModule,
    ListingsModule,
    DiscoveryModule,
    NotificationsModule,
    MatchesModule,
    InteractionsModule,
    ModerationModule,
  ],
})
export class AppModule {}
