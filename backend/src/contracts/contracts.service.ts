import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contract, ContractDocument } from './schemas/contract.schema';
import { MealPackage, MealPackageDocument } from './schemas/meal-package.schema';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
    @InjectModel(MealPackage.name) private mealPackageModel: Model<MealPackageDocument>,
    private customersService: CustomersService,
  ) {}

  async create(data: any) {
    const customer = await this.customersService.findById(data.customer);
    if (!customer) throw new NotFoundException('Customer not found');

    const mealPackage = await this.mealPackageModel.findById(data.mealPackage).exec();
    if (!mealPackage || !mealPackage.isActive) throw new NotFoundException('Active meal package not found');

    const billingType = 'fixed_monthly';
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
      throw new BadRequestException('Contract dates are invalid');
    }

    const monthlyPrice = mealPackage.pricePerMonth;
    const monthDifference = (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 + endDate.getUTCMonth() - startDate.getUTCMonth();
    const billableMonths = Math.max(1, monthDifference + (endDate.getUTCDate() >= startDate.getUTCDate() ? 1 : 0));
    const totalAmount = monthlyPrice * billableMonths;

    const contract = new this.contractModel({
      ...data,
      durationType: 'monthly',
      monthlyPrice,
      totalAmount,
      billingType,
      amountPaid: 0,
      remainingBalance: totalAmount,
      status: 'Pending',
      paymentStatus: 'Pending',
    });
    return contract.save();
  }

  async getMealPackages(includeInactive = false) {
    return this.mealPackageModel.find(includeInactive ? {} : { isActive: true }).sort({ name: 1 }).exec();
  }

  async createMealPackage(data: any) {
    const packageData = {
      name: String(data.name || '').trim(),
      description: String(data.description || '').trim(),
      pricePerMonth: Number(data.pricePerMonth) || 0,
      includesBreakfast: data.includesBreakfast !== false,
      includesLunch: data.includesLunch !== false,
      includesDinner: data.includesDinner !== false,
      isActive: data.isActive !== false,
    };
    if (!packageData.name || !packageData.description) throw new BadRequestException('Package name and description are required');
    if (packageData.pricePerMonth < 0) {
      throw new BadRequestException('Package prices cannot be negative');
    }
    return new this.mealPackageModel(packageData).save();
  }

  async updateMealPackage(id: string, data: any) {
    const allowed: any = {};
    for (const key of ['name', 'description', 'includesBreakfast', 'includesLunch', 'includesDinner', 'isActive']) {
      if (data[key] !== undefined) allowed[key] = data[key];
    }
    for (const key of ['pricePerMonth']) {
      if (data[key] !== undefined) {
        allowed[key] = Number(data[key]);
        if (!Number.isFinite(allowed[key]) || allowed[key] < 0) throw new BadRequestException('Package prices must be valid non-negative amounts');
      }
    }
    const pkg = await this.mealPackageModel.findByIdAndUpdate(id, allowed, { new: true, runValidators: true }).exec();
    if (!pkg) throw new NotFoundException('Meal package not found');
    return pkg;
  }

  async findAll() {
    await this.expireEndedContracts();
    return this.contractModel.find({ isDeleted: false }).populate('customer mealPackage').exec();
  }

  async findById(id: string) {
    await this.expireEndedContracts();
    const contract = await this.contractModel.findOne({ _id: id, isDeleted: false }).populate('customer mealPackage').exec();
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async findByCustomer(customerId: string) {
    return this.contractModel.find({ customer: customerId, isDeleted: false }).populate('mealPackage').exec();
  }

  async findEligibleForDate(customerId: string, date: Date) {
    return this.contractModel.find({
      customer: customerId,
      status: 'Active',
      isDeleted: false,
      startDate: { $lte: date },
      endDate: { $gte: date },
    }).populate('mealPackage').exec();
  }

  async findContractsActiveOn(dateKey: string) {
    const date = new Date(`${dateKey}T00:00:00.000Z`);
    return this.contractModel.find({
      isDeleted: false,
      status: { $in: ['Active', 'Expired'] },
      billingType: { $ne: 'pay_per_meal' },
      startDate: { $lte: date },
      endDate: { $gte: date },
    }).populate('customer mealPackage').exec();
  }

  async findByUser(userId: string) {
    const customer = await this.customersService.findByUserId(userId);
    if (!customer) return [];
    return this.findByCustomer(customer._id.toString());
  }

  async update(id: string, data: any) {
    const contract = await this.contractModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async delete(id: string) {
    const contract = await this.contractModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, status: 'Cancelled' },
      { new: true },
    ).exec();
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async updateStatus(id: string, status: string) {
    const contract = await this.contractModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async getActiveContracts() {
    await this.expireEndedContracts();
    return this.contractModel.find({ status: 'Active' }).populate('customer mealPackage').exec();
  }

  async getExpiredContracts() {
    await this.expireEndedContracts();
    return this.contractModel.find({ status: 'Expired' }).populate('customer mealPackage').exec();
  }

  private async expireEndedContracts() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await this.contractModel.updateMany(
      { isDeleted: false, status: 'Active', endDate: { $lt: today } },
      { $set: { status: 'Expired' } },
    ).exec();
  }

  async getContractCountsAsOf(date: Date) {
    const [active, expired] = await Promise.all([
      this.contractModel.countDocuments({ isDeleted: false, status: 'Active', startDate: { $lte: date }, endDate: { $gte: date } }),
      this.contractModel.countDocuments({ isDeleted: false, endDate: { $lt: date }, status: { $in: ['Active', 'Expired', 'Suspended'] } }),
    ]);
    return { active, expired };
  }
}
