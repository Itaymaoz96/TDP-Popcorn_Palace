import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShowtimeService } from './showtime.service';
import { Showtime } from './entities/showtime.entity';
import { Movie } from '../movies/entities/movie.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Create type for mocks that ensures methods exist
type MockType<T> = {
  [P in keyof T]: jest.Mock;
};

// Mock QueryBuilder Type
type MockQueryBuilder = {
  where: jest.Mock;
  andWhere: jest.Mock;
  orWhere: jest.Mock;
  getOne: jest.Mock;
};

describe('ShowtimeService', () => {
  let service: ShowtimeService;
  let showtimeRepository: Partial<MockType<Repository<Showtime>>>;
  let movieRepository: Partial<MockType<Repository<Movie>>>;
  let mockQueryBuilder: MockQueryBuilder;

  beforeEach(async () => {
    mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn()
    };
    
    showtimeRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    movieRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShowtimeService,
        {
          provide: getRepositoryToken(Showtime),
          useValue: showtimeRepository,
        },
        {
          provide: getRepositoryToken(Movie),
          useValue: movieRepository,
        },
      ],
    }).compile();

    service = module.get<ShowtimeService>(ShowtimeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a showtime if it exists', async () => {
      const mockShowtime = { 
        id: 1, 
        theater: 'Theater 1',
        movieId: 1,
        price: 12.99,
        startTime: new Date(),
        endTime: new Date()
      };
      
      showtimeRepository.findOne!.mockResolvedValue(mockShowtime);

      const result = await service.findOne(1);
      expect(result).toEqual(mockShowtime);
      expect(showtimeRepository.findOne).toHaveBeenCalledWith({ 
        where: { id: 1 },
        relations: ['movie'] 
      });
    });

    it('should throw NotFoundException if showtime not found', async () => {
      showtimeRepository.findOne!.mockResolvedValue(null);
      
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a showtime when all conditions are met', async () => {
      // Mock data
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const startTime = new Date(tomorrow);
      startTime.setHours(18, 0, 0);
      
      const endTime = new Date(tomorrow);
      endTime.setHours(20, 0, 0);
      
      const createShowtimeDto = {
        movieId: 1,
        price: 12.99,
        theater: 'Theater 1',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };
      
      const mockMovie = { id: 1, title: 'Test Movie' };
      const mockShowtime = { 
        id: 1, 
        ...createShowtimeDto, 
        startTime, 
        endTime 
      };
      
      // Mock responses
      movieRepository.findOne!.mockResolvedValue(mockMovie);
      mockQueryBuilder.getOne.mockResolvedValue(null); // No overlapping showtimes
      showtimeRepository.create!.mockReturnValue(mockShowtime);
      showtimeRepository.save!.mockResolvedValue(mockShowtime);

      // Execute
      const result = await service.create(createShowtimeDto);
      
      // Verify
      expect(result).toEqual(mockShowtime);
      expect(movieRepository.findOne).toHaveBeenCalled();
      expect(showtimeRepository.create).toHaveBeenCalled();
      expect(showtimeRepository.save).toHaveBeenCalled();
    });

    // Other tests remain the same but use the non-nullable assertion (!) where needed
    // ...
  });
});