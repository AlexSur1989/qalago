import { Controller, Get, Param, Patch, Post, Body, Query, Delete } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { BusinessesService } from './businesses.service';
import { BusinessTeamService } from './business-team.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { CreateBusinessDto, ListBusinessesQueryDto, UpdateBusinessDto } from './dto/business.dto';
import { InviteTeamMemberDto, UpdateTeamMemberDto } from './dto/team.dto';
import { ListBusinessCatalogQueryDto } from './dto/business-catalog.dto';
import { ListBusinessPhotosQueryDto } from './dto/business-photos.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ListTeamAuditQueryDto } from '../audit-log/dto/audit-log.dto';

@Controller('businesses')
export class BusinessesController {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly teamService: BusinessTeamService,
    private readonly publicContent: BusinessPublicContentService,
    private readonly auditLog: AuditLogService,
  ) {}

  /** @deprecated Use POST /business-applications — legacy direct create until Stage 5N.4 */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBusinessDto) {
    return this.businessesService.create(user, dto);
  }

  @Public()
  @Get()
  findAll(@Query() query: ListBusinessesQueryDto) {
    return this.businessesService.findAll(query);
  }

  @Get('my')
  findMy(@CurrentUser() user: AuthUser) {
    return this.businessesService.findMy(user);
  }

  @Get('recommended/me')
  recommended(@CurrentUser() user: AuthUser, @Query('citySlug') citySlug?: string) {
    return this.businessesService.recommended(user, citySlug);
  }

  @Get(':businessId/team/audit')
  listTeamAudit(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Query() query: ListTeamAuditQueryDto,
  ) {
    return this.auditLog.listTeamHistory(user, businessId, query);
  }

  @Get(':businessId/team')
  listTeam(@CurrentUser() user: AuthUser, @Param('businessId') businessId: string) {
    return this.teamService.listTeam(user, businessId);
  }

  @Post(':businessId/team/invite')
  inviteTeamMember(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Body() dto: InviteTeamMemberDto,
  ) {
    return this.teamService.inviteManager(user, businessId, dto);
  }

  @Patch(':businessId/team/:membershipId')
  updateTeamMember(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.teamService.updateMember(user, businessId, membershipId, dto);
  }

  @Delete(':businessId/team/invitations/:invitationId')
  revokeInvitation(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Param('invitationId') invitationId: string,
  ) {
    return this.teamService.revokeInvitation(user, businessId, invitationId);
  }

  @Public()
  @Get(':id/catalog')
  findCatalog(@Param('id') id: string, @Query() query: ListBusinessCatalogQueryDto) {
    return this.publicContent.findPublicCatalog(id, query);
  }

  @Public()
  @Get(':id/photos')
  findPhotos(@Param('id') id: string, @Query() query: ListBusinessPhotosQueryDto) {
    return this.publicContent.findPublicPhotos(id, query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateBusinessDto,
  ) {
    return this.businessesService.update(id, user, dto);
  }
}
