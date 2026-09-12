import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import { AccountDeletionService } from './account-deletion.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { UserAvatarService } from './user-avatar.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userAvatar: UserAvatarService,
    private readonly accountDeletion: AccountDeletionService,
  ) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(user.id, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadAvatar(@CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    return this.userAvatar.uploadAvatar(user.id, file);
  }

  @Delete('me/avatar')
  deleteAvatar(@CurrentUser() user: AuthUser) {
    return this.userAvatar.deleteAvatar(user.id);
  }

  @Delete('me')
  deleteMe(@CurrentUser() user: AuthUser) {
    return this.accountDeletion.deleteOwnAccount(user.id);
  }
}
