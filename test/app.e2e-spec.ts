import { INestApplication } from '@nestjs/common';
import { setupTestApp, closeTestApp } from './setup';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const testEnv = await setupTestApp();
    app = testEnv.app;
  });

  afterAll(async () => {
    // This is the only place we actually close the app connection
    await closeTestApp();
  });

  it('Application should be running', () => {
    expect(app).toBeDefined();
  });
});