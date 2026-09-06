import { Controller, Get, Post, Body, NotFoundException } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { AuthService } from './auth.service';
import { SendCodeDto, VerifyCodeDto, DevLoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('send-code')
  sendCode(@Body() dto: SendCodeDto) {
    return this.authService.sendCode(dto);
  }

  @Public()
  @Post('verify-code')
  verifyCode(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto);
  }

  @Public()
  @Post('dev-login')
  devLogin(@Body() dto: DevLoginDto) {
    if (!this.authService.isDevLoginEnabled()) {
      throw new NotFoundException();
    }
    return this.authService.devLogin(dto);
  }

  @Get('me')
  async me(@CurrentUser() user: AuthUser | undefined) {
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.authService.getMe(user.id);
  }
}
