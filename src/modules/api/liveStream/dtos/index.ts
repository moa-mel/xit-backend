import { IsBoolean, IsOptional, IsString, IsNumber } from "class-validator";

export class GetStreamStatsDto {
    @IsNumber()
    liveStreamId: number;
}

export class SendMessageDto {
    @IsString()
    content: string;

    @IsNumber()
    liveStreamId: number;
}

export class CreateLiveStreamDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    thumbnailUrl?: string;

    @IsOptional()
    @IsBoolean()
    enableRecording?: boolean = true;

    @IsOptional()
    @IsBoolean()
    enableChat?: boolean = true;
}

export class EndLiveStreamDto {
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsBoolean()
  triggerAIDetection?: boolean = true;
}