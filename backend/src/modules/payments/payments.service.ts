import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { $Enums } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

export type DemoPaymentResult = {
  status: 'confirmed' | 'already_confirmed';
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async confirmDemoPayment(
    bookingId: string,
    userId: string,
  ): Promise<DemoPaymentResult> {
    if (!this.configService.getOrThrow<boolean>('DEMO_PAYMENTS_ENABLED')) {
      throw new ForbiddenException('Demo payments are disabled');
    }

    const id = BigInt(bookingId);
    const booking = await this.prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      throw new NotFoundException('Booking not found.');
    }
    if (booking.customerId !== BigInt(userId)) {
      throw new ForbiddenException('Booking does not belong to you.');
    }
    if (booking.status === $Enums.booking_status_enum.confirmed) {
      return { status: 'already_confirmed' };
    }
    if (booking.status !== $Enums.booking_status_enum.pending) {
      throw new BadRequestException('Booking is not in pending status.');
    }

    const updated = await this.prisma.booking.updateMany({
      where: {
        id,
        customerId: BigInt(userId),
        status: $Enums.booking_status_enum.pending,
      },
      data: {
        status: $Enums.booking_status_enum.confirmed,
        paymentStatus: $Enums.payment_status_enum.paid,
      },
    });

    if (updated.count !== 1) {
      throw new BadRequestException('Booking is not in pending status.');
    }

    return { status: 'confirmed' };
  }
}