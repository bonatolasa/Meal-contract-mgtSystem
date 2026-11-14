import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RolesGuard } from './roles.guard';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    UsersModule,
    CustomersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET must be configured in the backend environment');
        if (configService.get<string>('NODE_ENV') === 'production' && secret.length < 32) {
          throw new Error('JWT_SECRET must be at least 32 characters in production');
        }
        return {
          secret,
          signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION') || '7d' },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtModule, RolesGuard],
})
export class AuthModule {}
