import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { user_type_enum } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';

import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload } from '../auth.service';

export interface AuthenticatedUser {
  id: string;
  email: string;
  sessionId: string;
  userType: user_type_enum;
  isSuperAdmin?: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: Request) => JwtStrategy.fromCookie(request),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  private static fromCookie(request: Request): string | null {
    const cookieHeader = request.headers.cookie;
    if (!cookieHeader) return null;

    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((cookie) => {
        const [name, ...value] = cookie.trim().split('=');
        return [name, decodeURIComponent(value.join('='))];
      }),
    );

    const path = (request.path ?? request.originalUrl ?? '').replace(/^\/api(?=\/)/, '');
    const preferredCookieNames = path.startsWith('/partner/')
      ? ['session_partner', 'session']
      : path.startsWith('/admin/')
        ? ['session_admin', 'session']
        : path.startsWith('/bookings')
          ? ['session_customer', 'session']
          : [
            'session',
            'session_customer',
            'session_partner',
            'session_admin',
          ];

    for (const name of preferredCookieNames) {
      if (cookies[name]) {
        const val = cookies[name];
        if (val.startsWith('Bearer ')) {
          return val.substring(7);
        }
        return val;
      }
    }

    return null;
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    let sessionId: bigint;
    let userId: bigint;
    try {
      sessionId = BigInt(payload.sessionId);
      userId = BigInt(payload.sub);
    } catch {
      throw new UnauthorizedException('Invalid session');
    }

    const session = await this.prisma.userSession.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!session) {
      throw new UnauthorizedException('Session is no longer active');
    }

    return {
      id: payload.sub,
      email: payload.email,
      sessionId: payload.sessionId,
      userType: payload.userType,
      isSuperAdmin: payload.isSuperAdmin,
    };
  }
}
