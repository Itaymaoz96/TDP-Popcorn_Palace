import { Test, TestingModule } from '@nestjs/testing';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entities/movie.entity';

describe('MovieController', () => {
  let controller: MovieController;
  let service: MovieService;

  beforeEach(async () => {
    // Create a mock service with all the methods we need
    const mockMovieService = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MovieController],
      providers: [
        {
          provide: MovieService,
          useValue: mockMovieService,
        },
      ],
    }).compile();

    controller = module.get<MovieController>(MovieController);
    service = module.get<MovieService>(MovieService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of movies', async () => {
      // Create a proper Movie entity array with all required properties
      const result = [
        {
          id: 1,
          title: 'Test Movie',
          genre: 'Action',
          duration: 120,
          rating: 8.5,
          releaseYear: 2025,
          showtimes: [], // Include relationships
        },
      ] as Movie[];
      
      jest.spyOn(service, 'findAll').mockResolvedValue(result);

      expect(await controller.findAll()).toBe(result);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new movie', async () => {
      const createMovieDto: CreateMovieDto = {
        title: 'New Movie',
        genre: 'Action',
        duration: 120,
        rating: 8.5,
        releaseYear: 2025,
      };
      
      // Create a proper Movie entity object with all required properties
      const expectedResult = {
        id: 1,
        title: 'New Movie',
        genre: 'Action',
        duration: 120,
        rating: 8.5,
        releaseYear: 2025,
        showtimes: [], // Include relationships
      } as Movie;
      
      jest.spyOn(service, 'create').mockResolvedValue(expectedResult);

      expect(await controller.create(createMovieDto)).toBe(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createMovieDto);
    });
    
    it('should handle conflicts when creating a movie', async () => {
      const createMovieDto: CreateMovieDto = {
        title: 'Existing Movie',
        genre: 'Action',
        duration: 120,
        rating: 8.5,
        releaseYear: 2025,
      };
      
      jest.spyOn(service, 'create').mockRejectedValue(
        new ConflictException('Movie with title "Existing Movie" already exists')
      );

      await expect(controller.create(createMovieDto)).rejects.toThrow(ConflictException);
      expect(service.create).toHaveBeenCalledWith(createMovieDto);
    });
  });

  describe('update', () => {
    it('should update a movie', async () => {
      const movieTitle = 'Test Movie';
      const updateMovieDto: UpdateMovieDto = {
        genre: 'Action/Comedy',
        rating: 9.0,
      };
      
      const response = {
        success: true,
        message: `Movie "${movieTitle}" was successfully updated.`
      };
      
      jest.spyOn(service, 'update').mockResolvedValue(undefined);

      expect(await controller.update(movieTitle, updateMovieDto)).toEqual(response);
      expect(service.update).toHaveBeenCalledWith(movieTitle, updateMovieDto);
    });
    
    it('should handle not found when updating a movie', async () => {
      const movieTitle = 'Non-existent Movie';
      const updateMovieDto: UpdateMovieDto = {
        genre: 'Action/Comedy',
      };
      
      jest.spyOn(service, 'update').mockRejectedValue(
        new NotFoundException(`Movie with title "${movieTitle}" not found`)
      );

      await expect(controller.update(movieTitle, updateMovieDto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(movieTitle, updateMovieDto);
    });
  });

  describe('remove', () => {
    it('should remove a movie', async () => {
      const movieTitle = 'Test Movie';
      const response = {
        success: true,
        message: `Movie "${movieTitle}" was successfully deleted.`
      };
      
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      expect(await controller.remove(movieTitle)).toEqual(response);
      expect(service.remove).toHaveBeenCalledWith(movieTitle);
    });
    
    it('should handle not found when removing a movie', async () => {
      const movieTitle = 'Non-existent Movie';
      
      jest.spyOn(service, 'remove').mockRejectedValue(
        new NotFoundException(`Movie with title "${movieTitle}" not found`)
      );

      await expect(controller.remove(movieTitle)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith(movieTitle);
    });
  });
});