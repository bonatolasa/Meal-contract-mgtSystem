import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';
import { MealOperationsService } from '../meal-tracking/meal-operations.service';
import { ContractsService } from '../contracts/contracts.service';
import { PaymentsService } from '../payments/payments.service';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<ReportDocument>,
    private mealOperationsService: MealOperationsService,
    private contractsService: ContractsService,
    private paymentsService: PaymentsService,
    private customersService: CustomersService,
  ) {}

  async generateDailyReport(date: Date, generatedBy: string) {
    const start = new Date(date);
    if (Number.isNaN(start.getTime())) throw new BadRequestException('Report date is invalid');
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return this.createSummary('daily', `Daily Report - ${start.toDateString()}`, start, end, generatedBy);
  }

  async generateWeeklyReport(startDate: Date, endDate: Date, generatedBy: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) throw new BadRequestException('Report date range is invalid');
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() + 1);
    return this.createSummary('weekly', `Weekly Report - ${start.toDateString()} to ${new Date(end.getTime() - 1).toDateString()}`, start, end, generatedBy);
  }

  async generateMonthlyReport(month: number, year: number, generatedBy: string) {
    if (month < 1 || month > 12 || !Number.isInteger(year)) throw new BadRequestException('Month or year is invalid');
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    return this.createSummary('monthly', `Monthly Report - ${month}/${year}`, start, end, generatedBy);
  }

  private async createSummary(type: string, title: string, start: Date, end: Date, generatedBy: string) {
    const [meals, collected, outstanding, contracts] = await Promise.all([
      this.mealOperationsService.getMealActivityBetween(start, end),
      this.paymentsService.getCollectedBetween(start, end),
      this.paymentsService.getOutstandingBalances(),
      this.contractsService.getContractCountsAsOf(new Date(end.getTime() - 1)),
    ]);
    return new this.reportModel({
      title,
      type,
      generatedAt: new Date(),
      generatedBy,
      data: {
        periodStart: start,
        periodEnd: new Date(end.getTime() - 1),
        expectedMeals: meals.totalExpected,
        totalMealsServed: meals.totalServed,
        breakfastExpected: meals.expected.breakfast,
        lunchExpected: meals.expected.lunch,
        dinnerExpected: meals.expected.dinner,
        breakfastServed: meals.actual.breakfast.served,
        lunchServed: meals.actual.lunch.served,
        dinnerServed: meals.actual.dinner.served,
        breakfastNoShow: meals.actual.breakfast.noShow,
        lunchNoShow: meals.actual.lunch.noShow,
        dinnerNoShow: meals.actual.dinner.noShow,
        paymentsCollected: collected,
        outstandingBalance: outstanding.reduce((sum: number, contract: any) => sum + Number(contract.remainingBalance || 0), 0),
        activeContracts: contracts.active,
        expiredContracts: contracts.expired,
      },
    }).save();
  }

  async findAll() {
    return this.reportModel.find().sort({ generatedAt: -1 }).exec();
  }
}
