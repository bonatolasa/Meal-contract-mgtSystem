import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MealTracking, MealTrackingDocument } from './schemas/meal-tracking.schema';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class MealTrackingService {
  constructor(
    @InjectModel(MealTracking.name) private mealTrackingModel: Model<MealTrackingDocument>,
    private customersService: CustomersService,
  ) {}

  async recordMeal(data: any) {
    const customer = await this.customersService.findById(data.customer);
    if (!customer) throw new NotFoundException('Customer not found');

    const existing = await this.mealTrackingModel
      .findOne({ customer: data.customer, date: data.date })
      .exec();

    if (existing) {
      existing.breakfast = data.breakfast ?? existing.breakfast;
      existing.lunch = data.lunch ?? existing.lunch;
      existing.dinner = data.dinner ?? existing.dinner;
      existing.attendanceStatus = data.attendanceStatus || existing.attendanceStatus;
      existing.notes = data.notes || existing.notes;
      return existing.save();
    }

    const mealTracking = new this.mealTrackingModel(data);
    return mealTracking.save();
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

  async getTodayStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const meals = await this.mealTrackingModel
      .find({ date: { $gte: today, $lt: tomorrow } })
      .populate('customer')
      .exec();

    const totalCustomers = meals.length;
    const totalBreakfast = meals.filter((m: any) => m.breakfast).length;
    const totalLunch = meals.filter((m: any) => m.lunch).length;
    const totalDinner = meals.filter((m: any) => m.dinner).length;

    return { totalCustomers, totalBreakfast, totalLunch, totalDinner, totalMeals: totalBreakfast + totalLunch + totalDinner };
  }
}