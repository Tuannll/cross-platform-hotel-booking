import { UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('rejects a reset OTP after five failed attempts', async () => {
    const prisma = {
      otpToken: {
        findFirst: jest.fn().mockResolvedValue({
          attempts: 5,
          expiresAt: new Date(Date.now() + 60_000),
          id: 1n,
          tokenHash: 'unused',
          userId: 7n,
        }),
        update: jest.fn(),
      },
    };
    const service = new AuthService(
      prisma as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.resetPassword('student@example.com', '123456', 'new-password'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.otpToken.update).not.toHaveBeenCalled();
  });
});
