import { BusinessOwnershipClaimStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateOwnershipClaimDto {
  @IsOptional()
  @IsString()
  @Length(0, 500)
  claimantMessage?: string;
}

export class RejectOwnershipClaimDto {
  @IsString()
  @Length(3, 500)
  rejectionReason!: string;
}

export class ListMyOwnershipClaimsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class AdminListOwnershipClaimsQueryDto {
  @IsOptional()
  @IsEnum(BusinessOwnershipClaimStatus)
  status?: BusinessOwnershipClaimStatus;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  citySlug?: string;

  @IsOptional()
  @IsString()
  businessId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
