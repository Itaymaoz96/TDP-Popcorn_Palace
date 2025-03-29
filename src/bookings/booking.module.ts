import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';
import { Showtime } from '../showtimes/entities/showtime.entity';
import { ShowtimeModule } from '../showtimes/showtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Showtime]),
    ShowtimeModule, // This gives access to Showtime repository and services
  ],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}