import {
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
  Min,
  IsOptional,
} from 'class-validator';
import { CourseCategory } from '../enums/course-category.enum';
import { CourseDifficulty } from '../enums/course-difficulty.enum';

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsEnum(CourseCategory)
  category: CourseCategory;

  @IsEnum(CourseDifficulty)
  difficulty: CourseDifficulty;

  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
