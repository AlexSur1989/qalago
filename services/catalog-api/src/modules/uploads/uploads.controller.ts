import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { UploadsService } from './uploads.service';
import {
  AttachBusinessImageDto,
  ListBusinessImagesQueryDto,
} from './dto/business-images.dto';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Roles(UserRole.BUSINESS, UserRole.CITY_ADMIN, UserRole.ADMIN)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Query('businessId') businessId?: string,
  ) {
    return this.uploadsService.saveFileForUser(user, file, businessId);
  }

  @Post('business/:businessId')
  attach(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Body() dto: AttachBusinessImageDto,
  ) {
    return this.uploadsService.attachToBusiness(user, businessId, dto.imageUrl, {
      asCover: dto.asCover ?? false,
      locationId: dto.locationId,
    });
  }

  @Get('business/:businessId/images')
  listImages(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Query() query: ListBusinessImagesQueryDto,
  ) {
    return this.uploadsService.listBusinessImages(user, businessId, {
      scope: query.scope,
      locationId: query.locationId,
    });
  }

  @Delete('business/:businessId/images/:imageId')
  deleteImage(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.uploadsService.deleteBusinessImage(user, businessId, imageId);
  }

  @Patch('business/:businessId/images/:imageId/cover')
  setCover(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Param('imageId') imageId: string,
  ) {
    return this.uploadsService.setBusinessCover(user, businessId, imageId);
  }
}
