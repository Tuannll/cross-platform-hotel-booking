import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PaymentsService, type DemoPaymentResult } from './payments.service';

interface AuthenticatedRequest {
  user: AuthenticatedUser;
}

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('demo-confirm')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Confirm a demo payment; unavailable unless DEMO_PAYMENTS_ENABLED=true',
  })
  @ApiResponse({ status: 201, description: 'Demo payment confirmed.' })
  @ApiResponse({ status: 403, description: 'Demo payments are disabled.' })
  confirmDemoPayment(
    @Body('bookingId') bookingId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<DemoPaymentResult> {
    return this.paymentsService.confirmDemoPayment(bookingId, req.user.id);
  }
}
