import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MealServingDocument = MealServing & Document;

@Schema({ timestamps: true })
export class MealServing {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true }) customer: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Contract', required: true }) contract: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'MealSelection', required: true }) selection: Types.ObjectId;
  @Prop({ required: true }) date: string;
  @Prop({ enum: ['breakfast', 'lunch', 'dinner'], required: true }) mealType: string;
  @Prop({ type: Types.ObjectId, ref: 'DailyMenu' }) dailyMenu: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) servedBy: Types.ObjectId;
  @Prop({ enum: ['SERVED', 'NO_SHOW', 'REVERSED'], default: 'SERVED' }) status: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) reversedBy: Types.ObjectId;
  @Prop({ default: '' }) note: string;
}

export const MealServingSchema = SchemaFactory.createForClass(MealServing);
MealServingSchema.index({ selection: 1, mealType: 1 }, { unique: true });
