import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Get()
  findAll() {
    return this.contractsService.findAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.contractsService.create(data);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractsService.findById(id);
  }

  @Get('customer/:customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.contractsService.findByCustomer(customerId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.contractsService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.contractsService.delete(id);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.contractsService.updateStatus(id, body.status);
  }

  @Get('status/active')
  getActive() {
    return this.contractsService.getActiveContracts();
  }

  @Get('status/expired')
  getExpired() {
    return this.contractsService.getExpiredContracts();
  }
}