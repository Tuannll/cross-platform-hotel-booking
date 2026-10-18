import { ForbiddenException } from '@nestjs/common';

import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  it('rejects demo payment confirmation when demo payments are disabled', async () => {
    const service = new PaymentsService(
      {} as never,
      { getOrThrow: () => false } as never,
    ) as unknown as {
      confirmDemoPayment(bookingId: string, userId: string): Promise<unknown>;
    };

    await expect(service.confirmDemoPayment('1', '7')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('does not update an already confirmed booking', async () => {
    const updateMany = jest.fn();
    const service = new PaymentsService(
      {
        booking: {
          findUnique: jest.fn().mockResolvedValue({
            customerId: 7n,
            id: 1n,
            status: 'confirmed',
          }),
          updateMany,
        },
      } as never,
      { getOrThrow: () => true } as never,
    );

    await expect(service.confirmDemoPayment('1', '7')).resolves.toEqual({
      status: 'already_confirmed',
    });
    expect(updateMany).not.toHaveBeenCalled();
  });
});
