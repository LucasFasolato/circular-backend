import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ProposedListingCommitmentEntity } from '../domain/proposed-listing-commitment.entity';
import { ProposedListingCommitmentState } from '../domain/proposed-listing-commitment-state.enum';

@Injectable()
export class ProposedListingCommitmentRepository {
  constructor(
    @InjectRepository(ProposedListingCommitmentEntity)
    private readonly repo: Repository<ProposedListingCommitmentEntity>,
  ) {}

  async createMany(
    data: Array<Partial<ProposedListingCommitmentEntity>>,
    manager?: EntityManager,
  ): Promise<ProposedListingCommitmentEntity[]> {
    if (data.length === 0) {
      return [];
    }

    const repo = manager
      ? manager.getRepository(ProposedListingCommitmentEntity)
      : this.repo;
    return repo.save(repo.create(data));
  }

  async hasActiveCommitments(
    proposedListingIds: string[],
    manager?: EntityManager,
  ): Promise<boolean> {
    if (proposedListingIds.length === 0) {
      return false;
    }

    const repo = manager
      ? manager.getRepository(ProposedListingCommitmentEntity)
      : this.repo;
    const count = await repo
      .createQueryBuilder('commitment')
      .where('commitment.proposed_listing_id IN (:...proposedListingIds)', {
        proposedListingIds,
      })
      .andWhere('commitment.state IN (:...activeStates)', {
        activeStates: [
          ProposedListingCommitmentState.RESERVED_FOR_PROPOSAL,
          ProposedListingCommitmentState.COMMITTED_TO_MATCH,
        ],
      })
      .getCount();

    return count > 0;
  }

  async releaseByMatchSessionId(
    matchSessionId: string,
    manager: EntityManager,
  ): Promise<void> {
    await manager
      .createQueryBuilder()
      .update(ProposedListingCommitmentEntity)
      .set({
        state: ProposedListingCommitmentState.RELEASED,
        releasedAt: () => 'NOW()' as never,
      })
      .where('match_session_id = :matchSessionId', { matchSessionId })
      .andWhere('state IN (:...activeStates)', {
        activeStates: [
          ProposedListingCommitmentState.RESERVED_FOR_PROPOSAL,
          ProposedListingCommitmentState.COMMITTED_TO_MATCH,
        ],
      })
      .execute();
  }
}
