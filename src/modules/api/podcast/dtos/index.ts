import { IsBooleanString, IsNumber, IsNumberString, IsOptional, IsString } from "class-validator"

export class CreatePodCastDto {
    @IsString()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    picture?: string;

    @IsString()
    audioUrl: string;

    @IsOptional()
    date?: Date;
}

export class ListenToPodcastDto {
    @IsNumber()
    podcastId: number;

    @IsString()
    sessionId?: string;
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

