'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require('typeorm');
const dotenv_1 = require('dotenv');
// Load environment variables from .env or fall back to .env.example for development
(0, dotenv_1.config)({ path: '.env' });
if (!process.env.DATABASE_URL) {
  (0, dotenv_1.config)({ path: '.env.example' });
}
const typeormConfig = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../../data/models/*.model{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
};
exports.default = typeormConfig;
// DataSource instance for migrations
exports.AppDataSource = new typeorm_1.DataSource(typeormConfig);
