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
    if (!mealPackage) throw new NotFoundException('Meal package not found');

    const monthlyPrice = mealPackage.pricePerMonth;
    const totalAmount = monthlyPrice;

    const contract = new this.contractModel({
      ...data,
      monthlyPrice,
      totalAmount,
      amountPaid: 0,
      remainingBalance: totalAmount,
      paymentStatus: 'Pending',
    });
    return contract.save();
  }

  async findAll() {
    return this.contractModel.find().populate('customer mealPackage').exec();
  }

  async findById(id: string) {
    const contract = await this.contractModel.findById(id).populate('customer mealPackage').exec();
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async findByCustomer(customerId: string) {
    return this.contractModel.find({ customer: customerId }).populate('mealPackage').exec();
  }

  async update(id: string, data: any) {
    const contract = await this.contractModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async delete(id: string) {
    const contract = await this.contractModel.findByIdAndDelete(id).exec();
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async updateStatus(id: string, status: string) {
    const contract = await this.contractModel.findByIdAndUpdate(id, { status }, { new: true }).exec();
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async getActiveContracts() {
    return this.contractModel.find({ status: 'Active' }).populate('customer mealPackage').exec();
  }

  async getExpiredContracts() {
    return this.contractModel.find({ status: 'Expired' }).populate('customer mealPackage').exec();
  }
}