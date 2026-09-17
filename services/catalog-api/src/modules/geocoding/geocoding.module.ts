import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GEOCODING_PROVIDER } from './geocoding.types';
import { MockGeocodingProvider } from './mock-geocoding.provider';
import { MapTilerGeocodingProvider } from './maptiler-geocoding.provider';
import { GeocodingController } from './geocoding.controller';
import { GeocodingService } from './geocoding.service';
import { GeocodingRateLimitService } from './geocoding-rate-limit.service';

@Module({
  controllers: [GeocodingController],
  providers: [
    GeocodingService,
    GeocodingRateLimitService,
    MockGeocodingProvider,
    MapTilerGeocodingProvider,
    {
      provide: GEOCODING_PROVIDER,
      inject: [ConfigService, MockGeocodingProvider, MapTilerGeocodingProvider],
      useFactory: (
        config: ConfigService,
        mock: MockGeocodingProvider,
        maptiler: MapTilerGeocodingProvider,
      ) => {
        const provider = (config.get<string>('app.geocodingProvider') ?? 'mock').toLowerCase();
        return provider === 'maptiler' ? maptiler : mock;
      },
    },
  ],
  exports: [GeocodingService],
})
export class GeocodingModule {}
