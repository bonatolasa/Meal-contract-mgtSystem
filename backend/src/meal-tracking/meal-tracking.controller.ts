import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { MealTrackingService } from './meal-tracking.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('meal-tracking')
@UseGuards(JwtAuthGuard)
export class MealTrackingController {
  constructor(private mealTrackingService: MealTrackingService) {}

  @Post()
  recordMeal(@Body() data: any) {
    return this.mealTrackingService.recordMeal(data);
  }

  @Get()
  findAll() {
    return this.mealTrackingService.findAll();
  }

  @Get('date/:date')
  findByDate(@Param('date') date: string) {
    return this.mealTrackingService.findByDate(new Date(date));
  }

  @Get('customer/:customerId')
  findByCustomer(@Param('customerId') customerId: string) {
    return this.mealTrackingService.findByCustomer(customerId);
  }

  @Get('stats/today')
  getTodayStats() {
    return this.mealTrackingService.getTodayStats();
  }
}