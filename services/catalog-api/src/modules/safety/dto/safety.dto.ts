import {
  ContentReportReason,
  ContentReportTargetType,
  DataRightsRequestType,
  GovernmentRequestStatus,
  LegalAcceptanceSource,
  LegalDocumentType,
  LegalLocale,
  ModerationActionType,
  ModerationCaseStatus,
  SecurityIncidentSeverity,
  SecurityIncidentStatus,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { MAX_APPEAL_REASON_LENGTH, MAX_REPORT_DETAILS_LENGTH } from '../safety.constants';

export class PublicLegalQueryDto {
  @IsOptional()
  @IsEnum(LegalLocale)
  locale?: LegalLocale;
}

export class AcceptLegalDto {
  @IsString()
  documentId!: string;

  @IsString()
  documentVersion!: string;

  @IsEnum(LegalAcceptanceSource)
  acceptanceSource!: LegalAcceptanceSource;

  @IsEnum(LegalLocale)
  locale!: LegalLocale;
}

export class AcceptLegalItemDto {
  @IsString()
  documentId!: string;

  @IsString()
  documentVersion!: string;
}

export const CONTEXTUAL_LEGAL_REQUIREMENT_CONTEXTS = [
  'PLAN_PURCHASE',
  'AD_PURCHASE',
  'BUSINESS_APPLICATION',
] as const;

export type ContextualLegalRequirementContext =
  (typeof CONTEXTUAL_LEGAL_REQUIREMENT_CONTEXTS)[number];

export class AcceptRequiredLegalDto {
  @IsEnum(LegalAcceptanceSource)
  acceptanceSource!: LegalAcceptanceSource;

  @IsEnum(LegalLocale)
  locale!: LegalLocale;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AcceptLegalItemDto)
  items!: AcceptLegalItemDto[];

  @IsOptional()
  @IsIn([...CONTEXTUAL_LEGAL_REQUIREMENT_CONTEXTS])
  context?: ContextualLegalRequirementContext;
}

export class LegalCurrentQueryDto {
  @IsOptional()
  @IsEnum(LegalLocale)
  locale?: LegalLocale;
}

export class LegalRequiredQueryDto {
  @IsIn([...CONTEXTUAL_LEGAL_REQUIREMENT_CONTEXTS])
  context!: ContextualLegalRequirementContext;

  @IsOptional()
  @IsEnum(LegalLocale)
  locale?: LegalLocale;
}

export class CreateReportDto {
  @IsEnum(ContentReportTargetType)
  targetType!: ContentReportTargetType;

  @IsString()
  @MinLength(1)
  targetId!: string;

  @IsEnum(ContentReportReason)
  reason!: ContentReportReason;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_REPORT_DETAILS_LENGTH)
  details?: string;
}

export class CreateDataRightsRequestDto {
  @IsEnum(DataRightsRequestType)
  type!: DataRightsRequestType;
}

export class ApplyModerationActionDto {
  @IsEnum(ModerationActionType)
  actionType!: ModerationActionType;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  reasonCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  internalNote?: string;
}

export class SubmitAppealDto {
  @IsString()
  @MinLength(3)
  @MaxLength(MAX_APPEAL_REASON_LENGTH)
  reason!: string;
}

export class ListModerationCasesQueryDto {
  @IsOptional()
  @IsEnum(ModerationCaseStatus)
  status?: ModerationCaseStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}

export class UpdateGovernmentRequestDto {
  @IsOptional()
  @IsEnum(GovernmentRequestStatus)
  status?: GovernmentRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  responseSummary?: string;
}

export class CreateSecurityIncidentDto {
  @IsEnum(SecurityIncidentSeverity)
  severity!: SecurityIncidentSeverity;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  summary?: string;
}

export class UpdateSecurityIncidentDto {
  @IsOptional()
  @IsEnum(SecurityIncidentStatus)
  status?: SecurityIncidentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  summary?: string;
}

export class LegalDocumentTypeParamDto {
  @IsEnum(LegalDocumentType)
  type!: LegalDocumentType;
}
