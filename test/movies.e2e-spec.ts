import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { setupTestApp, cleanDatabase, closeTestApp } from './setup';

describe('MovieController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const testEnv = await setupTestApp();
    app = testEnv.app;
    dataSource = testEnv.dataSource;
    
    // Clean database before tests
    await cleanDatabase(dataSource);
  });

  afterAll(async () => {
    // No need to call closeTestApp() here - that will be done once at the global level
    // We do want to clean up our data though
    await cleanDatabase(dataSource);
  });

  it('Should have an empty movie list initially', async () => {
    const response = await request(app.getHttpServer())
      .get('/movies/all')
      .expect(200);
    
    expect(response.body).toEqual([]);
  });

  it('Should create a movie with valid data', async () => {
    const movieData = {
      title: 'Test Movie',
      genre: 'Action',
      duration: 120,
      rating: 8.5,
      releaseYear: 2025
    };

    const response = await request(app.getHttpServer())
      .post('/movies')
      .send(movieData)
      .expect(201);
    
    expect(response.body.title).toBe(movieData.title);
    expect(response.body.genre).toBe(movieData.genre);
    expect(response.body).toHaveProperty('id');
  });

  it('Should retrieve created movies', async () => {
    const response = await request(app.getHttpServer())
      .get('/movies/all')
      .expect(200);
    
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].title).toBe('Test Movie');
  });

  it('Should update a movie', async () => {
    // First, make sure we have a movie
    const movies = await request(app.getHttpServer()).get('/movies/all');
    expect(movies.body.length).toBeGreaterThan(0);
    
    const movieTitle = movies.body[0].title;
    const updateData = {
      genre: 'Action/Thriller',
      rating: 9.0
    };

    await request(app.getHttpServer())
      .post(`/movies/update/${movieTitle}`)
      .send(updateData)
      .expect(200);

    // Verify update
    const updatedMovies = await request(app.getHttpServer()).get('/movies/all');
    const updatedMovie = updatedMovies.body.find(m => m.title === movieTitle);
    expect(updatedMovie.genre).toBe(updateData.genre);
    
    // Convert string to number for comparison
    expect(parseFloat(updatedMovie.rating)).toBe(updateData.rating);
  });

  it('Should delete a movie', async () => {
    // First, make sure we have a movie
    const movies = await request(app.getHttpServer()).get('/movies/all');
    expect(movies.body.length).toBeGreaterThan(0);
    
    const movieTitle = movies.body[0].title;

    await request(app.getHttpServer())
      .delete(`/movies/${movieTitle}`)
      .expect(200);

    // Verify deletion
    const updatedMovies = await request(app.getHttpServer()).get('/movies/all');
    expect(updatedMovies.body.length).toBe(0);
  });
});