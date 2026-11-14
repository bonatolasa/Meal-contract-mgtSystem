import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { ContractsModule } from './contracts/contracts.module';
import { MealTrackingModule } from './meal-tracking/meal-tracking.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        if (!uri && configService.get<string>('NODE_ENV') === 'production') {
          throw new Error('MONGODB_URI must be configured in production');
        }
        return {
          uri: uri || 'mongodb://localhost:27017/meal_contract_db',
          serverSelectionTimeoutMS: 10000,
          socketTimeoutMS: 45000,
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    CustomersModule,
    ContractsModule,
    MealTrackingModule,
    PaymentsModule,
    ReportsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
