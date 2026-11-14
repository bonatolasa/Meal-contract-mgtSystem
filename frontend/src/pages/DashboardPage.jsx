import { useEffect, useState } from 'react';
import {
  getCustomers, getContracts, getTodayStats, getOutstandingPayments, getUnreadNotifications
} from '../services/api';
import { Users, FileText, Utensils, CreditCard, Bell, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeContracts: 0,
    expiredContracts: 0,
    todayCustomers: 0,
    todayMeals: 0,
    outstandingAmount: 0,
    unreadNotifications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [customersRes, contractsRes, statsRes, paymentsRes, notifRes] = await Promise.all([
        getCustomers(),
        getContracts(),
        getTodayStats(),
        getOutstandingPayments(),
        getUnreadNotifications(),
      ]);

      const contracts = contractsRes.data || [];
      const outstanding = paymentsRes.data || [];
      const unread = notifRes.data || [];

      setStats({
        totalCustomers: customersRes.data?.length || 0,
        activeContracts: contracts.filter((c) => c.status === 'Active').length,
        expiredContracts: contracts.filter((c) => c.status === 'Expired').length,
        todayCustomers: statsRes.data?.totalCustomers || 0,
        todayMeals: statsRes.data?.totalMeals || 0,
        outstandingAmount: outstanding.reduce((sum, c) => sum + (c.remainingBalance || 0), 0),
        unreadNotifications: unread.length,
      });
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-blue-500' },
    { label: 'Active Contracts', value: stats.activeContracts, icon: FileText, color: 'bg-green-500' },
    { label: 'Expired Contracts', value: stats.expiredContracts, icon: Calendar, color: 'bg-red-500' },
    { label: "Today's Customers", value: stats.todayCustomers, icon: Users, color: 'bg-purple-500' },
    { label: "Today's Meals Served", value: stats.todayMeals, icon: Utensils, color: 'bg-orange-500' },
    { label: 'Outstanding Payments', value: `ETB ${stats.outstandingAmount.toLocaleString()}`, icon: DollarSign, color: 'bg-yellow-500' },
    { label: 'Unread Notifications', value: stats.unreadNotifications, icon: Bell, color: 'bg-pink-500' },
    { label: 'Active Rate', value: `${stats.totalCustomers > 0 ? Math.round((stats.activeContracts / Math.max(stats.totalCustomers, 1)) * 100) : 0}%`, icon: TrendingUp, color: 'bg-teal-500' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card) => (
              <div key={card.label} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${card.color}`}>
                    <card.icon className="text-white" size={24} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <a href="/customers" className="p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors text-center">
                  <Users className="mx-auto mb-2 text-indigo-600" size={32} />
                  <p className="font-medium text-indigo-900">Add Customer</p>
                </a>
                <a href="/contracts" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center">
                  <FileText className="mx-auto mb-2 text-green-600" size={32} />
                  <p className="font-medium text-green-900">New Contract</p>
                </a>
                <a href="/meal-tracking" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center">
                  <Utensils className="mx-auto mb-2 text-orange-600" size={32} />
                  <p className="font-medium text-orange-900">Record Meal</p>
                </a>
                <a href="/payments" className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors text-center">
                  <CreditCard className="mx-auto mb-2 text-yellow-600" size={32} />
                  <p className="font-medium text-yellow-900">Record Payment</p>
                </a>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Total Contracts</span>
                  <span className="font-semibold">{stats.activeContracts + stats.expiredContracts}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Active Contracts</span>
                  <span className="font-semibold text-green-600">{stats.activeContracts}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Expired Contracts</span>
                  <span className="font-semibold text-red-600">{stats.expiredContracts}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Outstanding Balance</span>
                  <span className="font-semibold text-yellow-600">ETB {stats.outstandingAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Unread Notifications</span>
                  <span className="font-semibold text-pink-600">{stats.unreadNotifications}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}