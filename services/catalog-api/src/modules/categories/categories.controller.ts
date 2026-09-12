import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { StaffPermission } from '@qalago/shared-types';
import {
  AdminStaffRoute,
  RequireStaffPermission,
  RequireStaffStepUp,
} from '../../common/decorators/require-staff-permission.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { CategoriesService } from './categories.service';
import { SubcategoriesService } from './subcategories.service';
import { CreateCategoryDto, ListCategoriesQueryDto, UpdateCategoryDto } from './dto/category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly subcategoriesService: SubcategoriesService,
  ) {}

  @Public()
  @Get()
  findAll(@Query() query: ListCategoriesQueryDto) {
    return this.categoriesService.findAll({ citySlug: query.citySlug });
  }

  @Public()
  @Get(':categoryId/subcategories')
  listSubcategories(@Param('categoryId') categoryId: string) {
    return this.subcategoriesService.listPublicByCategory(categoryId);
  }

  @AdminStaffRoute()
  @RequireStaffPermission(StaffPermission.CATEGORY_EDIT)
  @RequireStaffStepUp()
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(user, dto);
  }

  @AdminStaffRoute()
  @RequireStaffPermission(StaffPermission.CATEGORY_EDIT)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(user, id, dto);
  }

  @AdminStaffRoute()
  @RequireStaffPermission(StaffPermission.CATEGORY_EDIT)
  @RequireStaffStepUp()
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.categoriesService.remove(user, id);
  }
}
