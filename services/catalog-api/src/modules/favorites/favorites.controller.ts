import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { FavoritesService } from './favorites.service';

class AddFavoriteDto {
  @IsString()
  businessId!: string;
}

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.favoritesService.findAll(user.id);
  }

  @Get('check/:businessId')
  check(@CurrentUser() user: AuthUser, @Param('businessId') businessId: string) {
    return this.favoritesService.check(user.id, businessId);
  }

  @Post()
  add(@CurrentUser() user: AuthUser, @Body() dto: AddFavoriteDto) {
    return this.favoritesService.add(user.id, dto.businessId);
  }

  @Delete(':businessId')
  remove(@CurrentUser() user: AuthUser, @Param('businessId') businessId: string) {
    return this.favoritesService.remove(user.id, businessId);
  }
}
