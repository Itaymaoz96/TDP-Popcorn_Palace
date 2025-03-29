import { Controller, Get, Post, Body, Param, Delete, HttpCode } from '@nestjs/common';
import { ShowtimeService } from './showtime.service';
import { CreateShowtimeDto } from './dto/create-showtime.dto';
import { UpdateShowtimeDto } from './dto/update-showtime.dto';
import { Showtime } from './entities/showtime.entity';

@Controller('showtimes')
export class ShowtimeController {
  constructor(private readonly showtimeService: ShowtimeService) {}

  @Get(':showtimeId')
  findOne(@Param('showtimeId') id: string): Promise<Showtime> {
    return this.showtimeService.findOne(+id);
  }

  @Post()
  create(@Body() createShowtimeDto: CreateShowtimeDto): Promise<Showtime> {
    return this.showtimeService.create(createShowtimeDto);
  }

  @Post('update/:showtimeId')
  @HttpCode(200)
  async update(
    @Param('showtimeId') id: string,
    @Body() updateShowtimeDto: UpdateShowtimeDto,
  ): Promise<void> {
    await this.showtimeService.update(+id, updateShowtimeDto);
  }

  @Delete(':showtimeId')
  @HttpCode(200)
  async remove(@Param('showtimeId') id: string): Promise<void> {
    await this.showtimeService.remove(+id);
  }
}