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
  UpdateUserRoleDto,
} from './dto/admin.dto';
import { CreateCityDto, UpdateCityDto } from '../cities/dto/city.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@Roles(UserRole.ADMIN, UserRole.CITY_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
  @Get('users')
  listUsers() {
    return this.adminService.listUsers();
  }

  @Roles(UserRole.ADMIN)
  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminService.updateUserRole(id, dto);
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

  @Roles(UserRole.ADMIN)
  @Get('geo/search')
  searchGeo(@Query() query: GeoSearchQueryDto) {
    return this.adminService.searchGeoPlaces(query.q, query.country ?? 'kz');
  }

  @Roles(UserRole.ADMIN)
  @Get('cities')
  listCitiesAdmin() {
    return this.adminService.listCitiesAdmin();
  }

  @Roles(UserRole.ADMIN)
  @Post('cities')
  createCity(@Body() dto: CreateCityDto) {
    return this.adminService.createCity(dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch('cities/:id')
  updateCity(@Param('id') id: string, @Body() dto: UpdateCityDto) {
    return this.adminService.updateCity(id, dto);
  }
}

