import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { BusinessInvitationService } from './business-invitation.service';
import { InvitationTokenDto } from './dto/invitation.dto';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitations: BusinessInvitationService) {}

  @Public()
  @Post('resolve')
  resolve(@Body() dto: InvitationTokenDto, @Req() req: Request) {
    const clientKey = req.ip ?? 'unknown';
    this.invitations.assertResolveRateLimit(clientKey);
    return this.invitations.resolveByToken(dto.token);
  }

  @Post('accept')
  accept(@CurrentUser() user: AuthUser, @Body() dto: InvitationTokenDto) {
    return this.invitations.acceptByToken(user, dto.token);
  }
}
