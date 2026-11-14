import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('owner')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post('daily')
  generateDaily(@Body() body: { date: string }, @Request() req) {
    return this.reportsService.generateDailyReport(new Date(body.date), req.user.name);
  }

  @Post('weekly')
  generateWeekly(@Body() body: { startDate: string; endDate: string }, @Request() req) {
    return this.reportsService.generateWeeklyReport(new Date(body.startDate), new Date(body.endDate), req.user.name);
  }

  @Post('monthly')
  generateMonthly(@Body() body: { month: number; year: number }, @Request() req) {
    return this.reportsService.generateMonthlyReport(body.month, body.year, req.user.name);
  }

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }
}
