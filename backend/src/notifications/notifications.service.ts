import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private customersService: CustomersService,
  ) {}

  async create(data: any) {
    const notification = new this.notificationModel(data);
    return notification.save();
  }

  async findAll() {
    return this.notificationModel.find().populate('customer').sort({ createdAt: -1 }).exec();
  }

  async findByCustomer(customerId: string) {
    return this.notificationModel.find({ customer: customerId }).sort({ createdAt: -1 }).exec();
  }

  async findByUser(userId: string) {
    const customer = await this.customersService.findByUserId(userId);
    if (!customer) return [];
    return this.findByCustomer(customer._id.toString());
  }

  async markAsReadForUser(id: string, userId: string) {
    const customer = await this.customersService.findByUserId(userId);
    if (!customer) throw new NotFoundException('Customer profile not found');
    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: id, customer: customer._id },
      { isRead: true },
      { new: true },
    ).exec();
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  async findUnread() {
    return this.notificationModel.find({ isRead: false }).populate('customer').exec();
  }

  async markAsRead(id: string) {
    const notification = await this.notificationModel.findByIdAndUpdate(id, { isRead: true }, { new: true }).exec();
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }

  async delete(id: string) {
    const notification = await this.notificationModel.findByIdAndDelete(id).exec();
    if (!notification) throw new NotFoundException('Notification not found');
    return notification;
  }
}
