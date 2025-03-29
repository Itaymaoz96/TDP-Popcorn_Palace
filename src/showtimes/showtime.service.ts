import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Showtime } from './entities/showtime.entity';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';
import { Movie } from '../movies/entities/movie.entity';

@Injectable()
export class ShowtimeService {
  constructor(
    @InjectRepository(Showtime)
    private readonly showtimeRepository: Repository<Showtime>,
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
  ) {}

  async findOne(id: number): Promise<Showtime> {
    const showtime = await this.showtimeRepository.findOne({ 
      where: { id },
      relations: ['movie'] 
    });
    
    if (!showtime) {
      throw new NotFoundException(`Showtime with ID "${id}" not found`);
    }
    
    return showtime;
  }

  async create(createShowtimeDto: CreateShowtimeDto): Promise<Showtime> {
    // Convert string dates to Date objects
    const startTime = new Date(createShowtimeDto.startTime);
    const endTime = new Date(createShowtimeDto.endTime);
    
    // Validation: end time must be after start time
    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }
    
    // Check if the movie exists
    const movieExists = await this.movieRepository.findOne({
      where: { id: createShowtimeDto.movieId }
    });
    
    if (!movieExists) {
      throw new NotFoundException(`Movie with ID "${createShowtimeDto.movieId}" not found`);
    }
    
    // Check for overlapping showtimes in the same theater
    const overlappingShowtime = await this.checkForOverlappingShowtimes(
      null, 
      createShowtimeDto.theater, 
      startTime, 
      endTime
    );
    
    if (overlappingShowtime) {
      throw new BadRequestException(
        `There is already a showtime scheduled in "${createShowtimeDto.theater}" during the requested time`
      );
    }
    
    const showtime = this.showtimeRepository.create({
      ...createShowtimeDto,
      startTime,
      endTime,
    });
    
    try {
      return await this.showtimeRepository.save(showtime);
    } catch (error) {
      if (error.code === '23503') { // PostgreSQL foreign key violation code
        throw new BadRequestException(`Movie with ID "${createShowtimeDto.movieId}" does not exist`);
      }
      throw error;
    }
  }

  async update(id: number, updateShowtimeDto: UpdateShowtimeDto): Promise<void> {
    const showtime = await this.findOne(id);
    
    // Convert string dates to Date objects if they exist in the DTO
    let startTime = showtime.startTime;
    let endTime = showtime.endTime;
    let theater = showtime.theater;
    
    if (updateShowtimeDto.startTime) {
      startTime = new Date(updateShowtimeDto.startTime);
    }
    
    if (updateShowtimeDto.endTime) {
      endTime = new Date(updateShowtimeDto.endTime);
    }
    
    if (updateShowtimeDto.theater) {
      theater = updateShowtimeDto.theater;
    }
    
    // Validation: if both times provided, end time must be after start time
    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }
    
    // If theater or times have changed, check for overlaps
    if (updateShowtimeDto.theater || updateShowtimeDto.startTime || updateShowtimeDto.endTime) {
      const overlappingShowtime = await this.checkForOverlappingShowtimes(
        id, 
        theater, 
        startTime, 
        endTime
      );
      
      if (overlappingShowtime) {
        throw new BadRequestException(
          `There is already a showtime scheduled in theater "${theater}" during the requested time`
        );
      }
    }
    
    // Apply updates
    Object.assign(showtime, {
      ...updateShowtimeDto,
      startTime,
      endTime
    });
    
    await this.showtimeRepository.save(showtime);
  }

  async remove(id: number): Promise<void> {
    const result = await this.showtimeRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Showtime with ID "${id}" not found`);
    }
  }

  /**
   * Helper method to check for overlapping showtimes
   * @param currentId - ID of current showtime (to exclude from check)
   * @param theater - Theater to check
   * @param startTime - Start time to check
   * @param endTime - End time to check
   * @returns The first overlapping showtime found, or null if none
   */
  private async checkForOverlappingShowtimes(
    currentId: number | null, 
    theater: string, 
    startTime: Date, 
    endTime: Date
  ): Promise<Showtime | null> {
    // Build the base query
    const query = this.showtimeRepository
      .createQueryBuilder('showtime')
      .where('showtime.theater = :theater', { theater });
    
    // Add time overlap conditions
    query.andWhere(
      '((:startTime >= showtime.startTime AND :startTime < showtime.endTime) OR ' +
      '(:endTime > showtime.startTime AND :endTime <= showtime.endTime) OR ' +
      '(:startTime <= showtime.startTime AND :endTime >= showtime.endTime))',
      { startTime, endTime }
    );
    
    // Exclude the current showtime if updating
    if (currentId !== null) {
      query.andWhere('showtime.id != :id', { id: currentId });
    }
    
    // Execute the query
    return await query.getOne();
  }
}