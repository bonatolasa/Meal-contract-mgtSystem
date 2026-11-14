import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { ContractsService } from '../contracts/contracts.service';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private contractsService: ContractsService,
    private customersService: CustomersService,
  ) {}

  async createPayment(data: any, recordedBy: string) {
    const contract = await this.contractsService.findById(data.contract);
    if (!contract) throw new NotFoundException('Contract not found');

    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException('Payment amount must be greater than zero');
    if (amount > Number(contract.remainingBalance)) throw new BadRequestException('Payment cannot exceed the outstanding balance');
    if (!['cash', 'bank_transfer', 'mobile_money', 'card'].includes(data.paymentMethod || 'cash')) {
      throw new BadRequestException('Unsupported payment method');
    }
    if (data.reference && await this.paymentModel.exists({ reference: data.reference, status: 'recorded' })) {
      throw new BadRequestException('This payment reference has already been recorded');
    }

    const payment = new this.paymentModel({
      ...data,
      customer: (contract.customer as any)._id || contract.customer,
      amount,
      paymentDate: data.paymentDate || new Date(),
      recordedBy,
      status: 'recorded',
    });
    await payment.save();

    const newAmountPaid = contract.amountPaid + amount;
    const newRemainingBalance = Math.max(0, contract.totalAmount - newAmountPaid);

    let paymentStatus = 'Pending';
    if (newRemainingBalance === 0) paymentStatus = 'Paid';
    else if (newAmountPaid > 0) paymentStatus = 'Partial';

    await this.contractsService.update(contract._id.toString(), {
      amountPaid: newAmountPaid,
      remainingBalance: newRemainingBalance,
      paymentStatus,
    });

    return payment;
  }

  async reversePayment(id: string, reversedBy: string, note: string) {
    const payment = await this.paymentModel.findById(id).exec();
    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status === 'reversed') throw new BadRequestException('Payment has already been reversed');
    if (!note?.trim()) throw new BadRequestException('A reversal reason is required');
    const contract = await this.contractsService.findById(payment.contract.toString());
    payment.status = 'reversed';
    payment.reversedBy = reversedBy as any;
    payment.reversalNote = note.trim();
    await payment.save();

    const payments = await this.paymentModel.find({ contract: payment.contract, status: { $ne: 'reversed' } }).exec();
    const amountPaid = payments.reduce((sum, row) => sum + row.amount, 0);
    const remainingBalance = Math.max(0, contract.totalAmount - amountPaid);
    await this.contractsService.update(contract._id.toString(), {
      amountPaid,
      remainingBalance,
      paymentStatus: remainingBalance === 0 ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Pending',
    });
    return payment;
  }

  async findAll() {
    return this.paymentModel.find().populate('contract customer recordedBy', '-password').sort({ paymentDate: -1 }).exec();
  }

  async findByContract(contractId: string) {
    return this.paymentModel.find({ contract: contractId }).sort({ paymentDate: -1 }).exec();
  }

  async findByCustomer(customerId: string) {
    return this.paymentModel.find({ customer: customerId }).sort({ paymentDate: -1 }).exec();
  }

  async findByUser(userId: string) {
    const customer = await this.customersService.findByUserId(userId);
    if (!customer) return [];
    return this.findByCustomer(customer._id.toString());
  }

  async getCollectedBetween(start: Date, endExclusive: Date) {
    const result = await this.paymentModel.aggregate([
      { $match: { status: { $ne: 'reversed' }, paymentDate: { $gte: start, $lt: endExclusive } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).exec();
    return result[0]?.total || 0;
  }

  async getOutstandingBalances() {
    const contracts = await this.contractsService.findAll();
    return contracts.filter((c: any) => c.remainingBalance > 0);
  }
}
