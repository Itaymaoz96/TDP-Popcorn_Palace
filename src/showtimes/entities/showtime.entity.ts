import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Movie } from '../../movies/entities/movie.entity';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('showtimes')
export class Showtime {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  theater: string;

  @Column('timestamp with time zone')
  startTime: Date;

  @Column('timestamp with time zone')
  endTime: Date;

  @Column()
  movieId: number;

  @ManyToOne(() => Movie, (movie) => movie.showtimes)
  @JoinColumn({ name: 'movieId' })
  movie: Movie;

  @OneToMany(() => Booking, (booking) => booking.showtime)
  bookings: Booking[];
}