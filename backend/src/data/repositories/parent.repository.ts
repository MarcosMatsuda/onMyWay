import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ParentModel } from '../models/parent.model';
import { ParentMapper } from '../mappers/parent.mapper';
import { IParentRepository } from '../../domain/repositories/parent.repository.interface';
import { Parent } from '../../domain/entities/parent.entity';

@Injectable()
export class ParentRepository implements IParentRepository {
  constructor(
    @InjectRepository(ParentModel)
    private readonly parentRepository: Repository<ParentModel>,
  ) {}

  async findById(id: string): Promise<Parent | null> {
    const model = await this.parentRepository.findOne({ where: { id } });
    return model ? ParentMapper.toDomain(model) : null;
  }

  async findByEmail(email: string): Promise<Parent | null> {
    const model = await this.parentRepository.findOne({ where: { email } });
    return model ? ParentMapper.toDomain(model) : null;
  }

  async findBySchoolId(schoolId: string): Promise<Parent[]> {
    const models = await this.parentRepository.find({ where: { schoolId } });
    return models.map(ParentMapper.toDomain);
  }

  async create(
    data: Omit<Parent, 'id' | 'createdAt'> & { passwordHash: string },
  ): Promise<Parent> {
    const modelData = ParentMapper.toPersistence(data);
    const model = this.parentRepository.create(modelData);
    const savedModel = await this.parentRepository.save(model);
    return ParentMapper.toDomain(savedModel);
  }

  async update(id: string, data: Partial<Parent>): Promise<Parent> {
    await this.parentRepository.update(id, data);
    const updatedModel = await this.parentRepository.findOne({ where: { id } });
    if (!updatedModel) {
      throw new Error(`Parent with id ${id} not found after update`);
    }
    return ParentMapper.toDomain(updatedModel);
  }

  async delete(id: string): Promise<void> {
    await this.parentRepository.delete(id);
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<Parent | null> {
    const model = await this.parentRepository.findOne({ where: { email } });
    if (!model) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, model.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return ParentMapper.toDomain(model);
  }
}
