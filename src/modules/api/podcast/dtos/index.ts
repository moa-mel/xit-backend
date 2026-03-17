import { IsBooleanString, IsNumber, IsNumberString, IsOptional, IsString, IsBoolean, IsDate, Type } from "class-validator"

export class ListenToPodcastDto {
    @IsNumber()
    podcastId: number;

    @IsString()
    sessionId?: string;
}

export class CreatePodCastDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    picture?: string;

    @IsString()
    audioUrl: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    date?: Date;

    @IsOptional()
    @IsBoolean()
    triggerAIDetection?: boolean = true;
}

export class GetPodcastStatsDto {
    @IsNumber()
    podcastId: number;
}

export class PaginationDto {
  @IsOptional()
  @IsBooleanString()
  pagination?: string;

  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}

