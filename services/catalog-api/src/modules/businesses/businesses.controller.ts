import { Controller, Get, Param, Patch, Post, Body, Query, Delete } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { BusinessesService } from './businesses.service';
import { BusinessLocationService } from './business-location.service';
import { BusinessTeamService } from './business-team.service';
import { BusinessPublicContentService } from './business-public-content.service';
import {
  CreateBusinessDto,
  GetBusinessBySlugQueryDto,
  GetBusinessDetailQueryDto,
  ListBusinessesQueryDto,
  UpdateBusinessDto,
} from './dto/business.dto';
import {
  CreateBusinessLocationDto,
  UpdateBusinessLocationDto,
} from './dto/business-location.dto';
import { InviteTeamMemberDto, UpdateTeamMemberDto } from './dto/team.dto';
import { ListBusinessCatalogQueryDto } from './dto/business-catalog.dto';
import { ListBusinessPhotosQueryDto } from './dto/business-photos.dto';
import { ListBusinessPromotionsQueryDto } from './dto/business-promotions.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { ListTeamAuditQueryDto } from '../audit-log/dto/audit-log.dto';

@Controller('businesses')
export class BusinessesController {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly locationService: BusinessLocationService,
    private readonly teamService: BusinessTeamService,
    private readonly publicContent: BusinessPublicContentService,
    private readonly auditLog: AuditLogService,
  ) {}

  /** Platform admin import only — normal users use POST /business-applications (Stage 5N.5). */
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

  /** Must register before `:businessId/locations/:locationId` (Stage 6.12A.7.4). */
  @Public()
  @Get(':id/locations/public')
  listPublicLocations(@Param('id') id: string) {
    return this.locationService.listPublicLocations(id);
  }

  @Get(':businessId/locations')
  listLocations(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
  ) {
    return this.locationService.listLocations(user, businessId);
  }

  @Get(':businessId/locations/:locationId')
  getLocation(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.locationService.getLocation(user, businessId, locationId);
  }

  @Post(':businessId/locations')
  createLocation(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Body() dto: CreateBusinessLocationDto,
  ) {
    return this.locationService.createLocation(user, businessId, dto);
  }

  @Patch(':businessId/locations/:locationId')
  updateLocation(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Param('locationId') locationId: string,
    @Body() dto: UpdateBusinessLocationDto,
  ) {
    return this.locationService.updateLocation(user, businessId, locationId, dto);
  }

  @Post(':businessId/locations/:locationId/set-primary')
  setPrimaryLocation(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.locationService.setPrimaryLocation(user, businessId, locationId);
  }

  @Delete(':businessId/locations/:locationId')
  deleteLocation(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.locationService.deleteLocation(user, businessId, locationId);
  }

  @Get(':businessId/team/audit')
  async listTeamAudit(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Query() query: ListTeamAuditQueryDto,
  ) {
    await this.teamService.ensureTeamFeatureEnabled();
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

  /** F.4 Phase 1 — explicit slug + city context (must not collide with `:id`). */
  @Public()
  @Get('by-slug/:businessSlug')
  findOneBySlug(
    @Param('businessSlug') businessSlug: string,
    @Query() query: GetBusinessBySlugQueryDto,
  ) {
    return this.businessesService.findOneBySlugAndCity(businessSlug, query);
  }

  @Public()
  @Get(':id/catalog')
  findCatalog(@Param('id') id: string, @Query() query: ListBusinessCatalogQueryDto) {
    return this.publicContent.findPublicCatalog(id, query);
  }

  @Public()
  @Get(':id/promotions')
  findPromotions(@Param('id') id: string, @Query() query: ListBusinessPromotionsQueryDto) {
    return this.publicContent.findPublicPromotions(id, query);
  }

  @Public()
  @Get(':id/photos')
  findPhotos(@Param('id') id: string, @Query() query: ListBusinessPhotosQueryDto) {
    return this.publicContent.findPublicPhotos(id, query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string, @Query() query: GetBusinessDetailQueryDto) {
    return this.businessesService.findOne(id, { locationId: query.locationId });
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
