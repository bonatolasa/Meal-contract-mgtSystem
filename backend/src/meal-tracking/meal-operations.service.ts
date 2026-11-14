import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomersService } from '../customers/customers.service';
import { ContractsService } from '../contracts/contracts.service';
import { DailyMenu, DailyMenuDocument } from './schemas/daily-menu.schema';
import { MenuItem, MenuItemDocument } from './schemas/menu-item.schema';
import { MealSelection, MealSelectionDocument } from './schemas/meal-selection.schema';
import { MealServing, MealServingDocument } from './schemas/meal-serving.schema';
import { MealSettings, MealSettingsDocument } from './schemas/meal-settings.schema';

const MEALS = ['breakfast', 'lunch', 'dinner'] as const;
const STATUS_FIELDS = { breakfast: 'breakfast', lunch: 'lunch', dinner: 'dinner' } as const;
const MENU_FIELDS = { breakfast: 'breakfastMenu', lunch: 'lunchMenu', dinner: 'dinnerMenu' } as const;

const DEFAULT_ETHIOPIAN_MENU = [
  { nameEnglish: 'Firfir', category: 'breakfast', price: 80 },
  { nameEnglish: 'Chechebsa', category: 'breakfast', price: 90 },
  { nameEnglish: 'Genfo', category: 'breakfast', price: 70 },
  { nameEnglish: 'Injera with Shiro', category: 'lunch', price: 120 },
  { nameEnglish: 'Injera with Misir Wot', category: 'lunch', price: 110 },
  { nameEnglish: 'Injera with Doro Wot', category: 'lunch', price: 180 },
  { nameEnglish: 'Rice with Meat', category: 'lunch', price: 150 },
  { nameEnglish: 'Injera with Tibs', category: 'dinner', price: 160 },
  { nameEnglish: 'Injera with Shiro', category: 'dinner', price: 120 },
  { nameEnglish: 'Pasta', category: 'dinner', price: 100 },
];

@Injectable()
export class MealOperationsService {
  constructor(
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
    @InjectModel(DailyMenu.name) private dailyMenuModel: Model<DailyMenuDocument>,
    @InjectModel(MealSelection.name) private selectionModel: Model<MealSelectionDocument>,
    @InjectModel(MealServing.name) private servingModel: Model<MealServingDocument>,
    @InjectModel(MealSettings.name) private settingsModel: Model<MealSettingsDocument>,
    private customersService: CustomersService,
    private contractsService: ContractsService,
  ) {}

  private validateDate(date: string) {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      throw new BadRequestException('Date must use YYYY-MM-DD format');
    }
    return date;
  }

  async listMenuItems(includeUnavailable = false) {
    await this.seedDefaultMenu();
    return this.menuItemModel.find(includeUnavailable ? {} : { isAvailable: true }).sort({ category: 1, nameEnglish: 1 }).exec();
  }

  private async seedDefaultMenu() {
    await Promise.all(DEFAULT_ETHIOPIAN_MENU.map(({ nameEnglish, category, price }) =>
      this.menuItemModel.updateOne(
        { nameEnglish, category },
        { $setOnInsert: { nameAfaanOromo: '', nameAmharic: '', description: '', price, isAvailable: true } },
        { upsert: true },
      ).exec(),
    ));
  }

  async createMenuItem(data: any) {
    if (!data.nameEnglish?.trim()) throw new BadRequestException('English food name is required');
    if (!['breakfast', 'lunch', 'dinner'].includes(data.category)) throw new BadRequestException('Choose a valid meal category');
    const price = Number(data.price);
    if (!Number.isFinite(price) || price < 0) throw new BadRequestException('Menu price must be a non-negative number');
    return this.menuItemModel.create({
      nameEnglish: data.nameEnglish.trim(),
      nameAfaanOromo: String(data.nameAfaanOromo || '').trim(),
      nameAmharic: String(data.nameAmharic || '').trim(),
      description: String(data.description || '').trim(),
      category: data.category,
      price,
      imageUrl: String(data.imageUrl || '').trim(),
    });
  }

  async updateMenuItem(id: string, data: any) {
    const allowed: any = {};
    for (const key of ['nameEnglish', 'nameAfaanOromo', 'nameAmharic', 'description', 'category', 'imageUrl', 'isAvailable']) {
      if (data[key] !== undefined) allowed[key] = data[key];
    }
    if (data.price !== undefined) {
      allowed.price = Number(data.price);
      if (!Number.isFinite(allowed.price) || allowed.price < 0) throw new BadRequestException('Menu price must be non-negative');
    }
    const item = await this.menuItemModel.findByIdAndUpdate(id, allowed, { new: true, runValidators: true }).exec();
    if (!item) throw new NotFoundException('Food item not found');
    return item;
  }

  async publishDailyMenu(data: any, publishedBy: string) {
    const date = this.validateDate(data.date);
    if (!MEALS.includes(data.mealType)) throw new BadRequestException('Choose breakfast, lunch, or dinner');
    const item = await this.menuItemModel.findOne({ _id: data.menuItem, isAvailable: true }).exec();
    if (!item) throw new NotFoundException('Available food item not found');
    if (item.category !== data.mealType) throw new BadRequestException('Food category does not match the selected meal');
    const displayPrice = data.displayPrice === undefined ? item.price : Number(data.displayPrice);
    if (!Number.isFinite(displayPrice) || displayPrice < 0) throw new BadRequestException('Display price must be non-negative');
    return this.dailyMenuModel.findOneAndUpdate(
      { date, mealType: data.mealType, menuItem: item._id },
      { $set: { displayPrice, isAvailable: true, publishedBy } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).populate('menuItem').exec();
  }

  async getDailyMenu(date: string) {
    this.validateDate(date);
    return this.dailyMenuModel.find({ date, isAvailable: true }).populate('menuItem').sort({ mealType: 1 }).exec();
  }

  async removeDailyMenuItem(id: string) {
    const item = await this.dailyMenuModel.findByIdAndUpdate(id, { isAvailable: false }, { new: true }).exec();
    if (!item) throw new NotFoundException('Daily menu entry not found');
    return item;
  }

  async getSettings() {
    let settings = await this.settingsModel.findOne({ key: 'global' }).exec();
    if (!settings) settings = await this.settingsModel.create({ key: 'global' });
    return settings;
  }

  async updateSettings(data: any) {
    const current = await this.getSettings();
    const settings: any = {};
    for (const field of ['breakfastDeadline', 'lunchDeadline', 'dinnerDeadline']) {
      if (data[field] !== undefined) {
        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(data[field])) throw new BadRequestException(`${field} must use HH:mm`);
        settings[field] = data[field];
      }
    }
    if (data.timezone !== undefined) {
      try { new Intl.DateTimeFormat('en-US', { timeZone: data.timezone }); }
      catch { throw new BadRequestException('Timezone is invalid'); }
      settings.timezone = data.timezone;
    }
    return this.settingsModel.findByIdAndUpdate(current._id, settings, { new: true, runValidators: true }).exec();
  }

  private localParts(timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}` };
  }

  private dateKeyInZone(date: Date, timeZone: string) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  private isClosed(date: string, mealType: string, settings: MealSettingsDocument) {
    const now = this.localParts(settings.timezone);
    if (date < now.date) return true;
    if (date > now.date) return false;
    const deadlineField = `${mealType}Deadline` as 'breakfastDeadline' | 'lunchDeadline' | 'dinnerDeadline';
    return now.time >= settings[deadlineField];
  }

  private async getContract(customerId: string, date: string) {
    const keyDate = new Date(`${date}T00:00:00.000Z`);
    const contracts = await this.contractsService.findEligibleForDate(customerId, keyDate) as any[];
    const fixed = contracts.filter((contract) => contract.billingType !== 'pay_per_meal');
    if (fixed.length !== 1) throw new BadRequestException(fixed.length ? 'More than one active monthly contract covers this date' : 'An active monthly contract is required for this date');
    return fixed[0];
  }

  async getMySelection(userId: string, date: string) {
    this.validateDate(date);
    const customer = await this.customersService.findByUserId(userId);
    if (!customer) throw new NotFoundException('Student profile not found');
    const existing = await this.selectionModel.findOne({ customer: customer._id, date }).populate('breakfastMenu lunchMenu dinnerMenu').exec();
    const contract = existing ? null : await this.getContract(customer._id.toString(), date);
    const [selection, menu, settings] = await Promise.all([
      Promise.resolve(existing),
      this.getDailyMenu(date),
      this.getSettings(),
    ]);
    const served = selection ? await this.servingModel.find({ selection: selection._id, status: 'SERVED' }).select('mealType').exec() : [];
    const servedMeals = new Set(served.map((item) => item.mealType));
    return {
      selection: selection || { customer: customer._id, contract: contract._id, date, breakfast: 'PENDING', lunch: 'PENDING', dinner: 'PENDING', submitted: false },
      menu,
      deadlines: {
        breakfast: settings.breakfastDeadline,
        lunch: settings.lunchDeadline,
        dinner: settings.dinnerDeadline,
        timezone: settings.timezone,
      },
      locked: Object.fromEntries(MEALS.map((meal) => [meal, this.isClosed(date, meal, settings) || servedMeals.has(meal)])),
    };
  }

  async submitMySelection(userId: string, data: any) {
    const date = this.validateDate(data.date);
    const settings = await this.getSettings();
    const todayKey = this.localParts(settings.timezone).date;
    const tomorrow = new Date(`${todayKey}T00:00:00.000Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowKey = tomorrow.toISOString().slice(0, 10);
    if (date < todayKey || date > tomorrowKey) throw new BadRequestException('Students can submit selections for today or tomorrow only');
    const customer = await this.customersService.findByUserId(userId);
    if (!customer) throw new NotFoundException('Student profile not found');
    const contract = await this.getContract(customer._id.toString(), date);
    if (MEALS.every((meal) => data[meal] === 'PENDING')) throw new BadRequestException('Choose at least one meal before submitting');
    const current = await this.selectionModel.findOne({ customer: customer._id, date }).exec();
    const served = current ? await this.servingModel.find({ selection: current._id, status: 'SERVED' }).select('mealType').exec() : [];
    const servedMeals = new Set(served.map((item) => item.mealType));
    const menu = await this.getDailyMenu(date) as any[];
    const changed = [];
    const update: any = {};

    for (const meal of MEALS) {
      const requested = data[meal];
      const oldStatus = current?.[STATUS_FIELDS[meal]] || 'PENDING';
      const oldMenu = current?.[MENU_FIELDS[meal]]?.toString() || '';
      if (servedMeals.has(meal) && (requested !== oldStatus || (data[MENU_FIELDS[meal]] || '') !== oldMenu)) {
        throw new BadRequestException(`${meal} has already been served and cannot be changed`);
      }
      if (!['PENDING', 'EATING', 'NOT_EATING'].includes(requested)) throw new BadRequestException(`Choose EATING or NOT_EATING for ${meal}`);
      if (requested === 'PENDING') {
        if (this.isClosed(date, meal, settings) && (oldStatus !== 'PENDING' || oldMenu)) throw new BadRequestException(`${meal} selection deadline has passed`);
        update[STATUS_FIELDS[meal]] = 'PENDING';
        update[MENU_FIELDS[meal]] = undefined;
        if (oldStatus !== 'PENDING' || oldMenu) changed.push({ mealType: meal, oldStatus, newStatus: 'PENDING', oldMenu: oldMenu || undefined, changedBy: userId, changedAt: new Date() });
        continue;
      }
      const menuKey = data[MENU_FIELDS[meal]];
      if (requested === 'EATING') {
        if (!menuKey) throw new BadRequestException(`Choose a menu item for ${meal}`);
        const chosenMenu = menu.find((entry) => entry._id.toString() === menuKey && entry.mealType === meal);
        if (!chosenMenu) throw new BadRequestException(`No published ${meal} menu item matches the selection`);
        update[MENU_FIELDS[meal]] = chosenMenu._id;
      } else {
        update[MENU_FIELDS[meal]] = undefined;
      }
      update[STATUS_FIELDS[meal]] = requested;
      const newMenu = update[MENU_FIELDS[meal]]?.toString() || '';
      if (this.isClosed(date, meal, settings) && (requested !== oldStatus || newMenu !== oldMenu)) throw new BadRequestException(`${meal} selection deadline has passed`);
      if (requested !== oldStatus || newMenu !== oldMenu) changed.push({ mealType: meal, oldStatus, newStatus: requested, oldMenu: oldMenu || undefined, newMenu: newMenu || undefined, changedBy: userId, changedAt: new Date() });
    }

    if (current) {
      current.set(update);
      current.submitted = true;
      current.submittedBy = userId as any;
      current.history.push(...changed as any);
      await current.save();
      return current.populate('breakfastMenu lunchMenu dinnerMenu');
    }
    return this.selectionModel.create({
      customer: customer._id,
      contract: contract._id,
      date,
      ...update,
      submitted: true,
      submittedBy: userId,
      history: changed,
    });
  }

  async getMySelectionHistory(userId: string) {
    const customer = await this.customersService.findByUserId(userId);
    if (!customer) throw new NotFoundException('Student profile not found');
    return this.selectionModel.find({ customer: customer._id }).populate('breakfastMenu lunchMenu dinnerMenu').sort({ date: -1 }).exec();
  }

  async getAttendance(date: string, filters: any = {}) {
    this.validateDate(date);
    const activeContracts = await this.contractsService.findContractsActiveOn(date) as any[];
    const contractsByCustomer = new Map(activeContracts.map((contract) => [contract.customer._id.toString(), contract]));
    const customerIds = [...contractsByCustomer.keys()];
    const customerQuery: any = { _id: { $in: customerIds }, isActive: true };
    if (filters.name) {
      const escaped = String(filters.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      customerQuery.name = { $regex: escaped, $options: 'i' };
    }
    const customers = await this.customersService.findMatching(customerQuery);
    const ids = customers.map((customer: any) => customer._id);
    let selectionQuery: any = { date, customer: { $in: ids } };
    if (filters.status && MEALS.includes(filters.mealType)) selectionQuery[filters.mealType] = filters.status;
    else if (filters.status) selectionQuery.$or = MEALS.map((meal) => ({ [meal]: filters.status }));
    const selections = await this.selectionModel.find(selectionQuery).populate('breakfastMenu lunchMenu dinnerMenu').exec();
    const byCustomer = new Map(selections.map((selection: any) => [selection.customer.toString(), selection]));
    const rows = customers.map((customer: any) => {
      const selection: any = byCustomer.get(customer._id.toString());
      const contract: any = contractsByCustomer.get(customer._id.toString());
      return {
        customer,
        contract,
        selection: selection || { date, breakfast: 'PENDING', lunch: 'PENDING', dinner: 'PENDING', submitted: false },
      };
    });
    return rows.filter((row) => {
      if (!filters.status) return true;
      if (MEALS.includes(filters.mealType)) return row.selection[filters.mealType] === filters.status;
      return MEALS.some((meal) => row.selection[meal] === filters.status);
    });
  }

  async getMealSummary(date: string) {
    const rows = await this.getAttendance(date);
    const summary: any = { date, activeStudents: rows.length, breakfast: { eating: 0, notEating: 0, pending: 0 }, lunch: { eating: 0, notEating: 0, pending: 0 }, dinner: { eating: 0, notEating: 0, pending: 0 } };
    for (const row of rows) for (const meal of MEALS) {
      const status = row.selection[meal].toLowerCase();
      if (status === 'eating') summary[meal].eating++;
      else if (status === 'not_eating') summary[meal].notEating++;
      else summary[meal].pending++;
    }
    summary.totalExpected = summary.breakfast.eating + summary.lunch.eating + summary.dinner.eating;
    return summary;
  }

  async overrideSelection(id: string, actorId: string, data: any) {
    const selection = await this.selectionModel.findById(id).exec();
    if (!selection) throw new NotFoundException('Meal selection not found');
    const settings = await this.getSettings();
    const changed = [];
    for (const meal of MEALS) {
      if (data[meal] === undefined) continue;
      if (!['EATING', 'NOT_EATING', 'PENDING'].includes(data[meal])) throw new BadRequestException(`Invalid ${meal} selection status`);
      const oldStatus = selection[meal];
      const oldMenu = selection[MENU_FIELDS[meal]]?.toString() || '';
      if (data[meal] === 'EATING') {
        let menuKey = data[MENU_FIELDS[meal]] || selection[MENU_FIELDS[meal]];
        if (!menuKey) {
          const firstMenu = await this.dailyMenuModel.findOne({ date: selection.date, mealType: meal, isAvailable: true }).sort({ createdAt: 1 }).exec();
          menuKey = firstMenu?._id;
        }
        const menu = await this.dailyMenuModel.findOne({ _id: menuKey, date: selection.date, mealType: meal, isAvailable: true }).exec();
        if (!menu) throw new BadRequestException(`Publish and select a ${meal} menu item first`);
        selection[MENU_FIELDS[meal]] = menu._id as any;
      }
      selection[meal] = data[meal];
      if (data[meal] !== 'EATING') selection[MENU_FIELDS[meal]] = undefined as any;
      const newMenu = selection[MENU_FIELDS[meal]]?.toString() || '';
      if (oldStatus !== data[meal] || oldMenu !== newMenu) changed.push({ mealType: meal, oldStatus, newStatus: data[meal], oldMenu: oldMenu || undefined, newMenu: newMenu || undefined, changedBy: actorId, changedAt: new Date(), note: String(data.note || 'Owner override') });
    }
    selection.history.push(...changed as any);
    selection.submitted = true;
    selection.submittedBy = actorId as any;
    return selection.save();
  }

  async overrideCustomerSelection(customerId: string, date: string, actorId: string, data: any) {
    this.validateDate(date);
    let selection = await this.selectionModel.findOne({ customer: customerId, date }).exec();
    if (!selection) {
      const contract = await this.getContract(customerId, date);
      selection = await this.selectionModel.create({ customer: customerId, contract: contract._id, date, submitted: false });
    }
    return this.overrideSelection(selection._id.toString(), actorId, data);
  }

  async recordServing(selectionId: string, mealType: string, status: 'SERVED' | 'NO_SHOW', servedBy: string, note = '') {
    if (!MEALS.includes(mealType as any)) throw new BadRequestException('Meal type is invalid');
    const selection = await this.selectionModel.findById(selectionId).exec();
    if (!selection) throw new NotFoundException('Meal selection not found');
    if (selection[mealType] !== 'EATING') throw new BadRequestException('Student did not select this meal');
    const settings = await this.getSettings();
    if (selection.date > this.localParts(settings.timezone).date) throw new BadRequestException('Future meals cannot be marked as served');
    return this.servingModel.findOneAndUpdate(
      { selection: selection._id, mealType },
      {
        $set: { customer: selection.customer, contract: selection.contract, date: selection.date, dailyMenu: selection[MENU_FIELDS[mealType as keyof typeof MENU_FIELDS]], servedBy, status, note },
      },
      { new: true, upsert: true, runValidators: true },
    ).populate('customer dailyMenu servedBy', '-password').exec();
  }

  async getServings(date: string) {
    this.validateDate(date);
    return this.servingModel.find({ date }).populate('customer dailyMenu servedBy', '-password').sort({ mealType: 1 }).exec();
  }

  async getServingSummary(date: string) {
    this.validateDate(date);
    const servings = await this.servingModel.find({ date }).exec();
    const rows = await this.servingModel.aggregate([
      { $match: { date } },
      { $group: { _id: { mealType: '$mealType', status: '$status' }, count: { $sum: 1 } } },
    ]).exec();
    const summary: any = { date, totalCustomersServed: new Set(servings.filter((item) => item.status === 'SERVED').map((item) => item.customer.toString())).size, totalMealsServed: servings.filter((item) => item.status === 'SERVED').length, breakfast: { served: 0, noShow: 0 }, lunch: { served: 0, noShow: 0 }, dinner: { served: 0, noShow: 0 } };
    for (const row of rows) {
      const meal = row._id.mealType;
      if (summary[meal] && ['SERVED', 'NO_SHOW'].includes(row._id.status)) {
        summary[meal][row._id.status === 'SERVED' ? 'served' : 'noShow'] = row.count;
      }
    }
    return summary;
  }

  async getTodayServingSummary() {
    const settings = await this.getSettings();
    const { date } = this.localParts(settings.timezone);
    return this.getServingSummary(date);
  }

  async getMealActivityBetween(start: Date, endExclusive: Date) {
    const settings = await this.getSettings();
    const startKey = this.dateKeyInZone(start, settings.timezone);
    const endKey = this.dateKeyInZone(endExclusive, settings.timezone);
    const [selections, servings] = await Promise.all([
      this.selectionModel.find({ date: { $gte: startKey, $lt: endKey } }).exec(),
      this.servingModel.find({ date: { $gte: startKey, $lt: endKey } }).exec(),
    ]);
    const expected: any = { breakfast: 0, lunch: 0, dinner: 0 };
    const pending: any = { breakfast: 0, lunch: 0, dinner: 0 };
    for (const row of selections) for (const meal of MEALS) {
      if (row[meal] === 'EATING') expected[meal]++;
      if (row[meal] === 'PENDING') pending[meal]++;
    }
    const actual: any = { breakfast: { served: 0, noShow: 0 }, lunch: { served: 0, noShow: 0 }, dinner: { served: 0, noShow: 0 } };
    for (const serving of servings) {
      if (actual[serving.mealType]) {
        if (serving.status === 'SERVED') actual[serving.mealType].served++;
        if (serving.status === 'NO_SHOW') actual[serving.mealType].noShow++;
      }
    }
    const totalExpected = expected.breakfast + expected.lunch + expected.dinner;
    const totalServed = actual.breakfast.served + actual.lunch.served + actual.dinner.served;
    return { expected, pending, actual, totalExpected, totalServed, selectionRecords: selections.length };
  }
}
