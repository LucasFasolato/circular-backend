import { Brackets } from 'typeorm';
import { DiscoveryFeedRepository } from './discovery-feed.repository';
import { DiscoveryFeedMode } from '../domain/discovery-feed-mode.enum';

function createQueryBuilderMock() {
  const qb = {
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue([]),
  };

  return qb;
}

describe('DiscoveryFeedRepository', () => {
  it('applies published, owner, dismissed and filter constraints to swipe feed queries', async () => {
    const listingsQb = createQueryBuilderMock();
    const repository = new DiscoveryFeedRepository(
      {
        createQueryBuilder: jest.fn().mockReturnValue(listingsQb),
      } as never,
      {
        createQueryBuilder: jest.fn(),
      } as never,
    );

    await repository.findFeedPage({
      viewerUserId: 'usr-1',
      limit: 21,
      category: 'TOPS',
      size: 'M',
      city: 'Rosario',
      zone: 'Centro',
      mode: DiscoveryFeedMode.BOTH,
      cursor: {
        publishedAt: '2026-04-13T12:00:00.000Z',
        id: 'lst-99',
      },
    });

    expect(listingsQb.where).toHaveBeenCalledWith(
      'listing.state = :publishedState',
      { publishedState: 'PUBLISHED' },
    );
    expect(listingsQb.andWhere).toHaveBeenCalledWith(
      'listing.archived_at IS NULL',
    );
    expect(listingsQb.andWhere).toHaveBeenCalledWith(
      'listing.owner_user_id <> :viewerUserId',
      { viewerUserId: 'usr-1' },
    );
    expect(listingsQb.andWhere).toHaveBeenCalledWith('dismissal.id IS NULL');
    expect(listingsQb.andWhere).toHaveBeenCalledWith(
      'garment.category = :category',
      { category: 'TOPS' },
    );
    expect(listingsQb.andWhere).toHaveBeenCalledWith('garment.size = :size', {
      size: 'M',
    });
    expect(listingsQb.andWhere).toHaveBeenCalledWith('listing.city = :city', {
      city: 'Rosario',
    });
    expect(listingsQb.andWhere).toHaveBeenCalledWith('listing.zone = :zone', {
      zone: 'Centro',
    });
    expect(listingsQb.andWhere).toHaveBeenCalledWith(expect.any(Brackets));
  });

  it('applies saved-listing ownership and published visibility constraints', async () => {
    const savedQb = createQueryBuilderMock();
    const repository = new DiscoveryFeedRepository(
      {
        createQueryBuilder: jest.fn(),
      } as never,
      {
        createQueryBuilder: jest.fn().mockReturnValue(savedQb),
      } as never,
    );

    await repository.findSavedPage({
      viewerUserId: 'usr-1',
      limit: 21,
    });

    expect(savedQb.where).toHaveBeenCalledWith(
      'savedListing.user_id = :viewerUserId',
      { viewerUserId: 'usr-1' },
    );
    expect(savedQb.andWhere).toHaveBeenCalledWith(
      'listing.state = :publishedState',
      { publishedState: 'PUBLISHED' },
    );
    expect(savedQb.andWhere).toHaveBeenCalledWith(
      'listing.archived_at IS NULL',
    );
  });
});
