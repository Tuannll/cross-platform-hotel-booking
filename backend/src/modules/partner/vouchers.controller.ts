import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/strategies/jwt.strategy';
import { PartnerService } from './partner.service';
import { discount_type_enum } from '@prisma/client';

import { BadRequestException } from '@nestjs/common';

class CreateVoucherDto {
  code!: string;
  discountType!: discount_type_enum;
  discountValue!: number;
  minOrderAmount!: number;
  maxDiscount?: number;
  startDate!: string;
  endDate!: string;
  maxUses?: number;
  maxUsesPerUser?: number;
  name?: string;
}

@ApiTags('Partner Vouchers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARTNER)
@Controller('partner/vouchers')
export class PartnerVouchersController {
  constructor(private readonly partnerService: PartnerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a voucher for the partner properties' })
  createVoucher(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateVoucherDto,
  ) {
    return this.partnerService.createVoucher(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all vouchers of the partner' })
  getVouchers(@CurrentUser() user: AuthenticatedUser) {
    return this.partnerService.getVouchers(user);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete/deactivate a voucher' })
  deleteVoucher(
    @CurrentUser() user: AuthenticatedUser,
    @Query('code') queryCode?: string,
    @Body('code') bodyCode?: string,
  ) {
    const code = queryCode || bodyCode;
    if (!code) {
      throw new BadRequestException('Voucher code is required');
    }
    return this.partnerService.deleteVoucher(user, code);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Delete/deactivate a voucher by code' })
  deleteVoucherParam(
    @CurrentUser() user: AuthenticatedUser,
    @Param('code') code: string,
  ) {
    return this.partnerService.deleteVoucher(user, code);
  }
}