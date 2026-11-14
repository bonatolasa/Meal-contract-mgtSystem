import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MealTrackingController } from './meal-tracking.controller';
import { CustomersModule } from '../customers/customers.module';
import { ContractsModule } from '../contracts/contracts.module';
import { MealOperationsService } from './meal-operations.service';
import { MenuItem, MenuItemSchema } from './schemas/menu-item.schema';
import { DailyMenu, DailyMenuSchema } from './schemas/daily-menu.schema';
import { MealSelection, MealSelectionSchema } from './schemas/meal-selection.schema';
import { MealServing, MealServingSchema } from './schemas/meal-serving.schema';
import { MealSettings, MealSettingsSchema } from './schemas/meal-settings.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MenuItem.name, schema: MenuItemSchema },
      { name: DailyMenu.name, schema: DailyMenuSchema },
      { name: MealSelection.name, schema: MealSelectionSchema },
      { name: MealServing.name, schema: MealServingSchema },
      { name: MealSettings.name, schema: MealSettingsSchema },
    ]),
    CustomersModule,
    ContractsModule,
  ],
  providers: [MealOperationsService],
  controllers: [MealTrackingController],
  exports: [MealOperationsService],
})
export class MealTrackingModule {}
