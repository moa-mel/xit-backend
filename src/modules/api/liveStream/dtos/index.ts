import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsOptional, IsString, IsUrl } from "class-validator";


export class CreateLiveStreamDto {
    @IsString()
    title: string

    @IsOptional()
    @IsBoolean()
    isScheduled?: boolean;

    // Only required if isScheduled = true
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    scheduledFor?: string;

    @IsOptional()
    @IsString()
    streamUrl?: string;
}

export class EndLiveStreamDto {
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  title?: string; // Optional custom title for recording
}