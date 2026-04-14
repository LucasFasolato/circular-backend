import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { TradeProposalItemEntity } from '../domain/trade-proposal-item.entity';

@Injectable()
export class TradeProposalItemRepository {
  constructor(
    @InjectRepository(TradeProposalItemEntity)
    private readonly repo: Repository<TradeProposalItemEntity>,
  ) {}

  async createMany(
    data: Array<Partial<TradeProposalItemEntity>>,
    manager?: EntityManager,
  ): Promise<TradeProposalItemEntity[]> {
    if (data.length === 0) {
      return [];
    }

    const repo = manager
      ? manager.getRepository(TradeProposalItemEntity)
      : this.repo;
    return repo.save(repo.create(data));
  }

  async findByTradeProposalId(
    tradeProposalId: string,
    manager?: EntityManager,
  ): Promise<TradeProposalItemEntity[]> {
    const repo = manager
      ? manager.getRepository(TradeProposalItemEntity)
      : this.repo;
    return repo.find({
      where: { tradeProposalId },
      relations: [
        'proposedListing',
        'proposedListing.garment',
        'proposedListing.dominantPhoto',
      ],
    });
  }

  async findByTradeProposalIds(
    tradeProposalIds: string[],
  ): Promise<TradeProposalItemEntity[]> {
    if (tradeProposalIds.length === 0) {
      return [];
    }

    return this.repo.find({
      where: { tradeProposalId: In(tradeProposalIds) },
      relations: [
        'proposedListing',
        'proposedListing.garment',
        'proposedListing.dominantPhoto',
      ],
    });
  }
}
