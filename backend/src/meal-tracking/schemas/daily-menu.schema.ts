import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DailyMenuDocument = DailyMenu & Document;

@Schema({ timestamps: true })
export class DailyMenu {
  @Prop({ required: true, index: true }) date: string;
  @Prop({ enum: ['breakfast', 'lunch', 'dinner'], required: true }) mealType: string;
  @Prop({ type: Types.ObjectId, ref: 'MenuItem', required: true }) menuItem: Types.ObjectId;
  @Prop({ required: true, min: 0 }) displayPrice: number;
  @Prop({ default: true }) isAvailable: boolean;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) publishedBy: Types.ObjectId;
}

export const DailyMenuSchema = SchemaFactory.createForClass(DailyMenu);
DailyMenuSchema.index({ date: 1, mealType: 1, menuItem: 1 }, { unique: true });
