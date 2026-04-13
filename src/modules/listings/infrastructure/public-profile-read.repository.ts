import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicProfileEntity } from '../../profiles/domain/public-profile.entity';

@Injectable()
export class PublicProfileReadRepository {
  constructor(
    @InjectRepository(PublicProfileEntity)
    private readonly repo: Repository<PublicProfileEntity>,
  ) {}

  async findByUserId(userId: string): Promise<PublicProfileEntity | null> {
    return this.repo.findOne({ where: { userId } });
  }
}
