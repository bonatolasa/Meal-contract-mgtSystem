import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MealTrackingDocument = MealTracking & Document;

@Schema({ timestamps: true })
export class MealTracking {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Contract', required: true })
  contract: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ type: Boolean, default: false })
  breakfast: boolean;

  @Prop({ type: Boolean, default: false })
  lunch: boolean;

  @Prop({ type: Boolean, default: false })
  dinner: boolean;

  @Prop({ enum: ['present', 'absent'], default: 'present' })
  attendanceStatus: string;

  @Prop()
  notes: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  recordedBy: Types.ObjectId;

  @Prop({ type: Object, default: {} })
  mealCharges: Record<string, number>;

  @Prop({ default: 0, min: 0 })
  totalCharge: number;

  @Prop({ enum: ['served', 'cancelled', 'reversed'], default: 'served' })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reversedBy: Types.ObjectId;

  @Prop()
  reversalNote: string;
}

export const MealTrackingSchema = SchemaFactory.createForClass(MealTracking);
MealTrackingSchema.index({ customer: 1, date: 1 }, { unique: true });
