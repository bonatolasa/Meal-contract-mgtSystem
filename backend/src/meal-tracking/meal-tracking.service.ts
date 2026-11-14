import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MealTracking, MealTrackingDocument } from './schemas/meal-tracking.schema';
import { CustomersService } from '../customers/customers.service';
import { ContractsService } from '../contracts/contracts.service';

@Injectable()
export class MealTrackingService {
  constructor(
    @InjectModel(MealTracking.name) private mealTrackingModel: Model<MealTrackingDocument>,
    private customersService: CustomersService,
    private contractsService: ContractsService,
  ) {}

  async recordMeal(data: any, recordedBy: string) {
    const customer = await this.customersService.findById(data.customer);
    if (!customer) throw new NotFoundException('Customer not found');

    const mealDate = new Date(data.date);
    if (Number.isNaN(mealDate.getTime())) throw new BadRequestException('Meal date is invalid');
    const contracts = await this.contractsService.findEligibleForDate(data.customer, mealDate) as any[];
    if (!contracts.length) throw new BadRequestException('Customer has no active contract for this date');
    if (contracts.length > 1) throw new BadRequestException('Customer has multiple active contracts for this date; ask the owner to resolve them');
    const contract = contracts[0];

    const packageInfo = contract.mealPackage;
    const mealKeys = ['breakfast', 'lunch', 'dinner'];
    const mealFields = { breakfast: 'includesBreakfast', lunch: 'includesLunch', dinner: 'includesDinner' };
    for (const meal of mealKeys) {
      if (data[meal] === true && !packageInfo?.[mealFields[meal]]) {
        throw new BadRequestException(`The customer's package does not include ${meal}`);
      }
    }

    const existing = await this.mealTrackingModel
      .findOne({ customer: data.customer, date: mealDate })
      .exec();

    if (existing) {
      if (existing.contract && existing.contract.toString() !== contract._id.toString()) {
        throw new BadRequestException('A different contract already has a meal record for this date');
      }
      existing.contract = contract._id;
      existing.breakfast = Boolean(existing.breakfast || data.breakfast);
      existing.lunch = Boolean(existing.lunch || data.lunch);
      existing.dinner = Boolean(existing.dinner || data.dinner);
      existing.attendanceStatus = data.attendanceStatus || existing.attendanceStatus;
      existing.notes = data.notes || existing.notes;
      existing.mealCharges = {};
      existing.totalCharge = 0;
      existing.recordedBy = recordedBy as any;
      await existing.save();
    } else {
      if (!mealKeys.some((meal) => data[meal] === true)) {
        throw new BadRequestException('Select at least one meal to record');
      }
      await new this.mealTrackingModel({
        ...data,
        date: mealDate,
        contract: contract._id,
        recordedBy,
        mealCharges: {},
        totalCharge: 0,
      }).save();
    }

    return this.mealTrackingModel.findOne({ customer: data.customer, date: mealDate }).populate('customer').exec();
  }

  async findAll() {
    return this.mealTrackingModel.find().populate('customer').exec();
  }

  async findByDate(date: Date) {
    return this.mealTrackingModel.find({ date }).populate('customer').exec();
  }

  async findByCustomer(customerId: string) {
    return this.mealTrackingModel.find({ customer: customerId }).exec();
  }

  async findByUser(userId: string) {
    const customer = await this.customersService.findByUserId(userId);
    if (!customer) return [];
    return this.findByCustomer(customer._id.toString());
  }

  async reverseMeal(id: string, reversedBy: string, note: string) {
    const meal = await this.mealTrackingModel.findById(id).exec();
    if (!meal) throw new NotFoundException('Meal record not found');
    if (meal.status !== 'served') throw new BadRequestException('Only served meals can be reversed');
    meal.status = 'reversed';
    meal.reversedBy = reversedBy as any;
    meal.reversalNote = note;
    return meal.save();
  }

  async getTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.getStatsBetween(today, tomorrow);
  }

  async getStatsBetween(start: Date, endExclusive: Date) {
    const meals = await this.mealTrackingModel.find({
      date: { $gte: start, $lt: endExclusive },
      status: { $ne: 'reversed' },
    }).exec();
    const totalCustomers = new Set(meals.map((meal) => meal.customer.toString())).size;
    const totalBreakfast = meals.filter((meal) => meal.breakfast).length;
    const totalLunch = meals.filter((meal) => meal.lunch).length;
    const totalDinner = meals.filter((meal) => meal.dinner).length;
    return { totalCustomers, totalBreakfast, totalLunch, totalDinner, totalMeals: totalBreakfast + totalLunch + totalDinner };
  }
}
