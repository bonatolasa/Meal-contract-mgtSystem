import { Controller, Get, Post, Body, Param, UseGuards, Request, Query, Put, Patch, Delete } from '@nestjs/common';
import { MealOperationsService } from './meal-operations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('meal-tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MealTrackingController {
  constructor(private mealOperations: MealOperationsService) {}

  @Get('menu-items')
  @Roles('owner')
  listMenuItems() {
    return this.mealOperations.listMenuItems(true);
  }

  @Post('menu-items')
  @Roles('owner')
  createMenuItem(@Body() body: any) {
    return this.mealOperations.createMenuItem(body);
  }

  @Patch('menu-items/:id')
  @Roles('owner')
  updateMenuItem(@Param('id') id: string, @Body() body: any) {
    return this.mealOperations.updateMenuItem(id, body);
  }

  @Post('daily-menu')
  @Roles('owner')
  publishMenu(@Body() body: any, @Request() req) {
    return this.mealOperations.publishDailyMenu(body, req.user.id);
  }

  @Delete('daily-menu/:id')
  @Roles('owner')
  removeMenuEntry(@Param('id') id: string) {
    return this.mealOperations.removeDailyMenuItem(id);
  }

  @Get('daily-menu')
  @Roles('owner', 'admin', 'employee', 'student')
  getDailyMenu(@Query('date') date: string) {
    return this.mealOperations.getDailyMenu(date);
  }

  @Get('settings')
  @Roles('owner')
  getMealSettings() {
    return this.mealOperations.getSettings();
  }

  @Put('settings')
  @Roles('owner')
  updateMealSettings(@Body() body: any) {
    return this.mealOperations.updateSettings(body);
  }

  @Get('me/selections')
  @Roles('student')
  getMySelection(@Query('date') date: string, @Request() req) {
    return this.mealOperations.getMySelection(req.user.id, date);
  }

  @Put('me/selections')
  @Roles('student')
  submitMySelection(@Body() body: any, @Request() req) {
    return this.mealOperations.submitMySelection(req.user.id, body);
  }

  @Get('me/selections/history')
  @Roles('student')
  getMySelectionHistory(@Request() req) {
    return this.mealOperations.getMySelectionHistory(req.user.id);
  }

  @Get('selections/date/:date')
  @Roles('owner', 'employee')
  getAttendance(@Param('date') date: string, @Query() filters: any) {
    return this.mealOperations.getAttendance(date, filters);
  }

  @Get('summary/:date')
  @Roles('owner', 'employee')
  getMealSummary(@Param('date') date: string) {
    return this.mealOperations.getMealSummary(date);
  }

  @Patch('selections/:id/override')
  @Roles('owner')
  overrideSelection(@Param('id') id: string, @Body() body: any, @Request() req) {
    return this.mealOperations.overrideSelection(id, req.user.id, body);
  }

  @Patch('selections/customer/:customerId/date/:date/override')
  @Roles('owner')
  overrideCustomerSelection(@Param('customerId') customerId: string, @Param('date') date: string, @Body() body: any, @Request() req) {
    return this.mealOperations.overrideCustomerSelection(customerId, date, req.user.id, body);
  }

  @Post('selections/:id/serve')
  @Roles('owner', 'employee')
  confirmServing(@Param('id') id: string, @Body() body: { mealType: string; status?: 'SERVED' | 'NO_SHOW'; note?: string }, @Request() req) {
    return this.mealOperations.recordServing(id, body.mealType, body.status || 'SERVED', req.user.id, body.note || '');
  }

  @Get('servings/date/:date')
  @Roles('owner', 'employee')
  getServings(@Param('date') date: string) {
    return this.mealOperations.getServings(date);
  }

  @Get('serving-summary/:date')
  @Roles('owner', 'employee')
  getServingSummary(@Param('date') date: string) {
    return this.mealOperations.getServingSummary(date);
  }

  @Get('stats/today')
  @Roles('owner', 'employee')
  getTodayStats() {
    return this.mealOperations.getTodayServingSummary();
  }

}
