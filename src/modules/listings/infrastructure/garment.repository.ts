import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { GarmentEntity } from '../domain/garment.entity';

@Injectable()
export class GarmentRepository {
  constructor(
    @InjectRepository(GarmentEntity)
    private readonly repo: Repository<GarmentEntity>,
  ) {}

  async create(
    data: Partial<GarmentEntity>,
    manager?: EntityManager,
  ): Promise<GarmentEntity> {
    const repo = manager ? manager.getRepository(GarmentEntity) : this.repo;
    const garment = repo.create(data);
    return repo.save(garment);
  }

  async save(
    garment: GarmentEntity,
    manager?: EntityManager,
  ): Promise<GarmentEntity> {
    const repo = manager ? manager.getRepository(GarmentEntity) : this.repo;
    return repo.save(garment);
  }
}
