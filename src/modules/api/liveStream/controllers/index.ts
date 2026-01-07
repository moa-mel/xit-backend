import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Request,
  ParseIntPipe
} from '@nestjs/common';
import { LiveStreamService } from "../services";
import { CreateLiveStreamDto, EndLiveStreamDto } from "../dtos";
import { User } from '@prisma/client';
import { GetUser } from '../../user/decorators';

@Controller({
  path: 'live-stream',
})

export class LiveStreamController {
  constructor(private readonly liveStreamService: LiveStreamService) { }

  // Create stream (instant or scheduled)
  @Post()
  async create(@Request() req, @Body() dto: CreateLiveStreamDto) {
    return this.liveStreamService.createLiveStream(req.user.id, dto);
  }

  // Start a scheduled stream
  @Patch(':id/start')
  async startScheduled(@Param('id') id: string) {
    return this.liveStreamService.startScheduledStream(+id);
  }

  // End any live stream
  @Patch(':id/end')
  async end(
    @GetUser() user: User, // Assuming you have a custom decorator
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EndLiveStreamDto
  ) {
    return this.liveStreamService.endLiveStream(user, id, dto);
  }

  // Get user's scheduled streams
  @Get('scheduled')
  async getScheduled(@Request() req) {
    return this.liveStreamService.getScheduledStreams(req.user.id);
  }

  // Get all currently live streams
  @Get('live')
  async getLive() {
    return this.liveStreamService.getLiveStreams();
  }
}