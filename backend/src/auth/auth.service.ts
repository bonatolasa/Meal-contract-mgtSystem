import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private customersService: CustomersService,
  ) {}

  async register(email: string, password: string, role: string, name: string, phone: string, address: string) {
    if (!email || !password || password.length < 8 || !name?.trim() || !phone?.trim() || !address?.trim()) {
      throw new BadRequestException('Name, email, phone, address, and a password of at least 8 characters are required');
    }
    email = email.trim().toLowerCase();
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');

    if (!['student', 'employee'].includes(role)) {
      throw new BadRequestException('Public registration is limited to students and employees');
    }
    const user = await this.usersService.create(email, password, role, name);

    try {
      await this.customersService.create({
        user: user._id,
        customerId: `CUS-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name,
        email,
        phone,
        address,
        type: role,
      });
    } catch (error) {
      await this.usersService.delete(user._id.toString());
      throw error;
    }

    return this.generateToken(user);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email.trim().toLowerCase());
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('This account is inactive');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.generateToken(user);
  }

  private generateToken(user: any) {
    const payload = { email: user.email, sub: user._id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user._id, email: user.email, role: user.role, name: user.name },
    };
  }
}
