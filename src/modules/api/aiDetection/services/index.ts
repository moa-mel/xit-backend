import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '@/modules/core/prisma/services';
import { User, ContentType, AIDetectionStatus, AIDetectionResult } from '@prisma/client';
import { buildResponse, generateId } from '@/utils';
import {
  InitiateAIDetectionDto,
  GetAIDetectionHistoryDto,
  BulkAIDetectionDto,
} from '../dtos';
import {
  AIDetectionNotFoundException,
  InvalidContentTypeException,
  InvalidContentUrlException,
} from '../errors';

@Injectable()
export class AIDetectionService {
  constructor(private prisma: PrismaService) {}

  async initiateDetection(user: User, dto: InitiateAIDetectionDto) {
    if (!this.isValidUrl(dto.contentUrl)) {
      throw new InvalidContentUrlException(
        'Invalid content URL provided',
        HttpStatus.BAD_REQUEST,
      );
    }

    const detection = await this.prisma.aIDetection.create({
      data: {
        identifier: generateId({ type: 'identifier' }),
        contentType: dto.contentType,
        contentUrl: dto.contentUrl,
        contentTitle: dto.contentTitle,
        videoId: dto.videoId,
        podcastId: dto.podcastId,
        liveStreamId: dto.liveStreamId,
        userId: user.id,
        status: AIDetectionStatus.PENDING,
      },
    });

    await this.processDetection(detection.id);

    return buildResponse({
      message: 'AI detection initiated successfully',
      data: detection,
    });
  }

  private async processDetection(detectionId: number) {
    const startTime = Date.now();

    try {
      await this.prisma.aIDetection.update({
        where: { id: detectionId },
        data: { status: AIDetectionStatus.PROCESSING },
      });

      const detectionResult = await this.simulateAIDetection();

      const processingTime = Date.now() - startTime;

      await this.prisma.aIDetection.update({
        where: { id: detectionId },
        data: {
          status: AIDetectionStatus.COMPLETED,
          result: detectionResult.result,
          confidence: detectionResult.confidence,
          detectionMethod: detectionResult.method,
          analysisDetails: detectionResult.details,
          processingTime,
        },
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;

      await this.prisma.aIDetection.update({
        where: { id: detectionId },
        data: {
          status: AIDetectionStatus.FAILED,
          errorMessage: error.message,
          processingTime,
        },
      });
    }
  }

  private async simulateAIDetection() {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const isAIGenerated = Math.random() > 0.5;
    const confidence = Math.floor(Math.random() * 30) + 70; 

    return {
      result: isAIGenerated
        ? AIDetectionResult.AI_GENERATED
        : AIDetectionResult.HUMAN_CREATED,
      confidence,
      method: 'deepfake_detector_v1',
      details: {
        audioAnalysis: {
          voiceConsistency: Math.random() * 100,
          speechPatterns: Math.random() * 100,
          backgroundNoise: Math.random() * 100,
        },
        videoAnalysis: {
          faceConsistency: Math.random() * 100,
          eyeMovement: Math.random() * 100,
          lightingConsistency: Math.random() * 100,
          artifactDetection: Math.random() * 100,
        },
        timestamp: new Date(),
      },
    };
  }

  async getDetectionResult(user: User, detectionId: number) {
    const detection = await this.prisma.aIDetection.findUnique({
      where: { id: detectionId },
      include: {
        video: true,
        podcast: true,
        liveStream: true,
      },
    });

    if (!detection) {
      throw new AIDetectionNotFoundException(
        'Detection record not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (detection.userId !== user.id) {
      throw new AIDetectionNotFoundException(
        'You do not have access to this detection record',
        HttpStatus.FORBIDDEN,
      );
    }

    return buildResponse({
      message: 'Detection result retrieved successfully',
      data: detection,
    });
  }

  async getDetectionHistory(user: User, dto: GetAIDetectionHistoryDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { userId: user.id };

    if (dto.contentType) {
      where.contentType = dto.contentType;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    const [detections, total] = await Promise.all([
      this.prisma.aIDetection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          video: true,
          podcast: true,
          liveStream: true,
        },
      }),
      this.prisma.aIDetection.count({ where }),
    ]);

    return buildResponse({
      message: 'Detection history retrieved successfully',
      data: {
        records: detections,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  }

  async getDetectionStats(user: User) {
    const stats = await this.prisma.aIDetection.groupBy({
      by: ['result', 'contentType'],
      where: { userId: user.id },
      _count: true,
    });

    const totalDetections = await this.prisma.aIDetection.count({
      where: { userId: user.id },
    });

    const completedDetections = await this.prisma.aIDetection.count({
      where: {
        userId: user.id,
        status: AIDetectionStatus.COMPLETED,
      },
    });

    const aiGeneratedCount = await this.prisma.aIDetection.count({
      where: {
        userId: user.id,
        result: AIDetectionResult.AI_GENERATED,
      },
    });

    const humanCreatedCount = await this.prisma.aIDetection.count({
      where: {
        userId: user.id,
        result: AIDetectionResult.HUMAN_CREATED,
      },
    });

    return buildResponse({
      message: 'Detection statistics retrieved successfully',
      data: {
        totalDetections,
        completedDetections,
        aiGeneratedCount,
        humanCreatedCount,
        inconclusiveCount: totalDetections - aiGeneratedCount - humanCreatedCount,
        byContentType: stats,
      },
    });
  }

  async bulkDetection(user: User, dto: BulkAIDetectionDto) {
    const detections = await Promise.all(
      dto.contentUrls.map((url) =>
        this.initiateDetection(user, {
          contentType: dto.contentType,
          contentUrl: url,
          contentTitle: dto.batchName,
        }),
      ),
    );

    return buildResponse({
      message: 'Bulk AI detection initiated successfully',
      data: {
        count: detections.length,
        detections,
      },
    });
  }

  async deleteDetection(user: User, detectionId: number) {
    const detection = await this.prisma.aIDetection.findUnique({
      where: { id: detectionId },
    });

    if (!detection) {
      throw new AIDetectionNotFoundException(
        'Detection record not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (detection.userId !== user.id) {
      throw new AIDetectionNotFoundException(
        'You do not have access to this detection record',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.prisma.aIDetection.delete({
      where: { id: detectionId },
    });

    return buildResponse({
      message: 'Detection record deleted successfully',
    });
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async getVideoDetections(user: User, videoId: number) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new AIDetectionNotFoundException(
        'Video not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (video.userId !== user.id) {
      throw new AIDetectionNotFoundException(
        'You do not have access to this video',
        HttpStatus.FORBIDDEN,
      );
    }

    const detections = await this.prisma.aIDetection.findMany({
      where: { videoId },
      orderBy: { createdAt: 'desc' },
    });

    return buildResponse({
      message: 'Video detections retrieved successfully',
      data: detections,
    });
  }

  async getPodcastDetections(user: User, podcastId: number) {
    const podcast = await this.prisma.podCast.findUnique({
      where: { id: podcastId },
    });

    if (!podcast) {
      throw new AIDetectionNotFoundException(
        'Podcast not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (podcast.userId !== user.id) {
      throw new AIDetectionNotFoundException(
        'You do not have access to this podcast',
        HttpStatus.FORBIDDEN,
      );
    }

    const detections = await this.prisma.aIDetection.findMany({
      where: { podcastId },
      orderBy: { createdAt: 'desc' },
    });

    return buildResponse({
      message: 'Podcast detections retrieved successfully',
      data: detections,
    });
  }

  async getLiveStreamDetections(user: User, liveStreamId: number) {
    const liveStream = await this.prisma.liveStream.findUnique({
      where: { id: liveStreamId },
    });

    if (!liveStream) {
      throw new AIDetectionNotFoundException(
        'Live stream not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (liveStream.userId !== user.id) {
      throw new AIDetectionNotFoundException(
        'You do not have access to this live stream',
        HttpStatus.FORBIDDEN,
      );
    }

    const detections = await this.prisma.aIDetection.findMany({
      where: { liveStreamId },
      orderBy: { createdAt: 'desc' },
    });

    return buildResponse({
      message: 'Live stream detections retrieved successfully',
      data: detections,
    });
  }
}
