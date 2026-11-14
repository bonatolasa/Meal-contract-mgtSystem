import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';

@Injectable()
export class CustomersService {
  constructor(@InjectModel(Customer.name) private customerModel: Model<CustomerDocument>) {}

  async create(data: any) {
    const customer = new this.customerModel(data);
    return customer.save();
  }

  async findAll() {
    return this.customerModel.find({ isActive: true }).exec();
  }

  async findById(id: string) {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async findByUserId(userId: string) {
    return this.customerModel.findOne({ user: userId }).exec();
  }

  async findMatching(query: any) {
    return this.customerModel.find(query).sort({ name: 1 }).exec();
  }

  async update(id: string, data: any) {
    const customer = await this.customerModel.findByIdAndUpdate(id, data, { new: true }).exec();
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async delete(id: string) {
    const customer = await this.customerModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec();
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }
}
