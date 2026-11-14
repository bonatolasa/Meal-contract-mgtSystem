import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post('daily')
  generateDaily(@Body() body: { date: string; generatedBy: string }) {
    return this.reportsService.generateDailyReport(new Date(body.date), body.generatedBy);
  }

  @Post('weekly')
  generateWeekly(@Body() body: { startDate: string; endDate: string; generatedBy: string }) {
    return this.reportsService.generateWeeklyReport(new Date(body.startDate), new Date(body.endDate), body.generatedBy);
  }

  @Post('monthly')
  generateMonthly(@Body() body: { month: number; year: number; generatedBy: string }) {
    return this.reportsService.generateMonthlyReport(body.month, body.year, body.generatedBy);
  }

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }
}