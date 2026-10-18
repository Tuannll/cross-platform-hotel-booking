import { UnauthorizedException } from '@nestjs/common';

import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('rejects an access token for a revoked session', async () => {
    const strategy = new JwtStrategy(
      { getOrThrow: () => 'access-secret' } as never,
      { userSession: { findFirst: jest.fn().mockResolvedValue(null) } } as never,
    );

    await expect(
      strategy.validate({
        email: 'student@example.com',
        sessionId: '9',
        sub: '7',
        userType: 'customer',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an access token without a valid session ID', async () => {
    const strategy = new JwtStrategy(
      { getOrThrow: () => 'access-secret' } as never,
      { userSession: { findFirst: jest.fn() } } as never,
    );

    await expect(
      strategy.validate({
        email: 'student@example.com',
        sessionId: 'not-a-number',
        sub: '7',
        userType: 'customer',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
