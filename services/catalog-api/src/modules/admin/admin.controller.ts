import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { StaffPermission } from '@qalago/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  AdminStaffRoute,
  RequireStaffPermission,
  RequireStaffStepUp,
} from '../../common/decorators/require-staff-permission.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import {
  AdminListBusinessesQueryDto,
  AdminListCategoriesQueryDto,
  AdminListReviewsQueryDto,
  AdminCreateBusinessDto,
  AdminPatchBusinessCatalogDto,
  GeoSearchQueryDto,
  UpdateBusinessFeaturedDto,
  UpdateBusinessPlanDto,
  UpdateBusinessStatusDto,
  UpdateCategoryCityOrderDto,
  UpdateCategoryCityVisibilityDto,
  UpdateBusinessTaxonomyDto,
  UpdateUserRoleDto,
} from './dto/admin.dto';
import { CreateSubcategoryDto, UpdateSubcategoryDto } from '../categories/dto/subcategory.dto';
import { CreateCityDto, UpdateCityDto } from '../cities/dto/city.dto';
import { AdminService } from './admin.service';
import { SystemAccessService } from '../../common/services/system-access.service';

@Controller('admin')
@AdminStaffRoute()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly systemAccess: SystemAccessService,
  ) {}

  @RequireStaffPermission(StaffPermission.BUSINESS_VIEW)
  @Get('businesses')
  listBusinesses(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminListBusinessesQueryDto,
  ) {
    return this.adminService.listBusinesses(user, query);
  }

  @RequireStaffPermission(StaffPermission.BUSINESS_CREATE)
  @Post('businesses')
  createBusiness(@CurrentUser() user: AuthUser, @Body() dto: AdminCreateBusinessDto) {
    return this.adminService.createStaffBusiness(user, dto);
  }

  @RequireStaffPermission(StaffPermission.BUSINESS_VIEW)
  @Get('businesses/:id')
  getBusiness(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.adminService.getBusinessDetail(user, id);
  }

  @RequireStaffPermission(StaffPermission.BUSINESS_VIEW)
  @Get('businesses/:id/locations')
  listBusinessLocations(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.adminService.listBusinessLocations(user, id);
  }

  @RequireStaffPermission(StaffPermission.BUSINESS_EDIT)
  @Patch('businesses/:id/catalog')
  patchBusinessCatalog(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdminPatchBusinessCatalogDto,
  ) {
    return this.adminService.patchBusinessCatalog(user, id, dto);
  }

  @RequireStaffPermission(StaffPermission.BUSINESS_VIEW)
  @Get('businesses/:businessId/content')
  getBusinessContent(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
  ) {
    return this.adminService.getBusinessContent(user, businessId);
  }

  @RequireStaffPermission(StaffPermission.BUSINESS_EDIT)
  @Patch('businesses/:id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessStatusDto,
  ) {
    return this.adminService.updateBusinessStatus(user, id, dto);
  }

  @RequireStaffPermission(StaffPermission.BUSINESS_EDIT)
  @Patch('businesses/:id/featured')
  updateFeatured(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessFeaturedDto,
  ) {
    return this.adminService.updateBusinessFeatured(user, id, dto);
  }

  @RequireStaffPermission(StaffPermission.BUSINESS_EDIT)
  @Patch('businesses/:id/plan')
  updatePlan(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessPlanDto,
  ) {
    return this.adminService.updateBusinessPlan(user, id, dto);
  }

  @RequireStaffPermission(StaffPermission.CATEGORY_EDIT)
  @Patch('businesses/:id/taxonomy')
  updateBusinessTaxonomy(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessTaxonomyDto,
  ) {
    return this.adminService.updateBusinessTaxonomy(user, id, dto);
  }

  @RequireStaffPermission(StaffPermission.CATEGORY_VIEW)
  @Get('categories/:categoryId/subcategories')
  listSubcategories(
    @CurrentUser() user: AuthUser,
    @Param('categoryId') categoryId: string,
  ) {
    return this.adminService.listSubcategories(user, categoryId);
  }

  @RequireStaffPermission(StaffPermission.CATEGORY_EDIT)
  @Post('categories/:categoryId/subcategories')
  createSubcategory(
    @CurrentUser() user: AuthUser,
    @Param('categoryId') categoryId: string,
    @Body() dto: CreateSubcategoryDto,
  ) {
    return this.adminService.createSubcategory(user, { ...dto, categoryId });
  }

  @RequireStaffPermission(StaffPermission.CATEGORY_EDIT)
  @Patch('subcategories/:id')
  updateSubcategory(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSubcategoryDto,
  ) {
    return this.adminService.updateSubcategory(user, id, dto);
  }

  @RequireStaffPermission(StaffPermission.CATEGORY_EDIT)
  @Patch('subcategories/:id/deactivate')
  deactivateSubcategory(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.adminService.deactivateSubcategory(user, id);
  }

  @RequireStaffPermission(StaffPermission.CATEGORY_EDIT)
  @RequireStaffStepUp()
  @Delete('subcategories/:id')
  deleteSubcategory(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.adminService.deleteSubcategory(user, id);
  }

  @RequireStaffPermission(StaffPermission.USER_VIEW)
  @Get('users')
  listUsers(@CurrentUser() user: AuthUser) {
    return this.adminService.listUsers();
  }

  @RequireStaffPermission(StaffPermission.STAFF_ROLE_ASSIGN)
  @RequireStaffStepUp()
  @Patch('users/:id/role')
  updateUserRole(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(user, id, dto);
  }

  @RequireStaffPermission(StaffPermission.MODERATION_VIEW)
  @Get('reviews')
  listReviews(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminListReviewsQueryDto,
  ) {
    return this.adminService.listReviews(user, query);
  }

  @RequireStaffPermission(StaffPermission.MODERATION_ACT)
  @Delete('reviews/:id')
  deleteReview(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.adminService.deleteReview(user, id);
  }

  @RequireStaffPermission(StaffPermission.CATEGORY_VIEW)
  @Get('categories')
  listCategories(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminListCategoriesQueryDto,
  ) {
    return this.adminService.listCategories(user, query.citySlug);
  }

  @RequireStaffPermission(StaffPermission.CATEGORY_EDIT)
  @Patch('categories/:id/city-order')
  updateCategoryCityOrder(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryCityOrderDto,
  ) {
    return this.adminService.updateCategoryCityOrder(user, id, dto);
  }

  @RequireStaffPermission(StaffPermission.CATEGORY_EDIT)
  @Patch('categories/:id/city-visibility')
  updateCategoryCityVisibility(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryCityVisibilityDto,
  ) {
    return this.adminService.updateCategoryCityVisibility(user, id, dto);
  }

  @RequireStaffPermission(StaffPermission.STAFF_VIEW)
  @Get('geo/search')
  searchGeo(@Query() query: GeoSearchQueryDto) {
    return this.adminService.searchGeoPlaces(query.q, query.country ?? 'kz');
  }

  @RequireStaffPermission(StaffPermission.STAFF_VIEW)
  @Get('cities')
  listCitiesAdmin() {
    return this.adminService.listCitiesAdmin();
  }

  @RequireStaffPermission(StaffPermission.STAFF_VIEW)
  @RequireStaffStepUp()
  @Post('cities')
  createCity(@CurrentUser() user: AuthUser, @Body() dto: CreateCityDto) {
    return this.adminService.createCity(user, dto);
  }

  @RequireStaffPermission(StaffPermission.STAFF_VIEW)
  @RequireStaffStepUp()
  @Patch('cities/:id')
  updateCity(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCityDto,
  ) {
    return this.adminService.updateCity(user, id, dto);
  }
}

