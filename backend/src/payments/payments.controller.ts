import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get('me')
  @Roles('student', 'employee')
  findMine(@Request() req) {
    return this.paymentsService.findByUser(req.user.id);
  }

  @Post()
  createPayment(@Body() data: any, @Request() req) {
    return this.paymentsService.createPayment(data, req.user.id);
  }

  @Post(':id/reverse')
  reverse(@Param('id') id: string, @Body() body: { note: string }, @Request() req) {
    return this.paymentsService.reversePayment(id, req.user.id, body.note);
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
