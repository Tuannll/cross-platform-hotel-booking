import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';

import { createE2eApp } from './app';
import { getTestDatabaseUrl, truncateTestDatabase } from './database';
import { createBookingFixture, type BookingFixture } from './fixtures';

describe('bookings E2E', () => {
  let app: INestApplication;
  let fixture: BookingFixture;
  let prisma: PrismaClient;
  let token: string;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: getTestDatabaseUrl() } } });
    await prisma.$connect();
    app = await createE2eApp();
  }, 30_000);

  beforeEach(async () => {
    await truncateTestDatabase(prisma);
    fixture = await createBookingFixture(prisma);
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: fixture.customer.email, password: fixture.customer.password });
    token = login.body.accessToken;
  });

  afterAll(async () => {
    await app?.close();
    await prisma.$disconnect();
  });

  function createBooking() {
    return request(app.getHttpServer())
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        checkInDate: fixture.checkInDate,
        checkOutDate: fixture.checkOutDate,
        numAdults: 1,
        numChildren: 0,
        propertyId: fixture.propertyId,
        ratePlanId: fixture.ratePlanId,
        roomTypeId: fixture.roomTypeId,
        roomsNeeded: 1,
      });
  }

  async function availability(): Promise<number[]> {
    const rows = await prisma.dailyRate.findMany({
      where: { ratePlanId: BigInt(fixture.ratePlanId) },
      orderBy: { date: 'asc' },
      select: { availableQty: true },
    });
    return rows.map((row) => row.availableQty);
  }

  it('decrements daily inventory and restores it once on cancellation', async () => {
    const booking = await createBooking().expect(201);

    expect(await availability()).toEqual([0, 0]);
    await request(app.getHttpServer())
      .post(`/api/bookings/${booking.body.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(await availability()).toEqual([1, 1]);
    await request(app.getHttpServer())
      .post(`/api/bookings/${booking.body.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
    expect(await availability()).toEqual([1, 1]);
  });

  it('allows only one concurrent booking when one room remains', async () => {
    const [first, second] = await Promise.all([createBooking(), createBooking()]);

    expect([first.status, second.status].sort()).toEqual([201, 400]);
    expect(await availability()).toEqual([0, 0]);
  });
});
