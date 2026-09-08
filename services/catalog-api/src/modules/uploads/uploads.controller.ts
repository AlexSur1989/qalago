import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { IsBoolean, IsOptional, IsString } from 'class-validator';

class AttachImageDto {
  @IsString()
  imageUrl!: string;

  @IsOptional()
  @IsBoolean()
  asCover?: boolean;
}

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
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.saveFile(file);
  }

  @Post('business/:businessId')
  attach(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
    @Body() dto: AttachImageDto,
  ) {
    return this.uploadsService.attachToBusiness(
      user,
      businessId,
      dto.imageUrl,
      dto.asCover ?? false,
    );
  }

  @Get('business/:businessId/images')
  listImages(
    @CurrentUser() user: AuthUser,
    @Param('businessId') businessId: string,
  ) {
    return this.uploadsService.listBusinessImages(user, businessId);
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
