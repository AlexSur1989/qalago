import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class ListCategoriesQueryDto {
  @IsOptional()
  @IsString()
  citySlug?: string;
}

export class CreateCategoryDto {
  @IsString()
  @Length(2, 100)
  title!: string;

  @IsString()
  @Length(2, 100)
  slug!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(2, 100)
  slug?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
