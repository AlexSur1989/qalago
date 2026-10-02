import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { PublicHomeSectionsQueryDto } from './dto/home-section.dto';
import { HomeSectionConfigService } from './home-section-config.service';

@Controller('home')
export class HomeSectionPublicController {
  constructor(private readonly homeSections: HomeSectionConfigService) {}

  @Public()
  @Get('sections')
  listSections(@Query() query: PublicHomeSectionsQueryDto) {
    return this.homeSections.resolvePublicSections(query.citySlug, query.platform);
  }
}
