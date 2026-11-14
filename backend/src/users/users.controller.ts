import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CustomersService } from '../customers/customers.service';
import { ConflictException, BadRequestException } from '@nestjs/common';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(private usersService: UsersService, private customersService: CustomersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  async create(@Body() body: { email: string; password: string; role: string; name: string; phone?: string; address?: string }) {
    if (['student', 'employee'].includes(body.role) && (!body.phone || !body.address)) {
      throw new BadRequestException('Phone and address are required for student and employee profiles');
    }
    body.email = body.email.trim().toLowerCase();
    if (await this.usersService.findByEmail(body.email)) throw new ConflictException('Email already registered');
    const user = await this.usersService.create(body.email, body.password, body.role, body.name);
    if (['student', 'employee'].includes(body.role)) {
      try {
        await this.customersService.create({
          user: user._id,
          customerId: `CUS-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          name: body.name,
          email: body.email,
          phone: body.phone,
          address: body.address,
          type: body.role,
        });
      } catch (error) {
        await this.usersService.delete(user._id.toString());
        throw error;
      }
    }
    return user;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}
