import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { ConflictError } from '../../../common/errors/conflict.error';
import { UnauthorizedError } from '../../../common/errors/unauthorized.error';
import { NotFoundError } from '../../../common/errors/not-found.error';
import { AuthConfig } from '../../../config/auth.config';
import { parseDurationToSeconds } from '../../../shared/parse-duration';
import { UserRepository } from '../infrastructure/user.repository';
import { RefreshTokenRepository } from '../infrastructure/refresh-token.repository';
import { RegisterDto } from '../presentation/dto/register.dto';
import { LoginDto } from '../presentation/dto/login.dto';
import { AuthTokensDto } from '../presentation/dto/auth-tokens.dto';
import { UserProfileDto } from '../presentation/dto/user-profile.dto';
import { UserEntity, UserStatus } from '../domain/user.entity';
import { JwtPayload } from '../../../shared/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokensDto> {
    const existing = await this.userRepo.findByEmail(dto.email.toLowerCase());

    if (existing) {
      throw new ConflictError('A user with this email already exists', [
        { field: 'email', message: 'Email is already registered' },
      ]);
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const user = await this.userRepo.create({
      email: dto.email.toLowerCase(),
      name: dto.name,
      passwordHash,
    });

    return this.issueTokenPair(user);
  }

  async login(
    dto: LoginDto,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthTokensDto> {
    const user = await this.userRepo.findByEmail(dto.email.toLowerCase());

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('Account is not active');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);

    if (!passwordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    return this.issueTokenPair(user, meta);
  }

  async refreshTokens(
    rawRefreshToken: string,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthTokensDto> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (!stored || stored.isRevoked) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    if (stored.expiresAt < new Date()) {
      await this.refreshTokenRepo.revokeById(stored.id);
      throw new UnauthorizedError('Refresh token has expired');
    }

    const user = stored.user;

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('Account is not active');
    }

    await this.refreshTokenRepo.revokeById(stored.id);

    return this.issueTokenPair(user, meta);
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.mapToProfile(user);
  }

  async logout(userId: string): Promise<void> {
    await this.refreshTokenRepo.revokeByUserId(userId);
  }

  private async issueTokenPair(
    user: UserEntity,
    meta?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuthTokensDto> {
    const authConf = this.configService.get<AuthConfig>('auth');

    const accessExpiresInSeconds = parseDurationToSeconds(
      authConf?.accessExpiresIn ?? '15m',
    );

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: authConf?.accessSecret,
      expiresIn: accessExpiresInSeconds,
    });

    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const refreshExpiresInSeconds = parseDurationToSeconds(
      authConf?.refreshExpiresIn ?? '7d',
    );
    const expiresAt = new Date(Date.now() + refreshExpiresInSeconds * 1000);

    await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash,
      expiresAt,
      isRevoked: false,
      ipAddress: meta?.ipAddress ?? null,
      userAgent: meta?.userAgent ?? null,
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      tokenType: 'Bearer',
      expiresIn: accessExpiresInSeconds,
    };
  }

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  private mapToProfile(user: UserEntity): UserProfileDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
