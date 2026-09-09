import { IsArray, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { BusinessMembershipStatus, BusinessPermission } from '@prisma/client';

export class InviteTeamMemberDto {
  /** Legacy phone invitation (OTP auto-claim on login). */
  @IsOptional()
  @IsString()
  phone?: string;

  /** Email invitation with secure one-time token (Stage 6.2B6). */
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsArray()
  @IsEnum(BusinessPermission, { each: true })
  permissions!: BusinessPermission[];
}

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsArray()
  @IsEnum(BusinessPermission, { each: true })
  permissions?: BusinessPermission[];

  @IsOptional()
  @IsEnum(BusinessMembershipStatus)
  status?: BusinessMembershipStatus;
}
