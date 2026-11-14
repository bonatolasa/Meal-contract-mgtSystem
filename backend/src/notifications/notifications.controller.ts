import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get('me')
  @Roles('student', 'employee')
  findMine(@Request() req) {
    return this.notificationsService.findByUser(req.user.id);
  }

  @Post()
  create(@Body() data: any) {
    return this.notificationsService.create(data);
  }

  @Get()
  findAll() {
    return this.notificationsService.findAll();
  }

  @Get('customer/:customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.notificationsService.findByCustomer(customerId);
  }

  @Get('unread')
  findUnread() {
    return this.notificationsService.findUnread();
  }

  @Put(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Put('me/:id/read')
  @Roles('student', 'employee')
  markMineAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsReadForUser(id, req.user.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.notificationsService.delete(id);
  }
}
