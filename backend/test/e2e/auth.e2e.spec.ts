import { PrismaClient } from '@prisma/client';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createE2eApp } from './app';
import { getTestDatabaseUrl, truncateTestDatabase } from './database';
import { createBookingFixture } from './fixtures';

describe('auth E2E', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: getTestDatabaseUrl() } } });
    await prisma.$connect();
    app = await createE2eApp();
  }, 30_000);

  beforeEach(async () => {
    await truncateTestDatabase(prisma);
  });

  afterAll(async () => {
    await app?.close();
    await prisma.$disconnect();
  });

  it('revokes refreshed access token after logout', async () => {
    const fixture = await createBookingFixture(prisma);
    const server = app.getHttpServer();
    const login = await request(server)
      .post('/api/auth/login')
      .send({ email: fixture.customer.email, password: fixture.customer.password });

    expect(login.status).toBe(201);
    const refresh = await request(server)
      .post('/api/auth/refresh')
      .send({ refreshToken: login.body.refreshToken });

    expect(refresh.status).toBe(201);
    await request(server)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${refresh.body.accessToken}`)
      .expect(200);
    await request(server)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${refresh.body.accessToken}`)
      .expect(401);
  });
});
