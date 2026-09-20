import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/types/jwt-payload.type';
import {
  CreateReviewDto,
  ListReviewsQueryDto,
  ReplyReviewDto,
  UpdateReviewDto,
} from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Public()
  @Get()
  findAll(@Query() query: ListReviewsQueryDto) {
    return this.reviewsService.findByBusiness(query);
  }

  @Get('me')
  findMine(@CurrentUser() user: AuthUser) {
    return this.reviewsService.findByUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reviewsService.softDelete(user, id);
  }

  /** Membership + REVIEWS_REPLY enforced in ReviewsService (not global UserRole). */
  @Patch(':id/reply')
  reply(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ReplyReviewDto,
  ) {
    return this.reviewsService.reply(user, id, dto);
  }
}
