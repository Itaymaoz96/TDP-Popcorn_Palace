import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { setupTestApp, cleanDatabase } from './setup';

describe('BookingController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testMovieId: number;
  let testShowtimeId: number;
  let testUserId: string;

  beforeAll(async () => {
    const testEnv = await setupTestApp();
    app = testEnv.app;
    dataSource = testEnv.dataSource;
    
    // Clean database before tests
    await cleanDatabase(dataSource);

    // Create a test movie
    const movieResult = await dataSource.query(`
      INSERT INTO movies (title, genre, duration, rating, "releaseYear")
      VALUES ('Test Movie For Bookings', 'Action', 120, 8.5, 2025)
      RETURNING id
    `);
    
    testMovieId = movieResult[0].id;
    
    // Create a test showtime
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startTime = new Date(tomorrow);
    startTime.setHours(18, 0, 0);
    
    const endTime = new Date(tomorrow);
    endTime.setHours(20, 30, 0);
    
    const showtimeResult = await dataSource.query(`
      INSERT INTO showtimes ("movieId", price, theater, "startTime", "endTime")
      VALUES ($1, 12.99, 'Cinema For Bookings', $2, $3)
      RETURNING id
    `, [testMovieId, startTime, endTime]);
    
    testShowtimeId = showtimeResult[0].id;
    
    // Generate a test user ID
    testUserId = uuidv4();
  });

  afterAll(async () => {
    // Clean up our test data
    await cleanDatabase(dataSource);
  });

  it('Should book a seat successfully', async () => {
    const bookingData = {
      showtimeId: testShowtimeId,
      seatNumber: 10,
      userId: testUserId
    };

    const response = await request(app.getHttpServer())
      .post('/bookings')
      .send(bookingData)
      .expect(201);
    
    expect(response.body).toHaveProperty('bookingId');
    expect(typeof response.body.bookingId).toBe('string');
  });

  it('Should reject booking the same seat twice', async () => {
    const seatNumber = 15; // Use a different seat number from previous test
    
    // First booking
    await request(app.getHttpServer())
      .post('/bookings')
      .send({
        showtimeId: testShowtimeId,
        seatNumber: seatNumber,
        userId: testUserId
      })
      .expect(201);
    
    // Second booking for the same seat
    await request(app.getHttpServer())
      .post('/bookings')
      .send({
        showtimeId: testShowtimeId,
        seatNumber: seatNumber, // Same seat
        userId: uuidv4() // Different user
      })
      .expect(400); // Should be rejected
  });

  it('Should allow booking different seats for same showtime', async () => {
    // Book another seat for the same showtime
    const response = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        showtimeId: testShowtimeId,
        seatNumber: 20, // Different seat number
        userId: testUserId
      })
      .expect(201);
    
    expect(response.body).toHaveProperty('bookingId');
  });

  it('Should allow booking same seat for different showtimes', async () => {
    // Create another showtime
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startTime = new Date(tomorrow);
    startTime.setHours(21, 0, 0); // 9:00 PM
    
    const endTime = new Date(tomorrow);
    endTime.setHours(23, 30, 0); // 11:30 PM
    
    const showtimeResult = await dataSource.query(`
      INSERT INTO showtimes ("movieId", price, theater, "startTime", "endTime")
      VALUES ($1, 14.99, 'Cinema 2 For Bookings', $2, $3)
      RETURNING id
    `, [testMovieId, startTime, endTime]);
    
    const secondShowtimeId = showtimeResult[0].id;
    
    // Book a seat for first showtime
    const seatNumber = 25; // Use a seat number not used in previous tests
    
    await request(app.getHttpServer())
      .post('/bookings')
      .send({
        showtimeId: testShowtimeId,
        seatNumber: seatNumber,
        userId: testUserId
      })
      .expect(201);
    
    // Book same seat for second showtime
    const response = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        showtimeId: secondShowtimeId,
        seatNumber: seatNumber, // Same seat number
        userId: testUserId
      })
      .expect(201);
    
    expect(response.body).toHaveProperty('bookingId');
  });
});