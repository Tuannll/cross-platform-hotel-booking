import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';
import { getTestDatabaseUrl } from './database';

export async function createE2eApp(): Promise<INestApplication> {
  process.env.DATABASE_URL = getTestDatabaseUrl();
  process.env.JWT_ACCESS_SECRET = 'e2e-access-secret-must-be-at-least-32-chars';
  process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret-must-be-at-least-32-chars';
  process.env.JWT_ACCESS_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.PORT = '0';
  process.env.DEMO_PAYMENTS_ENABLED = 'true';
  process.env.CORS_ORIGINS = 'http://localhost:5173';

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AppModule } = require('../../src/app.module') as typeof import('../../src/app.module');
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}
