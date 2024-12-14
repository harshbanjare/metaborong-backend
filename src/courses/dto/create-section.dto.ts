import { IsString, IsNumber, Min } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  title: string;

  @IsNumber()
  @Min(1)
  order: number;
}
