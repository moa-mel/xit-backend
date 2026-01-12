import { IsOptional, IsString } from "class-validator"

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

