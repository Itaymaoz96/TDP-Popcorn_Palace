import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Showtime } from '../../showtimes/entities/showtime.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  bookingId: string;

  @Column()
  showtimeId: number;

  @Column()
  seatNumber: number;

  @Column()
  userId: string;

  @ManyToOne(() => Showtime, (showtime) => showtime.bookings)
  @JoinColumn({ name: 'showtimeId' })
  showtime: Showtime;
}