import { Test, TestingModule } from '@nestjs/testing';
import { ShowtimeController } from './showtime.controller';
import { ShowtimeService } from './showtime.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';
import { Showtime } from './entities/showtime.entity';

describe('ShowtimeController', () => {
  let controller: ShowtimeController;
  let service: ShowtimeService;

  beforeEach(async () => {
    // Create a mock service with all the methods we need
    const mockShowtimeService = {
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShowtimeController],
      providers: [
        {
          provide: ShowtimeService,
          useValue: mockShowtimeService,
        },
      ],
    }).compile();

    controller = module.get<ShowtimeController>(ShowtimeController);
    service = module.get<ShowtimeService>(ShowtimeService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a showtime by ID', async () => {
      const showtimeId = '1';
      // Create a proper Showtime entity object with all required properties
      const result = {
        id: 1,
        movieId: 1,
        price: 12.99,
        theater: 'Cinema 1',
        startTime: new Date(),
        endTime: new Date(),
        movie: {
          id: 1,
          title: 'Test Movie',
          genre: 'Action',
          duration: 120,
          rating: 8.5,
          releaseYear: 2025,
          showtimes: [],
        },
        bookings: [],
      } as Showtime;
      
      jest.spyOn(service, 'findOne').mockResolvedValue(result);

      expect(await controller.findOne(showtimeId)).toBe(result);
      expect(service.findOne).toHaveBeenCalledWith(1); // String should be converted to number
    });
    
    it('should handle not found when getting a showtime', async () => {
      const showtimeId = '999';
      
      jest.spyOn(service, 'findOne').mockRejectedValue(
        new NotFoundException(`Showtime with ID "${showtimeId}" not found`)
      );

      await expect(controller.findOne(showtimeId)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(999);
    });
  });

  describe('create', () => {
    it('should create a new showtime', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const startTime = new Date(tomorrow);
      startTime.setHours(18, 0, 0);
      
      const endTime = new Date(tomorrow);
      endTime.setHours(20, 30, 0);
      
      const createShowtimeDto: CreateShowtimeDto = {
        movieId: 1,
        price: 12.99,
        theater: 'Cinema 1',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };
      
      // Create a proper Showtime entity object with all required properties
      const expectedResult = {
        id: 1,
        movieId: 1,
        price: 12.99,
        theater: 'Cinema 1',
        startTime,
        endTime,
        movie: {
          id: 1,
          title: 'Test Movie',
          genre: 'Action',
          duration: 120,
          rating: 8.5,
          releaseYear: 2025,
          showtimes: [],
        },
        bookings: [],
      } as Showtime;
      
      jest.spyOn(service, 'create').mockResolvedValue(expectedResult);

      expect(await controller.create(createShowtimeDto)).toBe(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createShowtimeDto);
    });
    
    it('should handle validation errors when creating a showtime', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // End time before start time to trigger validation error
      const startTime = new Date(tomorrow);
      startTime.setHours(20, 0, 0);
      
      const endTime = new Date(tomorrow);
      endTime.setHours(18, 0, 0);
      
      const createShowtimeDto: CreateShowtimeDto = {
        movieId: 1,
        price: 12.99,
        theater: 'Cinema 1',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };
      
      jest.spyOn(service, 'create').mockRejectedValue(
        new BadRequestException('End time must be after start time')
      );

      await expect(controller.create(createShowtimeDto)).rejects.toThrow(BadRequestException);
      expect(service.create).toHaveBeenCalledWith(createShowtimeDto);
    });
  });

  describe('update', () => {
    it('should update a showtime', async () => {
      const showtimeId = '1';
      const updateShowtimeDto: UpdateShowtimeDto = {
        price: 15.99,
        theater: 'VIP Cinema',
      };
      
      jest.spyOn(service, 'update').mockResolvedValue(undefined);

      await controller.update(showtimeId, updateShowtimeDto);
      expect(service.update).toHaveBeenCalledWith(1, updateShowtimeDto);
    });
    
    it('should handle not found when updating a showtime', async () => {
      const showtimeId = '999';
      const updateShowtimeDto: UpdateShowtimeDto = {
        price: 15.99,
      };
      
      jest.spyOn(service, 'update').mockRejectedValue(
        new NotFoundException(`Showtime with ID "${showtimeId}" not found`)
      );

      await expect(controller.update(showtimeId, updateShowtimeDto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(999, updateShowtimeDto);
    });
  });

  describe('remove', () => {
    it('should remove a showtime', async () => {
      const showtimeId = '1';
      
      jest.spyOn(service, 'remove').mockResolvedValue(undefined);

      await controller.remove(showtimeId);
      expect(service.remove).toHaveBeenCalledWith(1);
    });
    
    it('should handle not found when removing a showtime', async () => {
      const showtimeId = '999';
      
      jest.spyOn(service, 'remove').mockRejectedValue(
        new NotFoundException(`Showtime with ID "${showtimeId}" not found`)
      );

      await expect(controller.remove(showtimeId)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith(999);
    });
  });
});