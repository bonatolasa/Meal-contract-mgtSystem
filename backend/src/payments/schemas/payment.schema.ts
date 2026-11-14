import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Contract', required: true })
  contract: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customer: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: ['cash', 'bank_transfer', 'mobile_money', 'card'], default: 'cash' })
  paymentMethod: string;

  @Prop({ default: Date.now })
  paymentDate: Date;

  @Prop()
  reference: string;

  @Prop()
  notes: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);