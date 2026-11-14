import { useEffect, useState } from 'react';
import {
  getCustomers, getContracts, getTodayStats, getOutstandingPayments, getUnreadNotifications, getPayments,
  getMyCustomer, getMyContracts, getMyMealSelectionHistory, getMyPayments, getMealSummary, getUsers,
} from '../services/api';
import { Users, FileText, Utensils, CreditCard, Bell, TrendingUp, Calendar, DollarSign, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeContracts: 0,
    expiredContracts: 0,
    todayCustomers: 0,
    todayMeals: 0,
    outstandingAmount: 0,
    paymentsCollected: 0,
    unreadNotifications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState({ customer: null, contracts: [], meals: [], payments: [] });
  const [preparationSummary, setPreparationSummary] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') loadAdminSummary();
    if (user?.role === 'owner' || user?.role === 'employee') loadStats();
    if (user?.role === 'student') loadStudentData();
  }, [user?.role]);

  const loadAdminSummary = async () => {
    try {
      const response = await getUsers();
      setAdminUsers(response.data || []);
    } catch (error) {
      console.error('Failed to load admin summary', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentData = async () => {
    try {
      const [customerRes, contractsRes, mealsRes, paymentsRes] = await Promise.all([
        getMyCustomer(), getMyContracts(), getMyMealSelectionHistory(), getMyPayments(),
      ]);
      setStudentData({ customer: customerRes.data, contracts: contractsRes.data || [], meals: mealsRes.data || [], payments: paymentsRes.data || [] });
    } catch (err) {
      console.error('Failed to load student dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === 'student') {
    return (
      <section className="max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
        <p className="text-gray-600 mt-2">Your contract, meal history, and payments in one place.</p>
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="font-semibold text-gray-900">Student account</h2>
          <p className="text-sm text-gray-600 mt-2">Signed in as {user.email}</p>
          {loading ? <p className="text-sm text-gray-500 mt-4">Loading your account…</p> : studentData.customer ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {(() => {
                const activeContract = studentData.contracts.find((contract) => contract.status === 'Active') || studentData.contracts[0];
                const due = studentData.contracts.reduce((sum, contract) => sum + (Number(contract.remainingBalance) || 0), 0);
                const paid = studentData.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
                const meals = studentData.meals.reduce((sum, item) => sum + Number(item.breakfast === 'EATING') + Number(item.lunch === 'EATING') + Number(item.dinner === 'EATING'), 0);
                return [
                  ['Contract status', activeContract?.status || 'No contract'],
                  ['Meal package', activeContract?.mealPackage?.name || '—'],
                  ['Contract ends', activeContract?.endDate ? format(new Date(activeContract.endDate), 'MMM d, yyyy') : '—'],
                  ['Amount paid', `ETB ${paid.toLocaleString()}`],
                  ['Outstanding balance', `ETB ${due.toLocaleString()}`],
                  ['Meals selected', meals],
                ].map(([label, value]) => <div key={label} className="rounded-md bg-gray-50 p-4"><p className="text-xs text-gray-500">{label}</p><p className="font-semibold text-gray-900 mt-1">{value}</p></div>);
              })()}
            </div>
          ) : <p className="text-sm text-amber-700 mt-4">No customer profile is linked yet. Please contact the restaurant owner.</p>}
        </div>
        <a href="/student/meals" className="mt-5 flex items-center justify-between bg-indigo-700 text-white rounded-lg shadow px-6 py-5 hover:bg-indigo-800">
          <div><h2 className="font-semibold">Choose your meals</h2><p className="text-sm text-indigo-100 mt-1">View the menu and submit breakfast, lunch, and dinner selections.</p></div><Utensils />
        </a>
      </section>
    );
  }

  if (user?.role === 'employee') {
    return (
      <section>
        <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
        <p className="text-gray-600 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600">Meals recorded today</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '…' : stats.todayMeals}</p>
          </div>
          <a href="/meal-serving" className="bg-indigo-700 text-white rounded-lg shadow p-6 hover:bg-indigo-800">
            <Utensils size={28} />
            <h2 className="font-semibold mt-3">Confirm meal serving</h2>
            <p className="text-sm text-indigo-100 mt-1">Check a student's selection and record served meals or no-shows.</p>
          </a>
        </div>
      </section>
    );
  }

  if (user?.role === 'admin') {
    const counts = adminUsers.reduce((result, account) => {
      result[account.role] = (result[account.role] || 0) + 1;
      return result;
    }, {});
    return (
      <section className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><ShieldCheck className="text-indigo-700" /> Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage system accounts and access.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {['admin', 'owner', 'employee', 'student'].map((role) => <div key={role} className="bg-white rounded-lg shadow p-5"><p className="text-sm text-gray-500 capitalize">{role} accounts</p><p className="text-3xl font-bold text-gray-900 mt-2">{loading ? '…' : counts[role] || 0}</p></div>)}
        </div>
        <a href="/users" className="mt-6 inline-flex items-center gap-2 bg-indigo-700 text-white rounded-md px-5 py-3 hover:bg-indigo-800"><Users size={18} /> Manage staff and accounts</a>
      </section>
    );
  }

  const loadStats = async () => {
    try {
      if (user?.role === 'employee') {
        const statsRes = await getTodayStats();
        setStats((current) => ({ ...current, todayCustomers: statsRes.data?.totalCustomers || 0, todayMeals: statsRes.data?.totalMeals || 0 }));
        return;
      }
      const todayKey = format(new Date(), 'yyyy-MM-dd');
      const [customersRes, contractsRes, statsRes, outstandingRes, notifRes, paymentsRes, preparationRes] = await Promise.all([
        getCustomers(),
        getContracts(),
        getTodayStats(),
        getOutstandingPayments(),
        getUnreadNotifications(),
        getPayments(),
        getMealSummary(todayKey),
      ]);

      const contracts = contractsRes.data || [];
      const outstanding = outstandingRes.data || [];
      const payments = paymentsRes.data || [];
      const unread = notifRes.data || [];
      setPreparationSummary(preparationRes.data);

      setStats({
        totalCustomers: customersRes.data?.length || 0,
        activeContracts: contracts.filter((c) => c.status === 'Active').length,
        expiredContracts: contracts.filter((c) => c.status === 'Expired').length,
        todayCustomers: statsRes.data?.totalCustomers || 0,
        todayMeals: statsRes.data?.totalMeals || 0,
        outstandingAmount: outstanding.reduce((sum, c) => sum + (c.remainingBalance || 0), 0),
        paymentsCollected: payments.filter((payment) => payment.status !== 'reversed').reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0),
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
    { label: 'Payments Collected', value: `ETB ${stats.paymentsCollected.toLocaleString()}`, icon: CreditCard, color: 'bg-emerald-600' },
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

          {preparationSummary && <section className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4"><div><h2 className="text-lg font-semibold text-gray-900">Today's meal preparation</h2><p className="text-sm text-gray-500">Counts include student selections. Monthly contract prices do not change.</p></div><a href="/meal-attendance" className="text-sm font-medium text-indigo-700 hover:underline">Open attendance</a></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{['breakfast', 'lunch', 'dinner'].map((meal) => <div key={meal} className="rounded-md bg-indigo-50 p-4"><p className="text-sm text-gray-600 capitalize">{meal}</p><p className="text-2xl font-bold text-indigo-800">{preparationSummary[meal].eating} meals</p><p className="text-xs text-gray-500">{preparationSummary[meal].pending} selections pending</p></div>)}</div>
            <p className="font-semibold text-gray-900 mt-4">Total to prepare: {preparationSummary.totalExpected}</p>
          </section>}

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
                <a href="/meal-attendance" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center">
                  <Utensils className="mx-auto mb-2 text-orange-600" size={32} />
                  <p className="font-medium text-orange-900">Meal Attendance</p>
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
