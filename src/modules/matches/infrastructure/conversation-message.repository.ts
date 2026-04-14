import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, Repository } from 'typeorm';
import { ConversationMessageEntity } from '../domain/conversation-message.entity';

export interface ConversationMessagesCursor {
  createdAt: string;
  id: string;
}

@Injectable()
export class ConversationMessageRepository {
  constructor(
    @InjectRepository(ConversationMessageEntity)
    private readonly repo: Repository<ConversationMessageEntity>,
  ) {}

  async create(
    data: Partial<ConversationMessageEntity>,
    manager?: EntityManager,
  ): Promise<ConversationMessageEntity> {
    const repo = manager
      ? manager.getRepository(ConversationMessageEntity)
      : this.repo;
    return repo.save(repo.create(data));
  }

  async findPageByConversationId(
    conversationId: string,
    limit: number,
    cursor?: ConversationMessagesCursor,
  ): Promise<ConversationMessageEntity[]> {
    const qb = this.repo
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.senderUser', 'senderUser')
      .where('message.conversationThreadId = :conversationId', {
        conversationId,
      })
      .orderBy('message.createdAt', 'ASC')
      .addOrderBy('message.id', 'ASC')
      .take(limit);

    if (cursor) {
      qb.andWhere(
        new Brackets((where) => {
          where
            .where('message.createdAt > :cursorCreatedAt', {
              cursorCreatedAt: cursor.createdAt,
            })
            .orWhere(
              'message.createdAt = :cursorCreatedAt AND message.id > :cursorId',
              {
                cursorCreatedAt: cursor.createdAt,
                cursorId: cursor.id,
              },
            );
        }),
      );
    }

    return qb.getMany();
  }

  async findById(messageId: string): Promise<ConversationMessageEntity | null> {
    return this.repo.findOne({
      where: { id: messageId },
      relations: ['senderUser'],
    });
  }
}
