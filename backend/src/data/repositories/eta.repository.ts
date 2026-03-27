import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ETAModel } from '../models/eta.model';
import { ETAMapper } from '../mappers/eta.mapper';
import { ETA } from '../../domain/entities/eta.entity';
import { IETARepository } from '../../domain/repositories/eta.repository.interface';

@Injectable()
export class ETARepository implements IETARepository {
  constructor(
    @InjectRepository(ETAModel)
    private readonly repository: Repository<ETAModel>,
  ) {}

  async save(eta: ETA | Omit<ETA, 'id'>): Promise<ETA> {
    const model = this.repository.create(ETAMapper.toPersistence(eta));
    const saved = await this.repository.save(model);
    return ETAMapper.toDomain(saved);
  }

  async findById(id: string): Promise<ETA | null> {
    const model = await this.repository.findOne({ where: { id } });
    return model ? ETAMapper.toDomain(model) : null;
  }

  async findLatestByParentId(parentId: string): Promise<ETA | null> {
    const model = await this.repository.findOne({
      where: { parentId },
      order: { calculatedAt: 'DESC' },
    });
    return model ? ETAMapper.toDomain(model) : null;
  }

  async findBySchoolId(schoolId: string): Promise<ETA[]> {
    const models = await this.repository.find({
      where: { schoolId },
      order: { calculatedAt: 'DESC' },
    });
    return models.map(ETAMapper.toDomain);
  }

  async findLatestBulkByParentIds(
    parentIds: string[],
  ): Promise<Map<string, ETA>> {
    if (parentIds.length === 0) {
      return new Map();
    }

    // Get latest ETA per parent ID using raw SQL for efficiency
    const models = await this.repository
      .createQueryBuilder('eta')
      .where('eta.parentId IN (:...parentIds)', { parentIds })
      .orderBy('eta.parentId', 'ASC')
      .addOrderBy('eta.calculatedAt', 'DESC')
      .getMany();

    // Group by parentId, keeping only the latest (first) per parent
    const resultMap = new Map<string, ETA>();
    const seenParentIds = new Set<string>();

    for (const model of models) {
      if (!seenParentIds.has(model.parentId)) {
        resultMap.set(model.parentId, ETAMapper.toDomain(model));
        seenParentIds.add(model.parentId);
      }
    }

    return resultMap;
  }

  async deleteByParentId(parentId: string): Promise<void> {
    await this.repository.delete({ parentId });
  }
}
