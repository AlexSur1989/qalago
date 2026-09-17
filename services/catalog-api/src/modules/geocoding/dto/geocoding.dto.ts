import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class GeocodingAutocompleteQueryDto {
  @IsString()
  @Length(2, 200)
  q!: string;

  @IsOptional()
  @IsString()
  citySlug?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsIn(['ru', 'kk'])
  language?: 'ru' | 'kk' = 'ru';
}

export class GeocodingReverseQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  @IsOptional()
  @IsIn(['ru', 'kk'])
  language?: 'ru' | 'kk' = 'ru';
}
