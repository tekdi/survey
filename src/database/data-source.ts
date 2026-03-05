import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import databaseConfig from '../config/database.config';

// Load environment variables for CLI usage
dotenv.config();

// Get database configuration using the same config factory
const dbConfig = databaseConfig();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: dbConfig.logging,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
