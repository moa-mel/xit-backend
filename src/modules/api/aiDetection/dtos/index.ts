import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { ContentType, AIDetectionResult } from '@prisma/client';

export class InitiateAIDetectionDto {
  @IsEnum(ContentType)
  @IsNotEmpty()
  contentType: ContentType;

  @IsString()
  @IsNotEmpty()
  contentUrl: string;

  @IsString()
  @IsOptional()
  contentTitle?: string;

  @IsNumber()
  @IsOptional()
  videoId?: number;

  @IsNumber()
  @IsOptional()
  podcastId?: number;

  @IsNumber()
  @IsOptional()
  liveStreamId?: number;
}

export class AIDetectionResultDto {
  id: number;
  identifier: string;
  contentType: ContentType;
  contentUrl: string;
  contentTitle?: string;
  status: string;
  result?: AIDetectionResult;
  confidence?: number;
  detectionMethod?: string;
  analysisDetails?: any;
  processingTime?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GetAIDetectionHistoryDto {
  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class BulkAIDetectionDto {
  @IsNotEmpty()
  contentUrls: string[];

  @IsEnum(ContentType)
  @IsNotEmpty()
  contentType: ContentType;

  @IsOptional()
  @IsString()
  batchName?: string;
}
