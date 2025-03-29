import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { setupTestApp, cleanDatabase } from './setup';

describe('ShowtimeController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testMovieId: number;

  beforeAll(async () => {
    const testEnv = await setupTestApp();
    app = testEnv.app;
    dataSource = testEnv.dataSource;
    
    // Clean database before tests
    await cleanDatabase(dataSource);

    // Create a test movie for showtimes
    const result = await dataSource.query(`
      INSERT INTO movies (title, genre, duration, rating, "releaseYear")
      VALUES ('Test Movie For Showtimes', 'Action', 120, 8.5, 2025)
      RETURNING id
    `);
    
    testMovieId = result[0].id;
  });

  afterAll(async () => {
    // Clean up our test data
    await cleanDatabase(dataSource);
  });

  it('Should create a showtime with valid data', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startTime = new Date(tomorrow);
    startTime.setHours(18, 0, 0); // 6:00 PM
    
    const endTime = new Date(tomorrow);
    endTime.setHours(20, 30, 0); // 8:30 PM
    
    const showtimeData = {
      movieId: testMovieId,
      price: 12.99,
      theater: 'Cinema 1',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    };

    const response = await request(app.getHttpServer())
      .post('/showtimes')
      .send(showtimeData)
      .expect(201);
    
    expect(response.body.movieId).toBe(testMovieId);
    expect(parseFloat(response.body.price)).toBe(12.99);
    expect(response.body.theater).toBe('Cinema 1');
    expect(response.body).toHaveProperty('id');
  });

  it('Should allow overlapping showtimes in different theaters', async () => {
    // Create fresh dates for the new showtime
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startTime = new Date(tomorrow);
    startTime.setHours(18, 0, 0); // Same time as first showtime
    
    const endTime = new Date(tomorrow);
    endTime.setHours(20, 30, 0); // Same time as first showtime
    
    // Create a new showtime with the same times but in a different theater
    const showtimeData = {
      movieId: testMovieId,
      price: 14.99,
      theater: 'Cinema 2', // Different theater
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    };
    
    const response = await request(app.getHttpServer())
      .post('/showtimes')
      .send(showtimeData)
      .expect(201);
    
    expect(response.body.theater).toBe('Cinema 2');
    expect(response.body).toHaveProperty('id');
  });

  it('Should reject overlapping showtimes in the same theater', async () => {
    // Create fresh dates with a small offset to create an overlap
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startTime = new Date(tomorrow);
    startTime.setHours(19, 0, 0); // 7:00 PM (overlaps with 6:00-8:30 PM)
    
    const endTime = new Date(tomorrow);
    endTime.setHours(21, 30, 0); // 9:30 PM (overlaps with 6:00-8:30 PM)
    
    const showtimeData = {
      movieId: testMovieId,
      price: 14.99,
      theater: 'Cinema 1', // Same theater as first test
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString()
    };
    
    await request(app.getHttpServer())
      .post('/showtimes')
      .send(showtimeData)
      .expect(400); // Should reject with Bad Request
  });

  it('Should retrieve a showtime by ID', async () => {
    // Get a showtime ID first
    const showtimes = await dataSource.query(`
      SELECT id FROM showtimes LIMIT 1
    `);
    
    expect(showtimes.length).toBeGreaterThan(0);
    const showtimeId = showtimes[0].id;
    
    const response = await request(app.getHttpServer())
      .get(`/showtimes/${showtimeId}`)
      .expect(200);
    
    expect(response.body.id).toBe(showtimeId);
    expect(response.body).toHaveProperty('movie');
    expect(response.body.movie.id).toBe(testMovieId);
  });

  it('Should delete a showtime', async () => {
    // Create a showtime to delete
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startTime = new Date(tomorrow);
    startTime.setHours(22, 0, 0); // 10:00 PM
    
    const endTime = new Date(tomorrow);
    endTime.setHours(23, 59, 0); // 11:59 PM
    
    const createResponse = await request(app.getHttpServer())
      .post('/showtimes')
      .send({
        movieId: testMovieId,
        price: 12.99,
        theater: 'Cinema 3',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      })
      .expect(201);
    
    const showtimeId = createResponse.body.id;
    
    // Delete the showtime
    await request(app.getHttpServer())
      .delete(`/showtimes/${showtimeId}`)
      .expect(200);
    
    // Verify deletion
    await request(app.getHttpServer())
      .get(`/showtimes/${showtimeId}`)
      .expect(404);
  });
});