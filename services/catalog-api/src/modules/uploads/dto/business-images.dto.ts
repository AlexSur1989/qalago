import { IsEnum, IsOptional, IsString } from 'class-validator';

export class AttachBusinessImageDto {
  @IsString()
  imageUrl!: string;

  /** Required for new canonical WebP uploads (from POST /uploads response). */
  @IsOptional()
  @IsString()
  uploadToken?: string;

  @IsOptional()
  asCover?: boolean;

  /** Omit or null = shared/brand image; must belong to :businessId. */
  @IsOptional()
  @IsString()
  locationId?: string;
}

export class ListBusinessImagesQueryDto {
  /** Default `all` when omitted (backward compatible). */
  @IsOptional()
  @IsEnum(['all', 'brand'])
  scope?: 'all' | 'brand';

  /** When set, returns images for this branch only (must belong to :businessId). */
  @IsOptional()
  @IsString()
  locationId?: string;
}
