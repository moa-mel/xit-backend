import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Request,
  ParseIntPipe,
  UseGuards,
  Query
} from '@nestjs/common';
import { LiveStreamService } from "../services";
import { CreateLiveStreamDto, EndLiveStreamDto, GetStreamStatsDto, SendMessageDto } from "../dtos";
import { User } from '@prisma/client';
import { GetUser } from '../../user/decorators';
import { AuthGuard } from '../../auth/guards';

@UseGuards(AuthGuard)
@Controller({
  path: 'live-stream',
})

export class LiveStreamController {
  constructor(private readonly liveStreamService: LiveStreamService) { }

  // Create stream (instant or scheduled)
  @Post('create')
  async create(@Request() req, @Body() dto: CreateLiveStreamDto) {
    return this.liveStreamService.createLiveStream(req.user, dto);
  }

  // End any live stream
  @Patch(':id/end')
  async end(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EndLiveStreamDto
  ) {
    return this.liveStreamService.endLiveStream(user, id, dto);
  }

  // Get all currently live streams
  @Get('live')
  async getLive() {
    return this.liveStreamService.getLiveStreams();
  }

  @Post('join/:id')
  async joinLiveStream(@Request() req, @Param('id') liveStreamId: number, @Body('sessionId') sessionId?: string
  ) {
    return this.liveStreamService.joinLiveStream(
      +liveStreamId, req.user, sessionId
    );
  }

  @Get('stats/:id')
  async getStreamStats(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.liveStreamService.getStreamStats(id, user);
  }

  @Post('message')
  async sendMessage(@GetUser() user: User, @Body() dto: SendMessageDto) {
    return this.liveStreamService.sendMessage(user, dto);
  }

  @Get('messages/:id')
  async getStreamMessages(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.liveStreamService.getStreamMessages(id, req.user);
  }
}