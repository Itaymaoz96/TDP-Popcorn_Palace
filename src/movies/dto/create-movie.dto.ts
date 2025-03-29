import { IsString, IsNumber, IsInt, Min, Max, Length, IsPositive } from 'class-validator';

export class CreateMovieDto {
  @IsString()
  @Length(1, 100)
  title: string;

  @IsString()
  @Length(1, 50)
  genre: string;

  @IsInt()
  @IsPositive()
  duration: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  rating: number;

  @IsInt()
  @Min(1900)
  releaseYear: number;
}