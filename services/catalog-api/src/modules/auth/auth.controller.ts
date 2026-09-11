import {
  Controller,
  Get,
  Post,
  Body,
  NotFoundException,
  Req,
  Res,
  Headers,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { resolveRequestIp } from '../../common/utils/request-ip.util';
import { AuthService } from './auth.service';
import {
  SendCodeDto,
  VerifyCodeDto,
  DevLoginDto,
  GoogleAuthDto,
  AppleAuthDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { REFRESH_COOKIE_NAME, setRefreshCookie, clearRefreshCookie, readRefreshToken } from './auth-cookie.util';
import { AppleAuthLoginService } from './social-auth/apple-auth-login.service';
import { GoogleAuthLoginService } from './social-auth/google-auth-login.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleAuthLogin: GoogleAuthLoginService,
    private readonly appleAuthLogin: AppleAuthLoginService,
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

  @Public()
  @Post('apple')
  appleAuth(@Body() dto: AppleAuthDto, @Req() req: Request) {
    return this.appleAuthLogin.loginWithApple(dto.identityToken, resolveRequestIp(req));
  }

  @Public()
  @Post('refresh')
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Headers('x-qalago-auth-channel') channel?: string,
  ) {
    const refreshToken = dto.refreshToken ?? readRefreshToken(req);
    if (!refreshToken) {
      throw new NotFoundException();
    }
    const result = await this.authService.refresh(refreshToken, req.header('user-agent') ?? undefined);
    if (channel === 'web') {
      setRefreshCookie(res, result.refreshToken, req);
      return { accessToken: result.accessToken, user: result.user };
    }
    return result;
  }

  @Public()
  @Post('logout')
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = dto.refreshToken ?? readRefreshToken(req);
    await this.authService.logout(refreshToken);
    clearRefreshCookie(res);
    return { success: true };
  }

  @Post('logout-all')
  async logoutAll(@CurrentUser() user: AuthUser | undefined) {
    if (!user) {
      throw new NotFoundException();
    }
    return this.authService.logoutAll(user.id);
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser | undefined) {
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.authService.getMe(user.id);
  }
}

export { REFRESH_COOKIE_NAME };
