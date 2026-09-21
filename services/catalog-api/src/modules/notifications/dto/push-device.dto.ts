import { PushPlatform } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterPushDeviceDto {
  @IsString()
  @MinLength(16)
  @MaxLength(4096)
  token!: string;

  @IsEnum(PushPlatform)
  platform!: PushPlatform;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  locale?: string;
}

export class RevokePushDeviceDto {
  @IsString()
  @MinLength(16)
  @MaxLength(4096)
  token!: string;
}

export class PushDeviceResponseDto {
  id!: string;
  platform!: PushPlatform;
  isActive!: boolean;
  lastSeenAt!: string;
}
