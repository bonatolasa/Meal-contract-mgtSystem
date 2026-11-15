import { useEffect, useState } from 'react';
import {
  getCustomers, getContracts, getTodayStats, getOutstandingPayments, getUnreadNotifications, getPayments,
  getMyCustomer, getMyContracts, getMyMealSelectionHistory, getMyPayments, getMealSummary, getUsers, getMealAttendance,
} from '../services/api';
import { Users, FileText, Utensils, CreditCard, Bell, TrendingUp, Calendar, DollarSign, ShieldCheck, Search, ArrowRight, Coffee, Sun, Moon, Activity } from 'lucide-react';
import { format, subDays } from 'date-fns';
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
  const [weeklySummaries, setWeeklySummaries] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') loadAdminSummary();
    if (user?.role === 'owner' || user?.role === 'employee') loadStats();
    if (user?.role === 'student') loadStudentData();
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== 'owner') return;
    let active = true;
    setAttendanceLoading(true);
    getMealAttendance(attendanceDate, attendanceSearch ? { name: attendanceSearch } : {})
      .then((response) => { if (active) setAttendanceRows(response.data || []); })
      .catch((error) => console.error('Failed to load attendance preview', error))
      .finally(() => { if (active) setAttendanceLoading(false); });
    return () => { active = false; };
  }, [user?.role, attendanceDate, attendanceSearch]);

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
      <section className="mx-auto max-w-4xl">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-700 to-violet-700 p-5 text-white shadow-lg sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">Student dashboard</p><h1 className="mt-2 text-2xl font-bold sm:text-3xl">Welcome, {user.name}</h1><p className="mt-2 max-w-xl text-sm text-indigo-100 sm:text-base">Your contract, meal plan, and account activity at a glance.</p></div>
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="font-semibold text-slate-900">Student account</h2>
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
                ].map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 break-words font-semibold text-slate-900">{value}</p></div>);
              })()}
            </div>
          ) : <p className="text-sm text-amber-700 mt-4">No customer profile is linked yet. Please contact the restaurant owner.</p>}
        </div>
        <a href="/student/meals" className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-emerald-600 px-4 py-4 text-white shadow-md transition hover:bg-emerald-700 sm:px-6 sm:py-5">
          <div><h2 className="font-semibold">Choose your meals</h2><p className="mt-1 text-sm text-emerald-50">View the menu and submit meal selections.</p></div><Utensils className="shrink-0" />
        </a>
      </section>
    );
  }

  if (user?.role === 'employee') {
    return (
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Service desk</p><h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Employee Dashboard</h1></div><p className="text-sm text-slate-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p></div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
            <p className="text-sm text-blue-100">Meals served today</p>
            <p className="mt-2 text-4xl font-bold">{loading ? '…' : stats.todayMeals}</p>
            <p className="mt-2 text-xs text-blue-100">Confirmed meal service records</p>
          </div>
          <a href="/meal-serving" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="inline-flex rounded-xl bg-emerald-50 p-3 text-emerald-700"><Utensils size={24} /></span>
            <h2 className="mt-3 font-semibold text-slate-900">Confirm meal serving</h2>
            <p className="mt-1 text-sm text-slate-500">Check a student’s selection and record served meals or no-shows.</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">Open serving list <ArrowRight size={16} /></span>
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
      const chartDates = Array.from({ length: 7 }, (_, index) => subDays(new Date(), 6 - index));
      const [customersRes, contractsRes, statsRes, outstandingRes, notifRes, paymentsRes, preparationRes, chartResponses] = await Promise.all([
        getCustomers(),
        getContracts(),
        getTodayStats(),
        getOutstandingPayments(),
        getUnreadNotifications(),
        getPayments(),
        getMealSummary(todayKey),
        Promise.all(chartDates.map((date) => getMealSummary(format(date, 'yyyy-MM-dd')))),
      ]);

      const contracts = contractsRes.data || [];
      const outstanding = outstandingRes.data || [];
      const payments = paymentsRes.data || [];
      const unread = notifRes.data || [];
      setPreparationSummary(preparationRes.data);
      setWeeklySummaries(chartResponses.map((response, index) => ({ date: chartDates[index], summary: response.data })));

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

  const todayMeals = preparationSummary?.totalExpected || 0;
  const summaryCards = [
    { label: 'Registered customers', value: stats.totalCustomers, hint: `${stats.todayCustomers} with meals recorded today`, icon: Users, theme: 'from-blue-600 to-indigo-600', iconBg: 'bg-white/15' },
    { label: 'Active contracts', value: stats.activeContracts, hint: `${stats.expiredContracts} expired`, icon: FileText, theme: 'from-emerald-500 to-teal-600', iconBg: 'bg-white/15' },
    { label: 'Meals planned today', value: todayMeals, hint: `${preparationSummary?.activeStudents || 0} active students`, icon: Activity, theme: 'from-orange-500 to-amber-500', iconBg: 'bg-white/15' },
    { label: 'Outstanding balance', value: `ETB ${stats.outstandingAmount.toLocaleString()}`, hint: `${stats.unreadNotifications} unread notifications`, icon: DollarSign, theme: 'from-violet-600 to-purple-600', iconBg: 'bg-white/15' },
  ];
  const maxChartMeals = Math.max(1, ...weeklySummaries.map(({ summary }) => summary?.totalExpected || 0));
  const mealStyles = {
    breakfast: { label: 'Breakfast', icon: Coffee, color: 'bg-amber-500', soft: 'bg-amber-50 text-amber-800' },
    lunch: { label: 'Lunch', icon: Sun, color: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-800' },
    dinner: { label: 'Dinner', icon: Moon, color: 'bg-violet-500', soft: 'bg-violet-50 text-violet-800' },
  };
  const badgeClass = (status) => status === 'EATING' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : status === 'NOT_EATING' ? 'bg-rose-50 text-rose-700 ring-rose-600/20' : 'bg-slate-100 text-slate-600 ring-slate-500/20';
  const badgeLabel = (status) => status === 'EATING' ? 'Eating' : status === 'NOT_EATING' ? 'Not eating' : 'Pending';

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Restaurant overview</p><h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Good day, {user?.name?.split(' ')[0]}</h1><p className="text-slate-500 mt-1">Here’s what’s happening at your restaurant.</p></div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm"><Calendar size={16} className="mr-2 inline text-indigo-600" />{format(new Date(), 'EEEE, MMMM d')}</div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading dashboard...</div>
      ) : (
        <>
        <div className="grid grid-cols-1 min-[520px]:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {summaryCards.map((card) => (
              <article key={card.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.theme} p-5 text-white shadow-lg shadow-slate-200/70`}>
                <div className="absolute -right-5 -top-8 h-28 w-28 rounded-full bg-white/10" />
                <div className="relative flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-medium text-white/80">{card.label}</p><p className="mt-3 truncate text-2xl sm:text-3xl font-bold">{loading ? '…' : card.value}</p><p className="mt-2 truncate text-xs text-white/75">{card.hint}</p></div><span className={`rounded-xl p-3 ${card.iconBg}`}><card.icon size={22} /></span></div>
              </article>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.85fr] gap-5 mb-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-bold text-slate-900">Daily meal selections</h2><p className="text-sm text-slate-500">Expected meals over the last seven days</p></div><div className="flex flex-wrap gap-3 text-xs font-medium text-slate-600">{Object.entries(mealStyles).map(([key, meal]) => <span key={key} className="inline-flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-full ${meal.color}`} />{meal.label}</span>)}</div></div>
              <div className="mt-5 flex h-48 items-end justify-between gap-2 border-b border-slate-100 pb-2 sm:gap-4">
                {weeklySummaries.map(({ date, summary }) => {
                  const total = summary?.totalExpected || 0;
                  return <div key={date.toISOString()} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${format(date, 'EEEE, MMM d')}: ${total} meals`}>
                    <span className="text-[10px] font-semibold text-slate-500 sm:text-xs">{total}</span>
                    <div className="flex h-32 w-full max-w-10 flex-col-reverse overflow-hidden rounded-t-lg bg-slate-50">
                      {Object.keys(mealStyles).map((meal) => <div key={meal} className={mealStyles[meal].color} style={{ height: `${(summary?.[meal]?.eating || 0) / maxChartMeals * 100}%`, minHeight: summary?.[meal]?.eating ? 2 : 0 }} />)}
                    </div>
                    <span className="text-[10px] text-slate-500 sm:text-xs">{format(date, 'EEE')}</span>
                  </div>;
                })}
              </div>
              <p className="mt-3 text-xs text-slate-400">Meal counts use student selections. Monthly contract prices remain fixed.</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">Today’s breakdown</h2><p className="text-sm text-slate-500">Meals expected by service</p></div><span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700"><Utensils size={20} /></span></div>
              <div className="mt-4 space-y-3">{Object.entries(mealStyles).map(([key, meal]) => {
                const count = preparationSummary?.[key]?.eating || 0;
                const pending = preparationSummary?.[key]?.pending || 0;
                const percentage = preparationSummary?.activeStudents ? Math.round(count / preparationSummary.activeStudents * 100) : 0;
                return <div key={key} className={`rounded-xl p-3 ${meal.soft}`}><div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-2 text-sm font-semibold"><meal.icon size={16} />{meal.label}</span><span className="text-lg font-bold">{count}<span className="ml-1 text-xs font-medium opacity-70">meals</span></span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80"><div className={`h-full rounded-full ${meal.color}`} style={{ width: `${percentage}%` }} /></div><p className="mt-1.5 text-xs opacity-75">{pending} selections pending · {percentage}% of active students</p></div>;
              })}</div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="text-sm font-semibold text-slate-600">Total expected</span><span className="text-xl font-bold text-slate-900">{preparationSummary?.totalExpected || 0}</span></div>
            </section>
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><h2 className="text-lg font-bold text-slate-900">Student attendance</h2><p className="text-sm text-slate-500">Check meal selections and current status</p></div><div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2"><label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={attendanceSearch} onChange={(event) => setAttendanceSearch(event.target.value)} placeholder="Search students" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label><input aria-label="Attendance date" type="date" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></div></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Student</th>{Object.values(mealStyles).map((meal) => <th key={meal.label} className="px-4 py-3">{meal.label}</th>)}<th className="px-4 py-3">Submitted</th></tr></thead><tbody className="divide-y divide-slate-100">{attendanceRows.slice(0, 8).map((row) => <tr key={row.customer._id} className="hover:bg-slate-50/70"><td className="px-5 py-3"><p className="text-sm font-semibold text-slate-800">{row.customer.name}</p><p className="text-xs text-slate-400">{row.customer.customerId}</p></td>{['breakfast', 'lunch', 'dinner'].map((meal) => <td key={meal} className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${badgeClass(row.selection[meal])}`}>{badgeLabel(row.selection[meal])}</span></td>)}<td className="px-4 py-3 text-sm text-slate-500">{row.selection.submitted ? 'Yes' : 'No'}</td></tr>)}</tbody></table></div>
            {attendanceLoading && <p className="p-5 text-center text-sm text-slate-500">Updating attendance…</p>}
            {!attendanceLoading && !attendanceRows.length && <p className="p-8 text-center text-sm text-slate-500">No active students found for this date.</p>}
            <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><span className="text-xs text-slate-500">Showing {Math.min(attendanceRows.length, 8)} of {attendanceRows.length} students</span><a href="/meal-attendance" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900">Open attendance <ArrowRight size={15} /></a></div>
          </section>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Add customer', href: '/customers', icon: Users },
              { label: 'New contract', href: '/contracts', icon: FileText },
              { label: 'Record payment', href: '/payments', icon: CreditCard },
              { label: 'Notifications', href: '/notifications', icon: Bell },
            ].map((action) => <a key={action.href} href={action.href} className="group rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"><action.icon className="mx-auto text-indigo-600 transition group-hover:scale-110" size={22} /><span className="mt-2 block text-xs font-semibold text-slate-700 sm:text-sm">{action.label}</span></a>)}
          </div>
        </>
      )}
    </div>
  );
}
