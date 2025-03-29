import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Movie } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    private dataSource: DataSource,
  ) {}

  async findAll(): Promise<Movie[]> {
    return this.movieRepository.find();
  }

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create the movie entity in the transaction
      const movie = this.movieRepository.create(createMovieDto);
      
      // Save using the transaction manager
      const savedMovie = await queryRunner.manager.save(movie);
      
      // Commit the transaction
      await queryRunner.commitTransaction();
      
      return savedMovie;
    } catch (error) {
      // If there's an error, roll back the transaction
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to create movie: ' + error.message);
    } finally {
      // Release the query runner regardless of success or failure
      await queryRunner.release();
    }
  }

  async update(title: string, updateMovieDto: UpdateMovieDto): Promise<void> {
    const movie = await this.movieRepository.findOne({ where: { title } });
    
    if (!movie) {
      throw new NotFoundException(`Movie with title "${title}" not found`);
    }
    
    Object.assign(movie, updateMovieDto);
    await this.movieRepository.save(movie);
  }

  async remove(title: string): Promise<void> {
    const result = await this.movieRepository.delete({ title });
    
    if (result.affected === 0) {
      throw new NotFoundException(`Movie with title "${title}" not found`);
    }
  }
}