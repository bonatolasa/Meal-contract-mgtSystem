import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MealSettingsDocument = MealSettings & Document;

@Schema({ timestamps: true })
export class MealSettings {
  @Prop({ default: 'global', unique: true }) key: string;
  @Prop({ default: 'Africa/Addis_Ababa' }) timezone: string;
  @Prop({ default: '07:00' }) breakfastDeadline: string;
  @Prop({ default: '10:00' }) lunchDeadline: string;
  @Prop({ default: '15:00' }) dinnerDeadline: string;
}

export const MealSettingsSchema = SchemaFactory.createForClass(MealSettings);
