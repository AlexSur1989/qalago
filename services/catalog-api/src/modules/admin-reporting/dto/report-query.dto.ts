import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import {
  AdCampaignStatus,
  BusinessPlanTier,
  BusinessStatus,
  UserRole,
} from '@prisma/client';
import {
  DEFAULT_REPORT_PAGE_LIMIT,
  MAX_REPORT_PAGE_LIMIT,
} from '../reporting.constants';

export class ReportFiltersDto {
  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsString()
  citySlug?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  subcategoryId?: string;

  @IsOptional()
  @IsString()
  businessId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  placement?: string;

  @IsOptional()
  @IsEnum(BusinessPlanTier)
  plan?: BusinessPlanTier;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class ReportPaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_REPORT_PAGE_LIMIT)
  limit?: number = DEFAULT_REPORT_PAGE_LIMIT;
}

export class AuditReportQueryDto extends ReportFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_REPORT_PAGE_LIMIT)
  limit?: number = DEFAULT_REPORT_PAGE_LIMIT;

  @IsOptional()
  @IsString()
  actorUserId?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  @IsString()
  targetId?: string;
}

export class ExportReportQueryDto extends ReportFiltersDto {
  @IsString()
  report!: string;

  @IsOptional()
  @IsString()
  format?: 'csv';
}

export class BusinessesReportQueryDto extends ReportFiltersDto {
  @IsOptional()
  @IsEnum(BusinessStatus)
  businessStatus?: BusinessStatus;
}

export class AdsReportQueryDto extends ReportFiltersDto {
  @IsOptional()
  @IsEnum(AdCampaignStatus)
  campaignStatus?: AdCampaignStatus;
}
