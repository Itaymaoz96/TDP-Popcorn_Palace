import { IsString, IsNumber, IsPositive, IsDateString, IsInt } from 'class-validator';

export class CreateShowtimeDto {
  @IsInt()
  movieId: number;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  theater: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}