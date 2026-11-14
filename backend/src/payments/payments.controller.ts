import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  createPayment(@Body() data: any) {
    return this.paymentsService.createPayment(data);
  }

  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get('contract/:contractId')
  findByContract(@Param('contractId') contractId: string) {
    return this.paymentsService.findByContract(contractId);
  }

  @Get('customer/:customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.paymentsService.findByCustomer(customerId);
  }

  @Get('outstanding')
  getOutstanding() {
    return this.paymentsService.getOutstandingBalances();
  }
}