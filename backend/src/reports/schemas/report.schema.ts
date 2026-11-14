import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  generatedAt: Date;

  @Prop({ type: Object })
  data: any;

  @Prop({ required: true })
  generatedBy: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);