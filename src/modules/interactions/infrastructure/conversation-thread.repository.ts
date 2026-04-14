import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ConversationThreadEntity } from '../domain/conversation-thread.entity';

@Injectable()
export class ConversationThreadRepository {
  constructor(
    @InjectRepository(ConversationThreadEntity)
    private readonly repo: Repository<ConversationThreadEntity>,
  ) {}

  async create(
    data: Partial<ConversationThreadEntity>,
    manager?: EntityManager,
  ): Promise<ConversationThreadEntity> {
    const repo = manager
      ? manager.getRepository(ConversationThreadEntity)
      : this.repo;
    const entity = repo.create(data);
    return repo.save(entity);
  }
}
