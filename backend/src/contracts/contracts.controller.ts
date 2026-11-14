import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner')
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Get('packages')
  @Roles('owner', 'admin', 'employee', 'student')
  getMealPackages(@Request() req) {
    return this.contractsService.getMealPackages(['owner', 'admin'].includes(req.user.role));
  }

  @Post('packages')
  @Roles('owner')
  createMealPackage(@Body() data: any) {
    return this.contractsService.createMealPackage(data);
  }

  @Put('packages/:id')
  @Roles('owner')
  updateMealPackage(@Param('id') id: string, @Body() data: any) {
    return this.contractsService.updateMealPackage(id, data);
  }

  @Get('me')
  @Roles('student', 'employee')
  findMine(@Request() req) {
    return this.contractsService.findByUser(req.user.id);
  }

  @Get()
  @Roles('owner')
  findAll() {
    return this.contractsService.findAll();
  }

  @Post()
  @Roles('owner')
  create(@Body() data: any) {
    return this.contractsService.create(data);
  }

  @Get(':id')
  @Roles('owner')
  findOne(@Param('id') id: string) {
    return this.contractsService.findById(id);
  }

  @Get('customer/:customerId')
  @Roles('owner')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.contractsService.findByCustomer(customerId);
  }

  @Put(':id')
  @Roles('owner')
  update(@Param('id') id: string, @Body() data: any) {
    return this.contractsService.update(id, data);
  }

  @Delete(':id')
  @Roles('owner')
  delete(@Param('id') id: string) {
    return this.contractsService.delete(id);
  }

  @Put(':id/status')
  @Roles('owner')
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.contractsService.updateStatus(id, body.status);
  }

  @Get('status/active')
  @Roles('owner', 'employee')
  getActive() {
    return this.contractsService.getActiveContracts();
  }

  @Get('status/expired')
  @Roles('owner')
  getExpired() {
    return this.contractsService.getExpiredContracts();
  }
}
