import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { MovieService } from './movie.service';
import { Movie } from './entities/movie.entity';
import { NotFoundException, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

describe('MovieService', () => {
  let service: MovieService;
  let repository: Repository<Movie>;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    // Create mock query runner for transactions
    queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        save: jest.fn(),
      },
    } as unknown as QueryRunner;

    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovieService,
        {
          provide: getRepositoryToken(Movie),
          useValue: mockRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<MovieService>(MovieService);
    repository = module.get<Repository<Movie>>(getRepositoryToken(Movie));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of movies', async () => {
      const expectedMovies = [
        {
          id: 1,
          title: 'Test Movie',
          genre: 'Action',
          duration: 120,
          rating: 8.5,
          releaseYear: 2025,
          showtimes: [],
        },
        {
          id: 2,
          title: 'Another Movie',
          genre: 'Comedy',
          duration: 95,
          rating: 7.8,
          releaseYear: 2023,
          showtimes: [],
        },
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(expectedMovies as Movie[]);

      const result = await service.findAll();
      
      expect(result).toEqual(expectedMovies);
      expect(repository.find).toHaveBeenCalled();
    });

    it('should return empty array when no movies exist', async () => {
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      const result = await service.findAll();
      
      expect(result).toEqual([]);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new movie successfully', async () => {
      const createMovieDto: CreateMovieDto = {
        title: 'New Movie',
        genre: 'Action',
        duration: 120,
        rating: 8.5,
        releaseYear: 2025,
      };

      const createdMovie = {
        id: 1,
        ...createMovieDto,
        showtimes: [],
      };

      jest.spyOn(repository, 'create').mockReturnValue(createdMovie as Movie);
      jest.spyOn(queryRunner.manager, 'save').mockResolvedValue(createdMovie as Movie);

      const result = await service.create(createMovieDto);
      
      expect(result).toEqual(createdMovie);
      expect(dataSource.createQueryRunner).toHaveBeenCalled();
      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(repository.create).toHaveBeenCalledWith(createMovieDto);
      expect(queryRunner.manager.save).toHaveBeenCalledWith(createdMovie);
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction and throw InternalServerErrorException when save fails', async () => {
      const createMovieDto: CreateMovieDto = {
        title: 'New Movie',
        genre: 'Action',
        duration: 120,
        rating: 8.5,
        releaseYear: 2025,
      };

      const mockMovie = { ...createMovieDto, id: 1 } as Movie;
      
      jest.spyOn(repository, 'create').mockReturnValue(mockMovie);
      jest.spyOn(queryRunner.manager, 'save').mockRejectedValue(new Error('Database error'));

      await expect(service.create(createMovieDto)).rejects.toThrow(InternalServerErrorException);
      
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a movie successfully', async () => {
      const movieTitle = 'Existing Movie';
      const updateMovieDto: UpdateMovieDto = {
        genre: 'Updated Genre',
        rating: 9.0,
      };

      const existingMovie = {
        id: 1,
        title: movieTitle,
        genre: 'Original Genre',
        duration: 120,
        rating: 8.5,
        releaseYear: 2025,
        showtimes: [],
      };

      const updatedMovie = {
        ...existingMovie,
        ...updateMovieDto,
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(existingMovie as Movie);
      jest.spyOn(repository, 'save').mockResolvedValue(updatedMovie as Movie);

      await service.update(movieTitle, updateMovieDto);
      
      expect(repository.findOne).toHaveBeenCalledWith({ where: { title: movieTitle } });
      expect(repository.save).toHaveBeenCalledWith(updatedMovie);
    });

    it('should throw NotFoundException if movie to update does not exist', async () => {
      const movieTitle = 'Non-existent Movie';
      const updateMovieDto: UpdateMovieDto = {
        genre: 'Updated Genre',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.update(movieTitle, updateMovieDto)).rejects.toThrow(
        new NotFoundException(`Movie with title "${movieTitle}" not found`)
      );
      
      expect(repository.findOne).toHaveBeenCalledWith({ where: { title: movieTitle } });
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should only update fields provided in updateMovieDto', async () => {
      const movieTitle = 'Existing Movie';
      const updateMovieDto: UpdateMovieDto = {
        genre: 'Updated Genre',
        // Only updating genre
      };

      const existingMovie = {
        id: 1,
        title: movieTitle,
        genre: 'Original Genre',
        duration: 120,
        rating: 8.5,
        releaseYear: 2025,
        showtimes: [],
      };

      const expectedUpdatedMovie = {
        ...existingMovie,
        genre: 'Updated Genre',
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(existingMovie as Movie);
      jest.spyOn(repository, 'save').mockResolvedValue(expectedUpdatedMovie as Movie);

      await service.update(movieTitle, updateMovieDto);
      
      expect(repository.save).toHaveBeenCalledWith(expectedUpdatedMovie);
    });
  });

  describe('remove', () => {
    it('should remove a movie successfully', async () => {
      const movieTitle = 'Movie to Delete';
      
      jest.spyOn(repository, 'delete').mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(movieTitle);
      
      expect(repository.delete).toHaveBeenCalledWith({ title: movieTitle });
    });

    it('should throw NotFoundException if movie to delete does not exist', async () => {
      const movieTitle = 'Non-existent Movie';
      
      jest.spyOn(repository, 'delete').mockResolvedValue({ affected: 0, raw: {} });

      await expect(service.remove(movieTitle)).rejects.toThrow(
        new NotFoundException(`Movie with title "${movieTitle}" not found`)
      );
      
      expect(repository.delete).toHaveBeenCalledWith({ title: movieTitle });
    });
  });
});