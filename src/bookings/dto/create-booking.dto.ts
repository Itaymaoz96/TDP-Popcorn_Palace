import { IsString, IsInt, IsPositive } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  showtimeId: number;

  @IsInt()
  @IsPositive()
  seatNumber: number;

  @IsString()
  userId: string;
}