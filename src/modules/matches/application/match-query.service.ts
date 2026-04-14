import { Injectable } from '@nestjs/common';
import {
  decodeCursor,
  encodeCursor,
} from '../../../common/application/cursor-pagination';
import { withResponseMeta } from '../../../common/application/response-meta';
import { ValidationAppError } from '../../../common/errors/validation-app.error';
import {
  conversationNotFoundError,
  matchNotFoundError,
} from '../domain/match-errors';
import { MATCH_LIMITS } from '../domain/match-limits.constants';
import { ConversationMessageRepository } from '../infrastructure/conversation-message.repository';
import {
  MatchReadRepository,
  MatchSessionCursor,
} from '../infrastructure/match-read.repository';
import { ConversationMessagesResponseDto } from '../presentation/dto/conversation-response.dto';
import { ListConversationMessagesQueryDto } from '../presentation/dto/list-conversation-messages-query.dto';
import { ListMyMatchesQueryDto } from '../presentation/dto/list-my-matches-query.dto';
import {
  MatchDetailResponseDto,
  MyMatchesResponseDto,
} from '../presentation/dto/match-response.dto';
import { MatchSurfaceBuilder } from '../read-models/match-surface.builder';

@Injectable()
export class MatchQueryService {
  constructor(
    private readonly matchReadRepository: MatchReadRepository,
    private readonly conversationMessageRepository: ConversationMessageRepository,
    private readonly matchSurfaceBuilder: MatchSurfaceBuilder,
  ) {}

  async getMine(viewerUserId: string, query: ListMyMatchesQueryDto) {
    const limit = query.limit ?? MATCH_LIMITS.DEFAULT_LIST_LIMIT;
    const cursor = query.cursor
      ? this.decodeMatchCursor(query.cursor)
      : undefined;
    const matches = await this.matchReadRepository.findMyMatchesPage({
      viewerUserId,
      limit: limit + 1,
      cursor,
    });
    const hasMore = matches.length > limit;
    const pageItems = hasMore ? matches.slice(0, limit) : matches;
    const lastItem = pageItems.at(-1);

    return withResponseMeta<MyMatchesResponseDto>(
      {
        items: pageItems.map((match) =>
          this.matchSurfaceBuilder.buildItem(match, viewerUserId),
        ),
      },
      {
        nextCursor:
          hasMore && lastItem
            ? encodeCursor({
                createdAt: lastItem.createdAt,
                id: lastItem.id,
              })
            : null,
      },
    );
  }

  async getById(
    viewerUserId: string,
    matchSessionId: string,
  ): Promise<MatchDetailResponseDto> {
    const match = await this.matchReadRepository.findMatchByIdForViewer(
      viewerUserId,
      matchSessionId,
    );

    if (!match) {
      throw matchNotFoundError();
    }

    return this.matchSurfaceBuilder.buildDetail(match, viewerUserId);
  }

  async getConversationMessages(
    viewerUserId: string,
    conversationId: string,
    query: ListConversationMessagesQueryDto,
  ) {
    const match =
      await this.matchReadRepository.findMatchByConversationIdForViewer(
        viewerUserId,
        conversationId,
      );

    if (!match) {
      throw conversationNotFoundError();
    }

    const limit = query.limit ?? 50;
    const cursor = query.cursor
      ? this.decodeConversationCursor(query.cursor)
      : undefined;
    const messages =
      await this.conversationMessageRepository.findPageByConversationId(
        conversationId,
        limit + 1,
        cursor,
      );
    const hasMore = messages.length > limit;
    const pageItems = hasMore ? messages.slice(0, limit) : messages;
    const lastItem = pageItems.at(-1);

    return withResponseMeta<ConversationMessagesResponseDto>(
      this.matchSurfaceBuilder.buildConversationMessages({
        snapshot: match,
        messages: pageItems.map((message) => ({
          id: message.id,
          type: message.messageType as never,
          text: message.textBody,
          quickActionCode: message.quickActionCode as never,
          createdAt: message.createdAt.toISOString(),
          metadata: message.metadata,
          sender: {
            id: message.senderUserId,
            firstName: null,
          },
        })),
        viewerUserId,
      }),
      {
        nextCursor:
          hasMore && lastItem
            ? encodeCursor({
                createdAt: lastItem.createdAt.toISOString(),
                id: lastItem.id,
              })
            : null,
      },
    );
  }

  private decodeMatchCursor(cursor: string): MatchSessionCursor {
    const parsed = decodeCursor<Partial<MatchSessionCursor>>(cursor);

    if (
      typeof parsed.createdAt !== 'string' ||
      parsed.createdAt.length === 0 ||
      typeof parsed.id !== 'string' ||
      parsed.id.length === 0
    ) {
      throw new ValidationAppError('Invalid cursor', [
        { field: 'cursor', message: 'cursor must contain createdAt and id' },
      ]);
    }

    return {
      createdAt: parsed.createdAt,
      id: parsed.id,
    };
  }

  private decodeConversationCursor(cursor: string): {
    createdAt: string;
    id: string;
  } {
    const parsed =
      decodeCursor<Partial<{ createdAt: string; id: string }>>(cursor);

    if (
      typeof parsed.createdAt !== 'string' ||
      parsed.createdAt.length === 0 ||
      typeof parsed.id !== 'string' ||
      parsed.id.length === 0
    ) {
      throw new ValidationAppError('Invalid cursor', [
        { field: 'cursor', message: 'cursor must contain createdAt and id' },
      ]);
    }

    return {
      createdAt: parsed.createdAt,
      id: parsed.id,
    };
  }
}
