import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ContractDocument = Contract & Document;

@Schema({ timestamps: true })
export class Contract {
  @Prop({ required: true, unique: true })
  contractId: string;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'MealPackage', required: true })
  mealPackage: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ enum: ['daily', 'weekly', 'monthly'], required: true })
  durationType: string;

  @Prop({ enum: ['fixed_monthly'], default: 'fixed_monthly', required: true })
  billingType: string;

  @Prop({ required: true })
  monthlyPrice: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ default: 0 })
  amountPaid: number;

  @Prop({ default: 0 })
  remainingBalance: number;

  @Prop({ enum: ['Draft', 'Pending', 'Active', 'Expired', 'Suspended', 'Cancelled'], default: 'Pending' })
  status: string;

  @Prop({ enum: ['Pending', 'Paid', 'Overdue', 'Partial'], default: 'Pending' })
  paymentStatus: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);
