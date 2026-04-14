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
    return repo.save(repo.create(data));
  }

  async save(
    entity: ConversationThreadEntity,
    manager?: EntityManager,
  ): Promise<ConversationThreadEntity> {
    const repo = manager
      ? manager.getRepository(ConversationThreadEntity)
      : this.repo;
    return repo.save(entity);
  }

  async findByMatchSessionId(
    matchSessionId: string,
    manager?: EntityManager,
  ): Promise<ConversationThreadEntity | null> {
    const repo = manager
      ? manager.getRepository(ConversationThreadEntity)
      : this.repo;
    return repo.findOne({ where: { matchSessionId } });
  }

  async findByMatchSessionIdForUpdate(
    matchSessionId: string,
    manager: EntityManager,
  ): Promise<ConversationThreadEntity | null> {
    return manager
      .getRepository(ConversationThreadEntity)
      .createQueryBuilder('conversation')
      .setLock('pessimistic_write')
      .where('conversation.match_session_id = :matchSessionId', {
        matchSessionId,
      })
      .getOne();
  }

  async findByIdForUpdate(
    conversationId: string,
    manager: EntityManager,
  ): Promise<ConversationThreadEntity | null> {
    return manager
      .getRepository(ConversationThreadEntity)
      .createQueryBuilder('conversation')
      .setLock('pessimistic_write')
      .where('conversation.id = :conversationId', { conversationId })
      .getOne();
  }
}
