import { IsString, IsNumber, IsOptional, IsArray, Min } from 'class-validator';

export class CreateLectureDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsArray()
  @IsString({ each: true })
  resourceUrls: string[];

  @IsNumber()
  @Min(0)
  duration: number;
}
