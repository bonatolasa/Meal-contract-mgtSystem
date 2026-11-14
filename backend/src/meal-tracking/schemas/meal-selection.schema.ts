import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MealSelectionDocument = MealSelection & Document;

@Schema({ _id: false })
class MealSelectionHistoryEntry {
  @Prop({ required: true }) mealType: string;
  @Prop({ required: true }) oldStatus: string;
  @Prop({ required: true }) newStatus: string;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) changedBy: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'DailyMenu' }) oldMenu: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'DailyMenu' }) newMenu: Types.ObjectId;
  @Prop({ default: Date.now }) changedAt: Date;
  @Prop({ default: '' }) note: string;
}

@Schema({ timestamps: true })
export class MealSelection {
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true }) customer: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Contract', required: true }) contract: Types.ObjectId;
  @Prop({ required: true }) date: string;
  @Prop({ enum: ['PENDING', 'EATING', 'NOT_EATING'], default: 'PENDING' }) breakfast: string;
  @Prop({ enum: ['PENDING', 'EATING', 'NOT_EATING'], default: 'PENDING' }) lunch: string;
  @Prop({ enum: ['PENDING', 'EATING', 'NOT_EATING'], default: 'PENDING' }) dinner: string;
  @Prop({ type: Types.ObjectId, ref: 'DailyMenu' }) breakfastMenu: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'DailyMenu' }) lunchMenu: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'DailyMenu' }) dinnerMenu: Types.ObjectId;
  @Prop({ default: false }) submitted: boolean;
  @Prop({ type: Types.ObjectId, ref: 'User' }) submittedBy: Types.ObjectId;
  @Prop({ type: [MealSelectionHistoryEntry], default: [] }) history: MealSelectionHistoryEntry[];
}

export const MealSelectionSchema = SchemaFactory.createForClass(MealSelection);
MealSelectionSchema.index({ customer: 1, date: 1 }, { unique: true });
