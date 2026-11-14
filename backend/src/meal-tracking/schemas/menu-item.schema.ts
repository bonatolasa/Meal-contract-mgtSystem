import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MenuItemDocument = MenuItem & Document;

@Schema({ timestamps: true })
export class MenuItem {
  @Prop({ required: true, trim: true }) nameEnglish: string;
  @Prop({ default: '' }) nameAfaanOromo: string;
  @Prop({ default: '' }) nameAmharic: string;
  @Prop({ default: '' }) description: string;
  @Prop({ enum: ['breakfast', 'lunch', 'dinner'], required: true }) category: string;
  @Prop({ min: 0, required: true }) price: number;
  @Prop({ default: '' }) imageUrl: string;
  @Prop({ default: true }) isAvailable: boolean;
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
