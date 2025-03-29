import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';
import { Showtime } from '../showtimes/entities/showtime.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Create type for mocks that ensures methods exist
type MockType<T> = {
  [P in keyof T]: jest.Mock;
};

describe('BookingService', () => {
  let service: BookingService;
  let bookingRepository: MockType<Repository<Booking>>;
  let showtimeRepository: MockType<Repository<Showtime>>;

  beforeEach(async () => {
    bookingRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as unknown as MockType<Repository<Booking>>;

    showtimeRepository = {
      findOne: jest.fn(),
    } as unknown as MockType<Repository<Showtime>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getRepositoryToken(Booking),
          useValue: bookingRepository,
        },
        {
          provide: getRepositoryToken(Showtime),
          useValue: showtimeRepository,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully book a seat', async () => {
      // Mock data
      const createBookingDto = {
        showtimeId: 1,
        seatNumber: 10,
        userId: 'user-123',
      };
      
      const mockShowtime = { id: 1 };
      const mockBooking = { 
        bookingId: 'booking-uuid',
        ...createBookingDto
      };
      
      // Mock responses
      showtimeRepository.findOne.mockResolvedValue(mockShowtime);
      bookingRepository.findOne.mockResolvedValue(null); // Seat not booked yet
      bookingRepository.create.mockReturnValue(createBookingDto);
      bookingRepository.save.mockResolvedValue(mockBooking);

      // Execute
      const result = await service.create(createBookingDto);
      
      // Verify
      expect(result).toEqual({ bookingId: mockBooking.bookingId });
      expect(showtimeRepository.findOne).toHaveBeenCalledWith({
        where: { id: createBookingDto.showtimeId },
      });
      expect(bookingRepository.findOne).toHaveBeenCalledWith({
        where: {
          showtimeId: createBookingDto.showtimeId,
          seatNumber: createBookingDto.seatNumber,
        },
      });
      expect(bookingRepository.create).toHaveBeenCalledWith(createBookingDto);
      expect(bookingRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if showtime does not exist', async () => {
      const createBookingDto = {
        showtimeId: 999, // Non-existent showtime
        seatNumber: 10,
        userId: 'user-123',
      };
      
      showtimeRepository.findOne.mockResolvedValue(null); // Showtime not found
      
      await expect(service.create(createBookingDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if seat is already booked', async () => {
      const createBookingDto = {
        showtimeId: 1,
        seatNumber: 10,
        userId: 'user-123',
      };
      
      showtimeRepository.findOne.mockResolvedValue({ id: 1 }); // Showtime exists
      
      // Seat already booked
      bookingRepository.findOne.mockResolvedValue({ 
        bookingId: 'existing-booking',
        showtimeId: 1,
        seatNumber: 10 
      });
      
      await expect(service.create(createBookingDto)).rejects.toThrow(BadRequestException);
    });
  });
});