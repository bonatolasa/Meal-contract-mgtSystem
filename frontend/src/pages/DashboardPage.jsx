import { useEffect, useState } from 'react';
import {
  getCustomers, getContracts, getTodayStats, getOutstandingPayments, getUnreadNotifications, getPayments,
  getMyCustomer, getMyContracts, getMyMealSelectionHistory, getMyPayments, getMealSummary, getUsers, getMealAttendance,
} from '../services/api';
import { Users, FileText, Utensils, CreditCard, Bell, TrendingUp, Calendar, DollarSign, ShieldCheck, Search, ArrowRight, Coffee, Sun, Moon, Activity, Wallet, ClipboardList, Soup } from 'lucide-react';
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
    const activeContract = studentData.contracts.find((contract) => contract.status === 'Active') || studentData.contracts[0];
    const due = studentData.contracts.reduce((sum, contract) => sum + (Number(contract.remainingBalance) || 0), 0);
    const paid = studentData.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const meals = studentData.meals.reduce((sum, item) => sum + Number(item.breakfast === 'EATING') + Number(item.lunch === 'EATING') + Number(item.dinner === 'EATING'), 0);
    return (
      <section className="mx-auto max-w-[1500px] pb-8 text-[#28271f]">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Student account</p><h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"><Utensils className="text-indigo-600" /> Welcome, {user.name?.split(' ')[0]}</h1><p className="mt-1 text-slate-500">Your contract, meal plan, and account activity at a glance.</p></div><a href="/student/meals" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">Plan today’s meals <ArrowRight size={16} /></a></header>

        {loading ? <div className="grid min-h-52 place-items-center bg-[#fffdf8] text-sm text-[#777467]">Loading your account…</div> : !studentData.customer ? <div className="border-l-4 border-[#d79b50] bg-[#fff8e9] p-5 text-sm text-[#78552c]">No customer profile is linked yet. Please contact the restaurant owner.</div> : <>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-md sm:p-8"><div className="absolute -right-12 -top-16 h-56 w-56 rounded-full border-[28px] border-white/[0.08]"/><div className="relative flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Your monthly plan</p><h2 className="mt-3 text-2xl font-bold">{activeContract?.mealPackage?.name || 'Meal contract'}</h2></div><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{activeContract?.status || 'No contract'}</span></div><div className="relative mt-7 grid grid-cols-2 gap-4 border-t border-white/20 pt-5 sm:grid-cols-3"><div><p className="text-xs text-white/70">Monthly price</p><p className="mt-1 text-lg font-semibold">ETB {Number(activeContract?.monthlyPrice || 0).toLocaleString()}</p></div><div><p className="text-xs text-white/70">Valid through</p><p className="mt-1 text-sm font-semibold">{activeContract?.endDate ? format(new Date(activeContract.endDate), 'MMM d, yyyy') : '—'}</p></div><div className="col-span-2 sm:col-span-1"><p className="text-xs text-white/70">Payment status</p><p className="mt-1 text-sm font-semibold">{activeContract?.paymentStatus || '—'}</p></div></div></article>
            <article className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><span className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><Wallet size={20} /></span><span className="text-xs font-semibold text-slate-500">Account balance</span></div><div className="mt-5"><p className="text-3xl font-bold text-slate-900">ETB {due.toLocaleString()}</p><p className="mt-1 text-sm text-slate-500">Outstanding balance</p></div><div className="mt-5 flex justify-between border-t border-slate-100 pt-4 text-sm"><span className="text-slate-500">Paid to date</span><span className="font-semibold text-emerald-700">ETB {paid.toLocaleString()}</span></div></article>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">{[['Meals selected', meals, Utensils], ['Payments recorded', studentData.payments.length, CreditCard], ['Student account', studentData.customer.customerId || user.email, Calendar]].map(([label, value, Icon]) => <article key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><Icon size={18} /></span><div><p className="text-xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500">{label}</p></div></article>)}</div>

          <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-end justify-between border-b border-slate-100 px-4 py-3 sm:px-5"><div><h2 className="font-bold text-slate-900">Recent meal plans</h2><p className="text-xs text-slate-500">Your latest submitted selections</p></div><a href="/student/meals" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700">Open planner <ArrowRight size={14} /></a></div>
          {studentData.meals.length ? <div className="divide-y divide-slate-100">{studentData.meals.slice(0, 5).map((item) => { const planned = ['breakfast', 'lunch', 'dinner'].filter((meal) => item[meal] === 'EATING'); const skipped = ['breakfast', 'lunch', 'dinner'].filter((meal) => item[meal] === 'NOT_EATING').length; return <div key={item._id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex items-center gap-3"><span className="text-xs font-semibold text-slate-600">{item.date}</span><span className="h-1 w-1 rounded-full bg-slate-300"/><span className="text-xs text-slate-500">{planned.length ? planned.map((meal) => meal[0].toUpperCase() + meal.slice(1)).join(', ') : skipped ? 'No meals planned' : 'No choices submitted'}</span></div><span className="text-xs font-semibold text-emerald-700">{planned.length} planned · {skipped} skipped</span></div>; })}</div> : <div className="py-7 text-center text-sm text-slate-500">Your meal selections will show here after you plan a day.</div>}</div>
        </>}
      </section>
    );
  }

  if (user?.role === 'employee') {
    return (
      <section className="mx-auto max-w-6xl pb-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Restaurant operations</p><h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"><Utensils className="text-indigo-600" /> Employee Dashboard</h1><p className="mt-1 text-slate-500">Your service activity and quick actions.</p></div><p className="text-sm text-slate-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p></div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="relative flex min-h-64 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-md"><div className="absolute -right-8 -top-10 h-40 w-40 rounded-full border-[20px] border-white/[0.08]"/><div className="relative flex items-center justify-between"><span className="text-xs font-semibold text-white/75">Meals served today</span><span className="rounded-xl bg-white/15 p-3"><Utensils size={20} /></span></div><div className="relative"><p className="text-5xl font-bold">{loading ? '…' : stats.todayMeals}</p><p className="mt-2 text-sm text-white/75">Confirmed meal service records</p></div></div>
          <a href="/meal-serving" className="group flex min-h-64 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><span className="inline-flex self-start rounded-xl bg-indigo-50 p-3 text-indigo-700"><Utensils size={22} /></span><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-600">Next action</p><h2 className="mt-2 text-xl font-bold text-slate-900">Confirm meal serving</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">Check a student’s selection and record served meals or no-shows.</p></div><span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700">Open serving list <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span></a>
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
      <section className="mx-auto max-w-6xl pb-8">
        <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">System administration</p><h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"><ShieldCheck className="text-indigo-600" /> Admin Dashboard</h1><p className="mt-1 text-slate-500">Manage system accounts and access.</p></div>
        <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-4">
          {['admin', 'owner', 'employee', 'student'].map((role, index) => { const icons = [ShieldCheck, Users, ClipboardList, Utensils]; const Icon = icons[index]; const themes = ['from-blue-600 to-indigo-600', 'from-indigo-600 to-violet-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-500']; return <div key={role} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${themes[index]} p-5 text-white shadow-md`}><Icon size={18} className="text-white/80" /><p className="mt-4 text-3xl font-bold">{loading ? '…' : counts[role] || 0}</p><p className="text-xs text-white/80 capitalize">{role} accounts</p></div>; })}
        </div>
        <a href="/users" className="group mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"><Users size={18} /> Manage staff and accounts <ArrowRight size={16} className="transition group-hover:translate-x-1" /></a>
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
    { label: 'Customers', value: stats.totalCustomers, hint: `${stats.activeContracts} active contracts`, icon: Users },
    { label: 'Meals expected today', value: todayMeals, hint: `${preparationSummary?.activeStudents || 0} active students`, icon: Utensils },
    { label: 'Money still due', value: `ETB ${stats.outstandingAmount.toLocaleString()}`, hint: `${stats.unreadNotifications} unread notifications`, icon: DollarSign },
  ];
  const maxChartMeals = Math.max(1, ...weeklySummaries.map(({ summary }) => summary?.totalExpected || 0));
  const mealStyles = {
    breakfast: { label: 'Breakfast', icon: Coffee, color: 'bg-amber-500', soft: 'bg-amber-50 text-amber-800' },
    lunch: { label: 'Lunch', icon: Sun, color: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-800' },
    dinner: { label: 'Dinner', icon: Moon, color: 'bg-violet-500', soft: 'bg-violet-50 text-violet-800' },
  };
  const badgeClass = (status) => status === 'EATING' ? 'bg-[#e8eddf] text-[#526d43] ring-[#526d43]/20' : status === 'NOT_EATING' ? 'bg-[#f1e8df] text-[#946b51] ring-[#946b51]/20' : 'bg-[#eeece4] text-[#777467] ring-[#777467]/20';
  const badgeLabel = (status) => status === 'EATING' ? 'Eating' : status === 'NOT_EATING' ? 'Not eating' : 'Pending';

  return (
    <div className="mx-auto max-w-[1500px] pb-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Restaurant operations</p><h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"><Soup className="text-indigo-600" /> Hello, {user?.name?.split(' ')[0]}</h1><p className="mt-1 text-slate-500">A quick look at today and your accounts.</p></div><div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm"><Calendar size={16} className="mr-2 inline text-indigo-600" />{format(new Date(), 'EEEE, MMMM d')}</div></div>

      {loading ? (
        <div className="text-center py-12">Loading dashboard...</div>
      ) : (
        <>
        <div className="grid grid-cols-1 min-[520px]:grid-cols-3 gap-4 mb-6">
            {summaryCards.map((card, index) => (
              <article key={card.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${['from-blue-600 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-500'][index]} p-5 text-white shadow-md`}>
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-sm font-medium text-white/80">{card.label}</p><p className="mt-3 truncate text-3xl font-bold">{loading ? '…' : card.value}</p><p className="mt-2 truncate text-xs text-white/75">{card.hint}</p></div><span className="rounded-xl bg-white/15 p-3"><card.icon size={21} /></span></div>
              </article>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.85fr] gap-5 mb-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-bold text-slate-900">Meal count this week</h2><p className="text-sm text-slate-500">Expected meals each day</p></div><div className="flex flex-wrap gap-3 text-xs font-medium text-slate-600">{Object.entries(mealStyles).map(([key, meal]) => <span key={key} className="inline-flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-full ${meal.color}`} />{meal.label}</span>)}</div></div>
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

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
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
