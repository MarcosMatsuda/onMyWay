import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from './database.module';
import typeormConfig from './typeorm.config';
import { config } from 'dotenv';

// Load env vars for testing
config({ path: '.env.example' });

describe('DatabaseModule (Tests)', () => {
  describe('Module Loading - Configuration Validation', () => {
    it('should have DatabaseModule defined', () => {
      expect(DatabaseModule).toBeDefined();
    });

    it('should have correct TypeORM configuration type', () => {
      expect(typeormConfig.type).toBe('postgres');
    });

    it('should load configuration without errors', () => {
      expect(() => {
        // Verify configuration structure is valid
        expect(typeormConfig.type).toBeDefined();
        const config = typeormConfig as any;
        expect(config.entities).toBeDefined();
        expect(config.migrations).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Environment Configuration', () => {
    it('should read DATABASE_URL from environment', () => {
      const dbUrl = process.env.DATABASE_URL;
      expect(dbUrl).toBeDefined();
      expect(dbUrl).toMatch(/postgresql:\/\//);
    });

    it('should have valid DATABASE_URL format', () => {
      const dbUrl = process.env.DATABASE_URL;
      const url = new URL(dbUrl);
      expect(url.protocol).toBe('postgresql:');
      expect(url.hostname).toBe('localhost');
      expect(url.port).toBe('5432');
      expect(url.pathname).toBe('/onmyway');
    });

    it('should have DATABASE_URL pointing to correct database', () => {
      const dbUrl = process.env.DATABASE_URL;
      expect(dbUrl).toContain('postgres:postgres');
      expect(dbUrl).toContain('localhost:5432');
      expect(dbUrl).toContain('onmyway');
    });
  });

  describe('TypeORM Configuration Structure', () => {
    it('should configure entities path correctly', () => {
      expect(typeormConfig.entities).toBeDefined();
      expect(Array.isArray(typeormConfig.entities)).toBe(true);
      const entitiesPath = typeormConfig.entities[0] as string;
      expect(entitiesPath).toContain('entities');
    });

    it('should configure migrations path correctly', () => {
      expect(typeormConfig.migrations).toBeDefined();
      expect(Array.isArray(typeormConfig.migrations)).toBe(true);
    });

    it('should have synchronize configuration property', () => {
      const config = typeormConfig as any;
      expect(config.synchronize).toBeDefined();
      // In test environment, this will be based on NODE_ENV
      expect(typeof config.synchronize).toBe('boolean');
    });

    it('should have logging configuration property', () => {
      const config = typeormConfig as any;
      expect(config.logging).toBeDefined();
      expect(typeof config.logging).toBe('boolean');
    });
  });

  describe('Redis Support', () => {
    it('should support optional REDIS_URL environment variable', () => {
      const redisUrl = process.env.REDIS_URL;
      // Redis is optional but should be valid if defined
      if (redisUrl) {
        expect(redisUrl).toMatch(/redis:\/\//);
        expect(redisUrl).toContain('localhost');
      }
    });

    it('should have REDIS_URL in environment example', () => {
      const redisUrl = process.env.REDIS_URL;
      expect(redisUrl).toBeDefined();
      expect(redisUrl).toBe('redis://localhost:6379');
    });
  });

  describe('DataSource Export', () => {
    it('should export AppDataSource for migrations', () => {
      const { AppDataSource } = require('./typeorm.config');
      expect(AppDataSource).toBeDefined();
      expect(AppDataSource.options).toBeDefined();
      expect(AppDataSource.options.type).toBe('postgres');
    });

    it('should have migration configuration in AppDataSource', () => {
      const { AppDataSource } = require('./typeorm.config');
      expect(AppDataSource.options.migrations).toBeDefined();
      expect(Array.isArray(AppDataSource.options.migrations)).toBe(true);
    });

    it('should have entity configuration in AppDataSource', () => {
      const { AppDataSource } = require('./typeorm.config');
      expect(AppDataSource.options.entities).toBeDefined();
      expect(Array.isArray(AppDataSource.options.entities)).toBe(true);
    });
  });

  describe('Module Structure', () => {
    it('should define DatabaseModule class', () => {
      expect(DatabaseModule).toBeDefined();
      expect(typeof DatabaseModule).toBe('function');
    });

    it('should have DatabaseModule importable and usable', () => {
      // Verify the module can be instantiated conceptually
      expect(() => {
        const moduleRef = new DatabaseModule();
        expect(moduleRef).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Configuration Validation', () => {
    it('should have PostgreSQL specific driver configuration', () => {
      expect(typeormConfig.type).toBe('postgres');
    });

    it('should not expose sensitive data in configuration', () => {
      const configStr = JSON.stringify(typeormConfig);
      // Ensure passwords are not hardcoded (they come from env)
      expect(configStr).not.toContain('postgres@');
    });

    it('should support PostGIS extension usage (through docker-compose)', () => {
      // The docker-compose.yml uses postgis/postgis image
      // This test validates the configuration is compatible
      expect(typeormConfig.type).toBe('postgres');
      // PostGIS is a PostgreSQL extension that doesn't require special TypeORM config
    });
  });

  describe('Integration Readiness', () => {
    it('should have all required environment variables defined', () => {
      expect(process.env.DATABASE_URL).toBeDefined();
      expect(process.env.DATABASE_URL).not.toBe('');
    });

    it('should have docker-compose configuration available', async () => {
      const fs = require('fs');
      const path = require('path');
      const dockerComposePath = path.join(__dirname, '../../..', 'docker-compose.yml');
      const exists = fs.existsSync(dockerComposePath);
      expect(exists).toBe(true);
    });

    it('should have .env.example properly configured', async () => {
      const fs = require('fs');
      const path = require('path');
      const envExamplePath = path.join(__dirname, '../../..', '.env.example');
      const exists = fs.existsSync(envExamplePath);
      expect(exists).toBe(true);
    });
  });
});
