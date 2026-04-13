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
import { SessionRepository } from '../infrastructure/session.repository';
import { RegisterDto } from '../presentation/dto/register.dto';
import { LoginDto } from '../presentation/dto/login.dto';
import { AuthTokensDto } from '../presentation/dto/auth-tokens.dto';
import { UserProfileDto } from '../presentation/dto/user-profile.dto';
import { UserEntity, UserStatus } from '../domain/user.entity';
import { JwtPayload } from '../../../shared/jwt-payload.interface';

interface SessionMeta {
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokensDto> {
    const existingByEmail = await this.userRepo.findByEmail(
      dto.email.toLowerCase(),
    );
    if (existingByEmail) {
      throw new ConflictError('Email is already registered', [
        { field: 'email', message: 'A user with this email already exists' },
      ]);
    }

    const existingByPhone = await this.userRepo.findByPhone(dto.phone);
    if (existingByPhone) {
      throw new ConflictError('Phone number is already registered', [
        { field: 'phone', message: 'A user with this phone already exists' },
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
      phoneE164: dto.phone,
      passwordHash,
      isPhoneVerified: false,
      status: UserStatus.ACTIVE,
    });

    return this.issueTokenPair(user);
  }

  async login(dto: LoginDto, meta?: SessionMeta): Promise<AuthTokensDto> {
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
    meta?: SessionMeta,
  ): Promise<AuthTokensDto> {
    const tokenHash = this.hashToken(rawRefreshToken);
    const session = await this.sessionRepo.findActiveByTokenHash(tokenHash);

    if (!session) {
      throw new UnauthorizedError('Invalid or revoked refresh token');
    }

    if (session.expiresAt < new Date()) {
      // Expired but not yet cleaned — revoke it now
      await this.sessionRepo.revokeById(session.id);
      throw new UnauthorizedError('Refresh token has expired');
    }

    const user = session.user;

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('Account is not active');
    }

    // Rotate: revoke the consumed session before issuing a new one
    await this.sessionRepo.revokeById(session.id);

    return this.issueTokenPair(user, meta);
  }

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.mapToProfile(user);
  }

  /**
   * Revokes all active sessions for the user (logout from all devices).
   */
  async logout(userId: string): Promise<void> {
    await this.sessionRepo.revokeAllByUserId(userId);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async issueTokenPair(
    user: UserEntity,
    meta?: SessionMeta,
  ): Promise<AuthTokensDto> {
    const authConf = this.configService.get<AuthConfig>('auth');

    const accessExpiresInSeconds = parseDurationToSeconds(
      authConf?.accessExpiresIn ?? '15m',
    );

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: authConf?.accessSecret,
      expiresIn: accessExpiresInSeconds,
    });

    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const refreshExpiresInSeconds = parseDurationToSeconds(
      authConf?.refreshExpiresIn ?? '7d',
    );
    const expiresAt = new Date(Date.now() + refreshExpiresInSeconds * 1000);

    await this.sessionRepo.create({
      userId: user.id,
      refreshTokenHash,
      expiresAt,
      revokedAt: null,
      ipAddress: meta?.ipAddress ?? null,
      userAgent: meta?.userAgent ?? null,
      deviceInfo: null,
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
      phone: user.phoneE164,
      isPhoneVerified: user.isPhoneVerified,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
