import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get('me')
  @Roles('student', 'employee')
  async findMine(@Request() req) {
    return this.customersService.findByUserId(req.user.id);
  }

  @Get()
  @Roles('owner', 'employee')
  findAll() {
    return this.customersService.findAll();
  }

  @Post()
  @Roles('owner')
  create(@Body() data: any) {
    return this.customersService.create(data);
  }

  @Get(':id')
  @Roles('owner', 'employee')
  findOne(@Param('id') id: string) {
    return this.customersService.findById(id);
  }

  @Put(':id')
  @Roles('owner')
  update(@Param('id') id: string, @Body() data: any) {
    return this.customersService.update(id, data);
  }

  @Delete(':id')
  @Roles('owner')
  delete(@Param('id') id: string) {
    return this.customersService.delete(id);
  }
}
