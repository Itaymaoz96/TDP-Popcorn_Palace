import { Test, TestingModule } from '@nestjs/testing';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { v4 as uuidv4 } from 'uuid';

describe('BookingController', () => {
  let controller: BookingController;
  let service: BookingService;

  beforeEach(async () => {
    // Create a mock service with all the methods we need
    const mockBookingService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingController],
      providers: [
        {
          provide: BookingService,
          useValue: mockBookingService,
        },
      ],
    }).compile();

    controller = module.get<BookingController>(BookingController);
    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should book a ticket successfully', async () => {
      const bookingId = uuidv4();
      const createBookingDto: CreateBookingDto = {
        showtimeId: 1,
        seatNumber: 10,
        userId: uuidv4(),
      };
      
      // This is fine because we're just returning a simple object,
      // not an entity with relationships
      const expectedResult = { bookingId };
      
      jest.spyOn(service, 'create').mockResolvedValue(expectedResult);

      expect(await controller.create(createBookingDto)).toBe(expectedResult);
      expect(service.create).toHaveBeenCalledWith(createBookingDto);
    });
    
    it('should handle not found when booking for a non-existent showtime', async () => {
      const createBookingDto: CreateBookingDto = {
        showtimeId: 999, // Non-existent showtime
        seatNumber: 10,
        userId: uuidv4(),
      };
      
      jest.spyOn(service, 'create').mockRejectedValue(
        new NotFoundException(`Showtime with ID "${createBookingDto.showtimeId}" not found`)
      );

      await expect(controller.create(createBookingDto)).rejects.toThrow(NotFoundException);
      expect(service.create).toHaveBeenCalledWith(createBookingDto);
    });
    
    it('should handle seat already booked', async () => {
      const createBookingDto: CreateBookingDto = {
        showtimeId: 1,
        seatNumber: 10, // Already booked seat
        userId: uuidv4(),
      };
      
      jest.spyOn(service, 'create').mockRejectedValue(
        new BadRequestException(`Seat ${createBookingDto.seatNumber} is already booked for this showtime`)
      );

      await expect(controller.create(createBookingDto)).rejects.toThrow(BadRequestException);
      expect(service.create).toHaveBeenCalledWith(createBookingDto);
    });
  });
});