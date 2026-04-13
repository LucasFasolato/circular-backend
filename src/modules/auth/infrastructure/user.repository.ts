import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserEntity } from '../domain/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findByPhone(phoneE164: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { phoneE164 } });
  }

  async create(
    data: Partial<UserEntity>,
    manager?: EntityManager,
  ): Promise<UserEntity> {
    const repo = manager ? manager.getRepository(UserEntity) : this.repo;
    const user = repo.create(data);
    return repo.save(user);
  }

  async save(user: UserEntity, manager?: EntityManager): Promise<UserEntity> {
    const repo = manager ? manager.getRepository(UserEntity) : this.repo;
    return repo.save(user);
  }
}
