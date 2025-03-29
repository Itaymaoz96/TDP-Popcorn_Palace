import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShowtimeController } from './showtime.controller';
import { ShowtimeService } from './showtime.service';
import { Showtime } from './entities/showtime.entity';
import { Movie } from '../movies/entities/movie.entity';
import { MovieModule } from '../movies/movie.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Showtime, Movie]),
    MovieModule, // This gives access to Movie repository and services
  ],
  controllers: [ShowtimeController],
  providers: [ShowtimeService],
  exports: [ShowtimeService],
})
export class ShowtimeModule {}