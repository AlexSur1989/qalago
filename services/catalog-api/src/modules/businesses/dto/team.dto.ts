import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { BusinessMembershipStatus, BusinessPermission } from '@prisma/client';

export class InviteTeamMemberDto {
  @IsString()
  phone!: string;

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
