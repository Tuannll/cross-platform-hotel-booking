import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { BookingsService } from './bookings.service';

describe('BookingsService', () => {
  it('rejects booking when partner has not configured physical rooms', async () => {
    const tx = {
      room: {
        count: jest.fn().mockResolvedValue(0),
        createMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      roomType: {
        findFirst: jest.fn().mockResolvedValue({
          id: 2n,
          ratePlans: [{ id: 3n }],
        }),
      },
    };
    const prisma = {
      $transaction: (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
    };
    const service = new BookingsService(prisma as never);

    await expect(
      service.create(
        { id: '1' } as never,
        {
          checkInDate: new Date('2026-10-20'),
          checkOutDate: new Date('2026-10-21'),
          numAdults: 1,
          numChildren: 0,
          propertyId: 1,
          ratePlanId: 3,
          roomTypeId: 2,
          roomsNeeded: 1,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(tx.room.createMany).not.toHaveBeenCalled();
  });

  it('rejects booking when atomic promotion usage increment loses race', async () => {
    const price = new Prisma.Decimal(100_000);
    const tx = {
      dailyRate: {
        update: jest.fn(),
      },
      promotion: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      room: {
        findMany: jest.fn().mockResolvedValue([{ id: 4n }]),
      },
      roomType: {
        findFirst: jest.fn().mockResolvedValue({
          id: 2n,
          ratePlans: [{ id: 3n }],
        }),
      },
      booking: {
        count: jest.fn().mockResolvedValue(0),
      },
      voucher: {
        findFirst: jest.fn().mockResolvedValue({
          id: 8n,
          promotion: {
            discountType: 'fixed',
            discountValue: price,
            endDate: new Date('2026-12-31'),
            id: 9n,
            maxDiscount: null,
            maxUses: 1,
            minOrderAmount: new Prisma.Decimal(0),
            startDate: new Date('2026-01-01'),
            totalUsed: 0,
          },
        }),
      },
      $queryRaw: jest.fn().mockResolvedValue([
        {
          availableQty: 1,
          date: new Date('2026-10-20'),
          id: 10n,
          price,
          ratePlanId: 3n,
        },
      ]),
    };
    const prisma = {
      $transaction: (callback: (client: typeof tx) => Promise<unknown>) =>
        callback(tx),
    };
    const service = new BookingsService(prisma as never);

    await expect(
      service.create(
        { id: '1' } as never,
        {
          checkInDate: new Date('2026-10-20'),
          checkOutDate: new Date('2026-10-21'),
          numAdults: 1,
          numChildren: 0,
          propertyId: 1,
          ratePlanId: 3,
          roomTypeId: 2,
          roomsNeeded: 1,
          voucherId: 8,
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(tx.promotion.updateMany).toHaveBeenCalledWith({
      data: { totalUsed: { increment: 1 } },
      where: { id: 9n, totalUsed: { lt: 1 } },
    });
  });
});
