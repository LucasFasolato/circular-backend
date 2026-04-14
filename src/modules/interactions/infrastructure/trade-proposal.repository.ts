import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { TradeProposalEntity } from '../domain/trade-proposal.entity';
import { TradeProposalState } from '../domain/trade-proposal-state.enum';

@Injectable()
export class TradeProposalRepository {
  constructor(
    @InjectRepository(TradeProposalEntity)
    private readonly repo: Repository<TradeProposalEntity>,
  ) {}

  async create(
    data: Partial<TradeProposalEntity>,
    manager?: EntityManager,
  ): Promise<TradeProposalEntity> {
    const repo = manager
      ? manager.getRepository(TradeProposalEntity)
      : this.repo;
    const entity = repo.create(data);
    return repo.save(entity);
  }

  async save(
    entity: TradeProposalEntity,
    manager?: EntityManager,
  ): Promise<TradeProposalEntity> {
    const repo = manager
      ? manager.getRepository(TradeProposalEntity)
      : this.repo;
    return repo.save(entity);
  }

  async findById(
    id: string,
    manager?: EntityManager,
  ): Promise<TradeProposalEntity | null> {
    const repo = manager
      ? manager.getRepository(TradeProposalEntity)
      : this.repo;
    return repo.findOne({ where: { id } });
  }

  async findByIdForUpdate(
    id: string,
    manager: EntityManager,
  ): Promise<TradeProposalEntity | null> {
    return manager
      .getRepository(TradeProposalEntity)
      .createQueryBuilder('tradeProposal')
      .setLock('pessimistic_write')
      .where('tradeProposal.id = :id', { id })
      .getOne();
  }

  async countActiveByProposerUserId(proposerUserId: string): Promise<number> {
    return this.repo.count({
      where: {
        proposerUserId,
        state: TradeProposalState.ACTIVE,
      },
    });
  }

  async expireActiveByTargetListingExcept(
    targetListingId: string,
    exceptId: string | null,
    resolvedByUserId: string,
    manager: EntityManager,
  ): Promise<void> {
    const query = manager
      .createQueryBuilder()
      .update(TradeProposalEntity)
      .set({
        state: TradeProposalState.EXPIRED,
        expiresAt: () => 'NOW()' as never,
        updatedAt: () => 'NOW()' as never,
        resolvedByUserId,
      })
      .where('target_listing_id = :targetListingId', { targetListingId })
      .andWhere('state = :activeState', {
        activeState: TradeProposalState.ACTIVE,
      });

    if (exceptId) {
      query.andWhere('id <> :exceptId', { exceptId });
    }

    await query.execute();
  }

  async expireActiveByProposedListingIdsExcept(
    proposedListingIds: string[],
    exceptId: string,
    resolvedByUserId: string,
    manager: EntityManager,
  ): Promise<void> {
    if (proposedListingIds.length === 0) {
      return;
    }

    await manager.query(
      `
        UPDATE "trade_proposals"
        SET
          "state" = $1,
          "expires_at" = NOW(),
          "resolved_by_user_id" = $2,
          "updated_at" = NOW()
        WHERE "id" IN (
          SELECT DISTINCT "trade_proposal_id"
          FROM "trade_proposal_items"
          WHERE "proposed_listing_id" = ANY($3::uuid[])
        )
          AND "id" <> $4
          AND "state" = $5
      `,
      [
        TradeProposalState.EXPIRED,
        resolvedByUserId,
        proposedListingIds,
        exceptId,
        TradeProposalState.ACTIVE,
      ],
    );
  }
}
