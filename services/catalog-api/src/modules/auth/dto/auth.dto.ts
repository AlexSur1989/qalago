import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SendCodeDto {
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/, { message: 'phone must be a valid E.164-like number' })
  phone!: string;
}

export class VerifyCodeDto {
  @IsString()
  @Matches(/^\+?[0-9]{10,15}$/)
  phone!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(6)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
