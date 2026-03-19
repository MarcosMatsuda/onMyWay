import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

const typeormConfig: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [__dirname + '/../../domain/entities/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
};

export default typeormConfig;

// DataSource instance for migrations
export const AppDataSource = new DataSource(typeormConfig);
