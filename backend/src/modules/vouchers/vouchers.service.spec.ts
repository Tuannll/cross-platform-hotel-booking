import { BadRequestException } from '@nestjs/common';

import { VouchersService } from './vouchers.service';

describe('VouchersService', () => {
  it('rejects a voucher after its promotion usage limit is reached', async () => {
    const service = new VouchersService({
      voucher: {
        findUnique: jest.fn().mockResolvedValue({
          code: 'EXPIRED',
          id: 1n,
          isActive: true,
          promotion: {
            endDate: new Date(Date.now() + 60_000),
            maxUses: 1,
            startDate: new Date(Date.now() - 60_000),
            totalUsed: 1,
          },
        }),
      },
    } as never);

    await expect(service.applyVoucher('EXPIRED', '1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
