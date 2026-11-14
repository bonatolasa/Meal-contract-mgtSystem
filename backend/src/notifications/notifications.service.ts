import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
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