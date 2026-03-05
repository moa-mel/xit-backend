import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
  Version,
} from '@nestjs/common';
import { AIDetectionService } from '../services';
import {
  InitiateAIDetectionDto,
  GetAIDetectionHistoryDto,
  BulkAIDetectionDto,
} from '../dtos';
import { AuthGuard } from '@/modules/api/auth/guards';
import { User } from '@prisma/client';
import { GetUser } from '../../user/decorators';

@Controller('ai-detection')
@UseGuards(AuthGuard)
export class AIDetectionController {
  constructor(private aiDetectionService: AIDetectionService) {}

  @Post('detect')
  async initiateDetection(
    @GetUser() user: User,
    @Body() dto: InitiateAIDetectionDto,
  ) {
    return this.aiDetectionService.initiateDetection(user, dto);
  }

  @Post('bulk-detect')
  async bulkDetection(
    @GetUser() user: User,
    @Body() dto: BulkAIDetectionDto,
  ) {
    return this.aiDetectionService.bulkDetection(user, dto);
  }

  @Get(':id')
  async getDetectionResult(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) detectionId: number,
  ) {
    return this.aiDetectionService.getDetectionResult(user, detectionId);
  }


  @Get('history/all')
  async getDetectionHistory(
    @GetUser() user: User,
    @Query() dto: GetAIDetectionHistoryDto,
  ) {
    return this.aiDetectionService.getDetectionHistory(user, dto);
  }

  @Get('stats/overview')
  async getDetectionStats(@GetUser() user: User) {
    return this.aiDetectionService.getDetectionStats(user);
  }

  @Get('video/:videoId')
  async getVideoDetections(
    @GetUser() user: User,
    @Param('videoId', ParseIntPipe) videoId: number,
  ) {
    return this.aiDetectionService.getVideoDetections(user, videoId);
  }

  @Get('podcast/:podcastId')
  async getPodcastDetections(
    @GetUser() user: User,
    @Param('podcastId', ParseIntPipe) podcastId: number,
  ) {
    return this.aiDetectionService.getPodcastDetections(user, podcastId);
  }

  @Get('livestream/:liveStreamId')
  async getLiveStreamDetections(
    @GetUser() user: User,
    @Param('liveStreamId', ParseIntPipe) liveStreamId: number,
  ) {
    return this.aiDetectionService.getLiveStreamDetections(user, liveStreamId);
  }

  @Delete(':id')
  async deleteDetection(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) detectionId: number,
  ) {
    return this.aiDetectionService.deleteDetection(user, detectionId);
  }
}
