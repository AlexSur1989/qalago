import { IsOptional, IsString, Length, Matches, ValidateIf } from 'class-validator';

export class StaffMfaEnrollVerifyDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  totp!: string;
}

export class StaffMfaVerifyLoginDto {
  @IsString()
  mfaChallengeToken!: string;

  @ValidateIf((o: StaffMfaVerifyLoginDto) => !o.recoveryCode)
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  totp?: string;

  @ValidateIf((o: StaffMfaVerifyLoginDto) => !o.totp)
  @IsString()
  recoveryCode?: string;
}

export class StaffMfaStepUpDto {
  @ValidateIf((o: StaffMfaStepUpDto) => !o.recoveryCode)
  @IsOptional()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  totp?: string;

  @ValidateIf((o: StaffMfaStepUpDto) => !o.totp)
  @IsOptional()
  @IsString()
  recoveryCode?: string;

  /** Legacy OTP re-verify when MFA not yet enabled (transition). */
  @ValidateIf((o: StaffMfaStepUpDto) => !o.totp && !o.recoveryCode)
  @IsOptional()
  @IsString()
  code?: string;
}

export class StaffMfaDisableDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  totp!: string;
}

export class StaffMfaRegenerateRecoveryDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  totp!: string;
}
