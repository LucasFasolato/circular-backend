import { Injectable } from '@nestjs/common';
import {
  decodeCursor,
  encodeCursor,
} from '../../../common/application/cursor-pagination';
import { withResponseMeta } from '../../../common/application/response-meta';
import { ValidationAppError } from '../../../common/errors/validation-app.error';
import { LISTING_LIMITS } from '../../listings/domain/listing-limits.constants';
import { InteractionType } from '../domain/interaction-type.enum';
import {
  IncomingInteractionsCursor,
  IncomingInteractionsReadRepository,
} from '../infrastructure/incoming-interactions-read.repository';
import { IncomingInteractionsResponseDto } from '../presentation/dto/incoming-interactions-response.dto';
import {
  IncomingInteractionsTypeFilter,
  ListIncomingInteractionsQueryDto,
} from '../presentation/dto/list-incoming-interactions-query.dto';
import { IncomingInteractionItemBuilder } from '../read-models/incoming-interaction-item.builder';

@Injectable()
export class IncomingInteractionsQueryService {
  constructor(
    private readonly incomingInteractionsReadRepository: IncomingInteractionsReadRepository,
    private readonly incomingInteractionItemBuilder: IncomingInteractionItemBuilder,
  ) {}

  async execute(ownerUserId: string, query: ListIncomingInteractionsQueryDto) {
    const limit = query.limit ?? LISTING_LIMITS.DEFAULT_LIST_LIMIT;
    const cursor = query.cursor
      ? this.decodeIncomingCursor(query.cursor)
      : undefined;
    const rows = await this.incomingInteractionsReadRepository.findIncomingPage(
      {
        ownerUserId,
        type: query.type ?? IncomingInteractionsTypeFilter.ALL,
        limit: limit + 1,
        cursor,
      },
    );

    const hasMore = rows.length > limit;
    const pageItems = hasMore ? rows.slice(0, limit) : rows;
    const items = pageItems.map((item) =>
      this.incomingInteractionItemBuilder.build(item),
    );
    const lastItem = pageItems.at(-1);

    return withResponseMeta<IncomingInteractionsResponseDto>(
      { items },
      {
        nextCursor:
          hasMore && lastItem
            ? encodeCursor({
                createdAt: lastItem.createdAt,
                interactionType: lastItem.interactionType,
                id: lastItem.id,
              })
            : null,
      },
    );
  }

  private decodeIncomingCursor(cursor: string): IncomingInteractionsCursor {
    const parsed = decodeCursor<Partial<IncomingInteractionsCursor>>(cursor);

    if (
      typeof parsed.createdAt !== 'string' ||
      typeof parsed.id !== 'string' ||
      !Object.values(InteractionType).includes(
        parsed.interactionType as InteractionType,
      )
    ) {
      throw new ValidationAppError('Invalid cursor', [
        {
          field: 'cursor',
          message:
            'cursor must contain createdAt, interactionType and id for incoming interactions',
        },
      ]);
    }

    return {
      createdAt: parsed.createdAt,
      interactionType: parsed.interactionType as InteractionType,
      id: parsed.id,
    };
  }
}
