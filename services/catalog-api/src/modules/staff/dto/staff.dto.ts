import { UserRole } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

const STAFF_ASSIGN_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.CITY_ADMIN,
  UserRole.MODERATOR,
  UserRole.SALES_MANAGER,
  UserRole.CONTENT_MANAGER,
  UserRole.FINANCE,
  UserRole.SUPPORT,
  UserRole.ANALYST,
  UserRole.TECH_ADMIN,
] as const;

export class CreateStaffAccessDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  phone?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(UserRole)
  staffRole!: (typeof STAFF_ASSIGN_ROLES)[number];

  @IsOptional()
  @IsString()
  managedCityId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  cityIds?: string[];
}

export class UpdateStaffRoleDto {
  @IsEnum(UserRole)
  staffRole!: UserRole;
}

export class SetStaffCityScopesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  cityIds!: string[];
}
