import { Controller, Get, Param, Patch, Post, Body, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { BusinessesService } from './businesses.service';
import { BusinessPublicContentService } from './business-public-content.service';
import { CreateBusinessDto, ListBusinessesQueryDto, UpdateBusinessDto } from './dto/business.dto';
import { ListBusinessCatalogQueryDto } from './dto/business-catalog.dto';
import { ListBusinessPhotosQueryDto } from './dto/business-photos.dto';

@Controller('businesses')
export class BusinessesController {
  constructor(
    private readonly businessesService: BusinessesService,
    private readonly publicContent: BusinessPublicContentService,
  ) {}

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
