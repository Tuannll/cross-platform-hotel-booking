import type { INestApplication } from '@nestjs/common';
import {
  discount_type_enum,
  PrismaClient,
  promo_type_enum,
} from '@prisma/client';
import request from 'supertest';

import { createE2eApp } from './app';
import { getTestDatabaseUrl, truncateTestDatabase } from './database';
import { createBookingFixture, type BookingFixture } from './fixtures';

describe('voucher E2E', () => {
  let app: INestApplication;
  let fixture: BookingFixture;
  let prisma: PrismaClient;
  let token: string;
  let voucherId: string;
  let promotionId: bigint;

  beforeAll(async () => {
    prisma = new PrismaClient({ datasources: { db: { url: getTestDatabaseUrl() } } });
    await prisma.$connect();
    app = await createE2eApp();
  }, 30_000);

  beforeEach(async () => {
    await truncateTestDatabase(prisma);
    fixture = await createBookingFixture(prisma, 2);
    const partner = await prisma.partnerProfile.findFirstOrThrow();
    const promotion = await prisma.promotion.create({
      data: {
        createdBy: partner.userId,
        discountType: discount_type_enum.fixed,
        discountValue: 10000,
        endDate: new Date('2026-12-31T00:00:00.000Z'),
        maxUses: 1,
        minOrderAmount: 0,
        name: 'E2E One Use',
        promoType: promo_type_enum.custom,
        startDate: new Date('2026-01-01T00:00:00.000Z'),
      },
    });
    promotionId = promotion.id;
    const voucher = await prisma.voucher.create({
      data: {
        code: 'E2E-ONE-USE',
        maxUsesPerUser: 2,
        promotionId: promotion.id,
      },
    });
    voucherId = voucher.id.toString();

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
        voucherId,
      });
  }

  it('allows one concurrent booking to consume a capped promotion', async () => {
    const [first, second] = await Promise.all([createBooking(), createBooking()]);

    expect([first.status, second.status].sort()).toEqual([201, 400]);
    const promotion = await prisma.promotion.findUniqueOrThrow({
      where: { id: promotionId },
      select: { totalUsed: true },
    });
    expect(promotion.totalUsed).toBe(1);
  });
});
