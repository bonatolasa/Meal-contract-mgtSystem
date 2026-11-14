import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';
import { MealTrackingService } from '../meal-tracking/meal-tracking.service';
import { ContractsService } from '../contracts/contracts.service';
import { PaymentsService } from '../payments/payments.service';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    private mealTrackingService: MealTrackingService,
    private contractsService: ContractsService,
    private paymentsService: PaymentsService,
    private customersService: CustomersService,
  ) {}

  async generateDailyReport(date: Date, generatedBy: string) {
    const todayStats = await this.mealTrackingService.getTodayStats();
    const activeContracts = await this.contractsService.getActiveContracts();
    const outstanding = await this.paymentsService.getOutstandingBalances();

    const reportData = {
      date,
      totalCustomersServed: todayStats.totalCustomers,
      totalMealsServed: todayStats.totalMeals,
      breakfastCount: todayStats.totalBreakfast,
      lunchCount: todayStats.totalLunch,
      dinnerCount: todayStats.totalDinner,
      activeContractsCount: activeContracts.length,
      outstandingPayments: outstanding.reduce((sum: number, c: any) => sum + c.remainingBalance, 0),
    };

    const report = new this.reportModel({
      title: `Daily Report - ${date.toDateString()}`,
      type: 'daily',
      generatedAt: new Date(),
      data: reportData,
      generatedBy,
    });
    return report.save();
  }

  async generateWeeklyReport(startDate: Date, endDate: Date, generatedBy: string) {
    const reportData = {
      startDate,
      endDate,
      message: 'Weekly report data aggregated from daily meal tracking and payments',
    };

    const report = new this.reportModel({
      title: `Weekly Report - ${startDate.toDateString()} to ${endDate.toDateString()}`,
      type: 'weekly',
      generatedAt: new Date(),
      data: reportData,
      generatedBy,
    });
    return report.save();
  }

  async generateMonthlyReport(month: number, year: number, generatedBy: string) {
    const reportData = {
      month,
      year,
      message: 'Monthly report aggregated from all contracts, payments, and meal tracking',
    };

    const report = new this.reportModel({
      title: `Monthly Report - ${month}/${year}`,
      type: 'monthly',
      generatedAt: new Date(),
      data: reportData,
      generatedBy,
    });
    return report.save();
  }

  async findAll() {
    return this.reportModel.find().sort({ generatedAt: -1 }).exec();
  }
}