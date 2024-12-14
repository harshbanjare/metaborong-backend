import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Req,
  Headers,
  BadRequestException,
  RawBodyRequest,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { PaymentsService } from './payments.service';
import { Request } from 'express';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-checkout-session/:courseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async createCheckoutSession(
    @Param('courseId') courseId: string,
    @Req() req: Request,
  ) {
    return this.paymentsService.createCheckoutSession(courseId, req.user['id']);
  }

  @Post('webhook')
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    try {
      return this.paymentsService.handleStripeWebhook(signature, req.rawBody);
    } catch (err) {
      throw new BadRequestException(
        `Webhook Error: ${err.message || 'Unknown error'}`,
      );
    }
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  async getPaymentHistory(@Req() req: Request) {
    return this.paymentsService.getPaymentHistory(req.user['id']);
  }
}
