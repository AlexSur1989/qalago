import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReviewsController } from './reviews.controller';
import { ReviewRateLimitService } from './review-rate-limit.service';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewRateLimitService],
})
export class ReviewsModule {}
