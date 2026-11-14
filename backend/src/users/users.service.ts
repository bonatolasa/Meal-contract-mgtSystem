import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(email: string, password: string, role: string, name: string) {
    if (!email?.trim() || !name?.trim() || !password || password.length < 8) {
      throw new BadRequestException('Name, email, and a password of at least 8 characters are required');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({ email, password: hashedPassword, role, name });
    const saved = await user.save();
    const result = saved.toObject();
    delete result.password;
    return result;
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).select('-password').exec();
  }

  async findAll() {
    return this.userModel.find().select('-password').exec();
  }

  async update(id: string, data: any) {
    const allowed: any = {};
    for (const field of ['name', 'email', 'role', 'isActive']) {
      if (data[field] !== undefined) allowed[field] = data[field];
    }
    if (data.password) allowed.password = await bcrypt.hash(data.password, 10);
    return this.userModel.findByIdAndUpdate(id, allowed, { new: true }).select('-password').exec();
  }

  async delete(id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async deactivate(id: string) {
    return this.userModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).select('-password').exec();
  }
}
