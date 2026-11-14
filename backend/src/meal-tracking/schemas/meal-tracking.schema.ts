import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MealTrackingDocument = MealTracking & Document;

@Schema({ timestamps: true })
export class MealTracking {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customer: Types.ObjectId;

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
}

export const MealTrackingSchema = SchemaFactory.createForClass(MealTracking);