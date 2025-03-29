import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus, HttpException } from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entities/movie.entity';

@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get('all')
  findAll(): Promise<Movie[]> {
    return this.movieService.findAll();
  }

  @Post()
  async create(@Body() createMovieDto: CreateMovieDto): Promise<Movie> {
    try {
      return await this.movieService.create(createMovieDto);
    } catch (error) {
      // Rethrow the error to maintain the error response
      throw error;
    }
  }

  @Post('update/:movieTitle')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('movieTitle') movieTitle: string,
    @Body() updateMovieDto: UpdateMovieDto,
  ): Promise<{ success: boolean, message: string }> {
    try {
      await this.movieService.update(movieTitle, updateMovieDto);
      return {
        success: true,
        message: `Movie "${movieTitle}" was successfully updated.`
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(':movieTitle')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('movieTitle') movieTitle: string): Promise<{ success: boolean, message: string }> {
    try {
      await this.movieService.remove(movieTitle);
      return {
        success: true,
        message: `Movie "${movieTitle}" was successfully deleted.`
      };
    } catch (error) {
      throw error;
    }
  }
}