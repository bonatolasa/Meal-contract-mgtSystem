import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MealPackageDocument = MealPackage & Document;

@Schema({ timestamps: true })
export class MealPackage {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  pricePerMonth: number;

  @Prop({ type: Boolean, default: true })
  includesBreakfast: boolean;

  @Prop({ type: Boolean, default: true })
  includesLunch: boolean;

  @Prop({ type: Boolean, default: true })
  includesDinner: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export const MealPackageSchema = SchemaFactory.createForClass(MealPackage);