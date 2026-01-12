import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsOptional, IsString, IsUrl } from "class-validator";


export class CreateLiveStreamDto {
    @IsString()
    title: string

}

export class EndLiveStreamDto {
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  title?: string; // Optional custom title for recording
}