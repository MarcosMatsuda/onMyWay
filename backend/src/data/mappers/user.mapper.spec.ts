import { UserMapper } from './user.mapper';
import { UserModel } from '../models/user.model';
import { User } from '../../domain/entities/user.entity';

describe('UserMapper', () => {
  describe('toDomain', () => {
    it('should map school_admin model to domain entity', () => {
      const model: UserModel = {
        id: 'user-id',
        name: 'School Admin',
        email: 'admin@school.com',
        role: 'school_admin',
        schoolId: 'school-id',
        passwordHash: 'hashed-password',
        createdAt: new Date('2024-01-01'),
      };

      const result = UserMapper.toDomain(model);

      expect(result).toEqual<User>({
        id: 'user-id',
        name: 'School Admin',
        email: 'admin@school.com',
        role: 'school_admin',
        schoolId: 'school-id',
        createdAt: model.createdAt,
      });
    });

    it('should map super_admin model with null schoolId to domain entity', () => {
      const model: UserModel = {
        id: 'super-id',
        name: 'Super Admin',
        email: 'super@example.com',
        role: 'super_admin',
        schoolId: null,
        passwordHash: 'hashed-password',
        createdAt: new Date('2024-06-15'),
      };

      const result = UserMapper.toDomain(model);

      expect(result).toEqual<User>({
        id: 'super-id',
        name: 'Super Admin',
        email: 'super@example.com',
        role: 'super_admin',
        schoolId: null,
        createdAt: model.createdAt,
      });
    });

    it('should not include passwordHash in domain entity', () => {
      const model: UserModel = {
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'school_admin',
        schoolId: 'school-id',
        passwordHash: 'secret-hash',
        createdAt: new Date(),
      };

      const result = UserMapper.toDomain(model);

      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should preserve exact createdAt reference', () => {
      const createdAt = new Date('2025-03-01T10:00:00Z');
      const model: UserModel = {
        id: 'user-id',
        name: 'Test',
        email: 'test@example.com',
        role: 'school_admin',
        schoolId: 'school-id',
        passwordHash: 'hash',
        createdAt,
      };

      const result = UserMapper.toDomain(model);

      expect(result.createdAt).toBe(createdAt);
    });
  });

  describe('toPersistence', () => {
    it('should map school_admin entity data to persistence', () => {
      const entityData = {
        name: 'School Admin',
        email: 'admin@school.com',
        role: 'school_admin' as const,
        schoolId: 'school-id',
        passwordHash: 'hashed-password',
      };

      const result = UserMapper.toPersistence(entityData);

      expect(result).toEqual({
        name: 'School Admin',
        email: 'admin@school.com',
        role: 'school_admin',
        schoolId: 'school-id',
        passwordHash: 'hashed-password',
      });
    });

    it('should map super_admin entity data with null schoolId to persistence', () => {
      const entityData = {
        name: 'Super Admin',
        email: 'super@example.com',
        role: 'super_admin' as const,
        schoolId: null,
        passwordHash: 'hashed-password',
      };

      const result = UserMapper.toPersistence(entityData);

      expect(result).toEqual({
        name: 'Super Admin',
        email: 'super@example.com',
        role: 'super_admin',
        schoolId: null,
        passwordHash: 'hashed-password',
      });
    });

    it('should not include id or createdAt in persistence output', () => {
      const entityData = {
        name: 'Test',
        email: 'test@example.com',
        role: 'school_admin' as const,
        schoolId: 'school-id',
        passwordHash: 'hash',
      };

      const result = UserMapper.toPersistence(entityData);

      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('createdAt');
    });
  });

  describe('round-trip', () => {
    it('toPersistence then toDomain should preserve all non-password fields', () => {
      const originalData = {
        name: 'Round Trip User',
        email: 'roundtrip@example.com',
        role: 'school_admin' as const,
        schoolId: 'school-id',
        passwordHash: 'hashed-password',
      };

      const persisted = UserMapper.toPersistence(originalData);
      const fullModel: UserModel = {
        id: 'generated-id',
        createdAt: new Date('2025-01-01'),
        ...persisted,
      };
      const domain = UserMapper.toDomain(fullModel);

      expect(domain.name).toBe(originalData.name);
      expect(domain.email).toBe(originalData.email);
      expect(domain.role).toBe(originalData.role);
      expect(domain.schoolId).toBe(originalData.schoolId);
      expect(domain).not.toHaveProperty('passwordHash');
    });
  });
});
