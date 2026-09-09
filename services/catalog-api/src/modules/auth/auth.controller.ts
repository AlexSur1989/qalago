import { Controller, Get, Post, Body, NotFoundException, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { resolveRequestIp } from '../../common/utils/request-ip.util';
import { AuthService } from './auth.service';
import { SendCodeDto, VerifyCodeDto, DevLoginDto, GoogleAuthDto } from './dto/auth.dto';
import { GoogleAuthLoginService } from './social-auth/google-auth-login.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthLogin: GoogleAuthLoginService,
  ) {}

  @Public()
  @Post('send-code')
  sendCode(@Body() dto: SendCodeDto, @Req() req: Request) {
    return this.authService.sendCode(dto, resolveRequestIp(req));
  }

  @Public()
  @Post('verify-code')
  verifyCode(@Body() dto: VerifyCodeDto, @Req() req: Request) {
    return this.authService.verifyCode(dto, resolveRequestIp(req));
  }

  @Public()
  @Post('dev-login')
  devLogin(@Body() dto: DevLoginDto) {
    if (!this.authService.isDevLoginEnabled()) {
      throw new NotFoundException();
    }
    return this.authService.devLogin(dto);
  }

  @Public()
  @Post('google')
  googleAuth(@Body() dto: GoogleAuthDto, @Req() req: Request) {
    return this.googleAuthLogin.loginWithGoogle(dto.idToken, resolveRequestIp(req));
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser | undefined) {
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.authService.getMe(user.id);
  }
}
