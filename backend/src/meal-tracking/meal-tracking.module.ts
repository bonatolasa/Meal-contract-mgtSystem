import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MealTrackingService } from './meal-tracking.service';
import { MealTrackingController } from './meal-tracking.controller';
import { MealTracking, MealTrackingSchema } from './schemas/meal-tracking.schema';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MealTracking.name, schema: MealTrackingSchema }]),
    CustomersModule,
  ],
  providers: [MealTrackingService],
  controllers: [MealTrackingController],
  exports: [MealTrackingService],
})
export class MealTrackingModule {}