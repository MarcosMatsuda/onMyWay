import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class SaveLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;

  @IsString()
  schoolId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number;
}
