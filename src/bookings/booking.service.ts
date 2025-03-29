import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Showtime } from '../showtimes/entities/showtime.entity';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Showtime)
    private readonly showtimeRepository: Repository<Showtime>,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<{ bookingId: string }> {
    // Check if the showtime exists
    const showtime = await this.showtimeRepository.findOne({
      where: { id: createBookingDto.showtimeId },
    });
    
    if (!showtime) {
      throw new NotFoundException(`Showtime with ID "${createBookingDto.showtimeId}" not found`);
    }
    
    // Check if the seat is already booked for this showtime
    const existingBooking = await this.bookingRepository.findOne({
      where: {
        showtimeId: createBookingDto.showtimeId,
        seatNumber: createBookingDto.seatNumber,
      },
    });
    
    if (existingBooking) {
      throw new BadRequestException(`Seat ${createBookingDto.seatNumber} is already booked for this showtime`);
    }
    
    // Create the booking
    const booking = this.bookingRepository.create(createBookingDto);
    const savedBooking = await this.bookingRepository.save(booking);
    
    return { bookingId: savedBooking.bookingId };
  }
}