import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { ContractsService } from '../contracts/contracts.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private contractsService: ContractsService,
  ) {}

  async createPayment(data: any) {
    const contract = await this.contractsService.findById(data.contract);
    if (!contract) throw new NotFoundException('Contract not found');

    const payment = new this.paymentModel(data);
    await payment.save();

    const newAmountPaid = contract.amountPaid + data.amount;
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

  async findAll() {
    return this.paymentModel.find().populate('contract customer').exec();
  }

  async findByContract(contractId: string) {
    return this.paymentModel.find({ contract: contractId }).exec();
  }

  async findByCustomer(customerId: string) {
    return this.paymentModel.find({ customer: customerId }).exec();
  }

  async getOutstandingBalances() {
    const contracts = await this.contractsService.findAll();
    return contracts.filter((c: any) => c.remainingBalance > 0);
  }
}