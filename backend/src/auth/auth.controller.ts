import { Controller, Post, Body, Get, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; password: string; role: string; name: string; phone: string; address: string }) {
    if (!['student', 'employee'].includes(body.role)) {
      throw new BadRequestException('Public registration is limited to students and employees');
    }
    return this.authService.register(body.email, body.password, body.role, body.name, body.phone, body.address);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Request() req) {
    return { user: req.user };
  }
}
