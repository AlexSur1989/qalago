import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import {
  AdminListBusinessesQueryDto,
  AdminListCategoriesQueryDto,
  AdminListReviewsQueryDto,
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
@Roles(UserRole.ADMIN, UserRole.CITY_ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly systemAccess: SystemAccessService,
  ) {}

  @Get('businesses')
  listBusinesses(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminListBusinessesQueryDto,
  ) {
    return this.adminService.listBusinesses(user, query);
  }

  @Patch('businesses/:id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessStatusDto,
  ) {
    return this.adminService.updateBusinessStatus(user, id, dto);
  }

  @Patch('businesses/:id/featured')
  updateFeatured(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessFeaturedDto,
  ) {
    return this.adminService.updateBusinessFeatured(user, id, dto);
  }

  @Patch('businesses/:id/plan')
  updatePlan(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessPlanDto,
  ) {
    return this.adminService.updateBusinessPlan(user, id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch('businesses/:id/taxonomy')
  updateBusinessTaxonomy(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateBusinessTaxonomyDto,
  ) {
    return this.adminService.updateBusinessTaxonomy(user, id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Get('categories/:categoryId/subcategories')
  listSubcategories(
    @CurrentUser() user: AuthUser,
    @Param('categoryId') categoryId: string,
  ) {
    return this.adminService.listSubcategories(user, categoryId);
  }

  @Roles(UserRole.ADMIN)
  @Post('categories/:categoryId/subcategories')
  createSubcategory(
    @CurrentUser() user: AuthUser,
    @Param('categoryId') categoryId: string,
    @Body() dto: CreateSubcategoryDto,
  ) {
    return this.adminService.createSubcategory(user, { ...dto, categoryId });
  }

  @Roles(UserRole.ADMIN)
  @Patch('subcategories/:id')
  updateSubcategory(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateSubcategoryDto,
  ) {
    return this.adminService.updateSubcategory(user, id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch('subcategories/:id/deactivate')
  deactivateSubcategory(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.adminService.deactivateSubcategory(user, id);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Delete('subcategories/:id')
  deleteSubcategory(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.adminService.deleteSubcategory(user, id);
  }

  @Roles(UserRole.ADMIN)
  @Get('users')
  listUsers(@CurrentUser() user: AuthUser) {
    this.systemAccess.assertGlobalAdmin(user);
    return this.adminService.listUsers();
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch('users/:id/role')
  updateUserRole(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.adminService.updateUserRole(user, id, dto);
  }

  @Get('reviews')
  listReviews(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminListReviewsQueryDto,
  ) {
    return this.adminService.listReviews(user, query);
  }

  @Delete('reviews/:id')
  deleteReview(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.adminService.deleteReview(user, id);
  }

  @Get('categories')
  listCategories(
    @CurrentUser() user: AuthUser,
    @Query() query: AdminListCategoriesQueryDto,
  ) {
    return this.adminService.listCategories(user, query.citySlug);
  }

  @Patch('categories/:id/city-order')
  updateCategoryCityOrder(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryCityOrderDto,
  ) {
    return this.adminService.updateCategoryCityOrder(user, id, dto);
  }

  @Patch('categories/:id/city-visibility')
  updateCategoryCityVisibility(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryCityVisibilityDto,
  ) {
    return this.adminService.updateCategoryCityVisibility(user, id, dto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Get('geo/search')
  searchGeo(@Query() query: GeoSearchQueryDto) {
    return this.adminService.searchGeoPlaces(query.q, query.country ?? 'kz');
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Get('cities')
  listCitiesAdmin() {
    return this.adminService.listCitiesAdmin();
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Post('cities')
  createCity(@CurrentUser() user: AuthUser, @Body() dto: CreateCityDto) {
    return this.adminService.createCity(user, dto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch('cities/:id')
  updateCity(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCityDto,
  ) {
    return this.adminService.updateCity(user, id, dto);
  }
}

