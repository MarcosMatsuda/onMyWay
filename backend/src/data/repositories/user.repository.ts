import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserModel } from '../models/user.model';
import { UserMapper } from '../mappers/user.mapper';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserModel)
    private readonly userRepository: Repository<UserModel>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const model = await this.userRepository.findOne({ where: { id } });
    return model ? UserMapper.toDomain(model) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const model = await this.userRepository.findOne({ where: { email } });
    return model ? UserMapper.toDomain(model) : null;
  }

  async findBySchoolId(schoolId: string): Promise<User[]> {
    const models = await this.userRepository.find({ where: { schoolId } });
    return models.map((model) => UserMapper.toDomain(model));
  }

  async create(
    data: Omit<User, 'id' | 'createdAt'> & { passwordHash: string },
  ): Promise<User> {
    const modelData = UserMapper.toPersistence(data);
    const model = this.userRepository.create(modelData);
    const savedModel = await this.userRepository.save(model);
    return UserMapper.toDomain(savedModel);
  }

  async delete(id: string): Promise<void> {
    (await this.userRepository.delete(id)) as DeleteResult;
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    const model = await this.userRepository.findOne({ where: { email } });
    if (!model) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, model.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return UserMapper.toDomain(model);
  }
}
