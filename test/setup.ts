import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// Use let with properly typed or union typed declarations
let app: INestApplication | undefined;
let dataSource: DataSource | undefined;

// Global setup before any tests run
export const setupTestApp = async (): Promise<{
  app: INestApplication;
  dataSource: DataSource;
}> => {
  if (app && dataSource) {
    return { app, dataSource };
  }
  
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  
  // Get data source
  dataSource = moduleFixture.get<DataSource>(getDataSourceToken());
  
  return { app, dataSource };
};

// Clean the database completely
export const cleanDatabase = async (dataSource: DataSource): Promise<void> => {
  try {
    await dataSource.query('DELETE FROM bookings');
    await dataSource.query('DELETE FROM showtimes');
    await dataSource.query('DELETE FROM movies');
    // Reset sequences if needed
    await dataSource.query('ALTER SEQUENCE IF EXISTS movies_id_seq RESTART WITH 1');
    await dataSource.query('ALTER SEQUENCE IF EXISTS showtimes_id_seq RESTART WITH 1');
  } catch (error) {
    console.error('Error cleaning database:', error);
  }
};

// Close the app
export const closeTestApp = async (): Promise<void> => {
  if (app) {
    await app.close();
    app = undefined;
    dataSource = undefined;
  }
};