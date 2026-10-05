import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AllowMfaEnrollment } from '../../common/decorators/allow-mfa-enrollment.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffMfaSelfRoute } from '../../common/decorators/require-staff-permission.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { resolveRequestIp } from '../../common/utils/request-ip.util';
import {
  StaffMfaDisableDto,
  StaffMfaEnrollVerifyDto,
  StaffMfaRegenerateRecoveryDto,
  StaffMfaVerifyLoginDto,
} from './dto/staff-mfa.dto';
import { StaffMfaService } from './staff-mfa.service';

@Controller('auth/staff/mfa')
export class StaffMfaController {
  constructor(private readonly mfa: StaffMfaService) {}

  @StaffMfaSelfRoute()
  @Get('status')
  @AllowMfaEnrollment()
  status(@CurrentUser() user: AuthUser) {
    return this.mfa.getPublicStatus(user);
  }

  @StaffMfaSelfRoute()
  @Post('enroll/start')
  @AllowMfaEnrollment()
  enrollStart(@CurrentUser() user: AuthUser) {
    return this.mfa.enrollStart(user);
  }

  @StaffMfaSelfRoute()
  @Post('enroll/verify')
  @AllowMfaEnrollment()
  enrollVerify(
    @CurrentUser() user: AuthUser,
    @Body() dto: StaffMfaEnrollVerifyDto,
    @Req() req: Request,
  ) {
    return this.mfa.enrollVerify(user, dto, resolveRequestIp(req));
  }

  @Public()
  @Post('verify')
  verifyLogin(@Body() dto: StaffMfaVerifyLoginDto, @Req() req: Request) {
    return this.mfa.verifyLogin(dto, resolveRequestIp(req));
  }

  @StaffMfaSelfRoute()
  @Post('recovery-codes/regenerate')
  regenerate(
    @CurrentUser() user: AuthUser,
    @Body() dto: StaffMfaRegenerateRecoveryDto,
  ) {
    return this.mfa.regenerateRecoveryCodes(user, dto.totp);
  }

  @StaffMfaSelfRoute()
  @Post('disable')
  disable(@CurrentUser() user: AuthUser, @Body() dto: StaffMfaDisableDto) {
    return this.mfa.disableSelf(user, dto.totp);
  }
}
