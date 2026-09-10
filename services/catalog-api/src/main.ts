import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { isProductionNodeEnv } from './common/utils/production-config.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  const nodeEnv = config.get<string>('NODE_ENV', 'development');
  const origins = config
    .get<string>('app.corsOrigins', '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Native mobile apps and server-to-server calls omit Origin.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (!isProductionNodeEnv(nodeEnv)) {
        const isLocalDev =
          /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin) ||
          /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/i.test(origin) ||
          /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/i.test(origin);
        callback(null, isLocalDev);
        return;
      }

      callback(null, origins.includes(origin));
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = config.get<number>('app.port', 3002);
  await app.listen(port, '0.0.0.0');
  console.log(`QalaGo catalog-api: http://0.0.0.0:${port}/api/v1`);
}

bootstrap();
