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
        <header className="mb-7 border-b border-[#d9d5ca] pb-6"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8c5d3d]"><Utensils size={15} /> Table & Thyme <span className="text-[#c5bdae]">/</span> My account</div><div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-[#8a877c]">{format(new Date(), 'EEEE, MMMM d')}</p><h1 className="mt-1 font-serif text-4xl font-medium tracking-tight sm:text-5xl">Welcome, {user.name?.split(' ')[0]}.</h1><p className="mt-3 text-sm text-[#777467]">A little overview of your table and account.</p></div><a href="/student/meals" className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#526d43] px-5 text-sm font-semibold text-white transition hover:bg-[#435a37]">Plan today’s meals <ArrowRight size={16} /></a></div></header>

        {loading ? <div className="grid min-h-52 place-items-center bg-[#fffdf8] text-sm text-[#777467]">Loading your account…</div> : !studentData.customer ? <div className="border-l-4 border-[#d79b50] bg-[#fff8e9] p-5 text-sm text-[#78552c]">No customer profile is linked yet. Please contact the restaurant owner.</div> : <>
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="relative overflow-hidden bg-[#28271f] p-6 text-white sm:p-8"><div className="absolute -right-12 -top-16 h-56 w-56 rounded-full border-[28px] border-white/[0.04]"/><div className="relative flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d99a6e]">Your monthly plan</p><h2 className="mt-3 font-serif text-3xl">{activeContract?.mealPackage?.name || 'Meal contract'}</h2></div><span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${activeContract?.status === 'Active' ? 'bg-[#526d43] text-white' : 'bg-white/10 text-white/70'}`}>{activeContract?.status || 'No contract'}</span></div><div className="relative mt-7 grid grid-cols-2 gap-4 border-t border-white/15 pt-5 sm:grid-cols-3"><div><p className="text-[10px] uppercase tracking-wider text-white/50">Monthly price</p><p className="mt-1 text-lg font-semibold">ETB {Number(activeContract?.monthlyPrice || 0).toLocaleString()}</p></div><div><p className="text-[10px] uppercase tracking-wider text-white/50">Valid through</p><p className="mt-1 text-sm font-semibold">{activeContract?.endDate ? format(new Date(activeContract.endDate), 'MMM d, yyyy') : '—'}</p></div><div className="col-span-2 sm:col-span-1"><p className="text-[10px] uppercase tracking-wider text-white/50">Payment status</p><p className="mt-1 text-sm font-semibold">{activeContract?.paymentStatus || '—'}</p></div></div></article>
            <article className="flex flex-col justify-between border border-[#d9d5ca] bg-[#fffdf8] p-6"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#f2e9df] text-[#a46742]"><Wallet size={20} /></span><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8a877c]">Account balance</span></div><div className="mt-5"><p className="font-serif text-3xl">ETB {due.toLocaleString()}</p><p className="mt-1 text-xs text-[#8a877c]">Outstanding balance</p></div><div className="mt-5 flex justify-between border-t border-[#e8e4da] pt-4 text-xs"><span className="text-[#8a877c]">Paid to date</span><span className="font-semibold text-[#526d43]">ETB {paid.toLocaleString()}</span></div></article>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3"><article className="flex items-center gap-4 border border-[#d9d5ca] bg-[#fffdf8] p-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8eddf] text-[#58734f]"><Utensils size={18} /></span><div><p className="text-2xl font-semibold">{meals}</p><p className="text-xs text-[#8a877c]">Meals selected</p></div></article><article className="flex items-center gap-4 border border-[#d9d5ca] bg-[#fffdf8] p-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#f1e8df] text-[#a46742]"><CreditCard size={18} /></span><div><p className="text-2xl font-semibold">{studentData.payments.length}</p><p className="text-xs text-[#8a877c]">Payments recorded</p></div></article><article className="flex items-center gap-4 border border-[#d9d5ca] bg-[#fffdf8] p-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#eeece4] text-[#777467]"><Calendar size={18} /></span><div><p className="text-sm font-semibold">{studentData.customer.customerId || user.email}</p><p className="text-xs text-[#8a877c]">Student account</p></div></article></div>

          <div className="mt-9 flex items-end justify-between border-b border-[#d9d5ca] pb-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a17a52]">From your table</p><h2 className="mt-1 font-serif text-2xl">Recent meal plans</h2></div><a href="/student/meals" className="inline-flex items-center gap-1 text-xs font-semibold text-[#526d43] hover:text-[#34482c]">Open planner <ArrowRight size={14} /></a></div>
          {studentData.meals.length ? <div className="mt-3 divide-y divide-[#e8e4da] border-y border-[#d9d5ca]">{studentData.meals.slice(0, 5).map((item) => { const planned = ['breakfast', 'lunch', 'dinner'].filter((meal) => item[meal] === 'EATING'); const skipped = ['breakfast', 'lunch', 'dinner'].filter((meal) => item[meal] === 'NOT_EATING').length; return <div key={item._id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="text-xs font-semibold text-[#8a877c]">{item.date}</span><span className="h-1 w-1 rounded-full bg-[#c5bdae]"/><span className="text-xs text-[#777467]">{planned.length ? planned.map((meal) => meal[0].toUpperCase() + meal.slice(1)).join(', ') : skipped ? 'No meals planned' : 'No choices submitted'}</span></div><span className="text-[10px] font-bold uppercase tracking-wider text-[#58734f]">{planned.length} planned · {skipped} skipped</span></div>; })}</div> : <div className="mt-3 border-y border-[#d9d5ca] py-7 text-center text-sm text-[#8a877c]">Your meal selections will show here after you plan a day.</div>}
        </>}
      </section>
    );
  }

  if (user?.role === 'employee') {
    return (
      <section className="mx-auto max-w-[1500px] pb-8 text-[#28271f]">
        <header className="mb-8 border-b border-[#d9d5ca] pb-6"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8c5d3d]"><Utensils size={15} /> Table & Thyme <span className="text-[#c5bdae]">/</span> Service desk</div><div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-[#8a877c]">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p><h1 className="mt-1 font-serif text-4xl font-medium tracking-tight sm:text-5xl">Good day, {user.name?.split(' ')[0]}.</h1><p className="mt-3 text-sm text-[#777467]">Your service activity and quick actions.</p></div><span className="inline-flex items-center gap-2 self-start rounded-full border border-[#d9d5ca] bg-[#fffdf8] px-4 py-2 text-xs font-semibold text-[#777467] sm:self-auto"><ClipboardList size={15} /> Employee workspace</span></div></header>
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="flex min-h-64 flex-col justify-between bg-[#28271f] p-7 text-white"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d99a6e]">Today’s service</span><span className="grid h-11 w-11 place-items-center rounded-full bg-white/10"><Utensils size={20} /></span></div><div><p className="font-serif text-6xl">{loading ? '…' : stats.todayMeals}</p><p className="mt-2 text-sm text-white/65">Meals served today</p></div><p className="border-t border-white/15 pt-4 text-xs text-white/50">Confirmed meal service records</p></div>
          <a href="/meal-serving" className="group flex min-h-64 flex-col justify-between border border-[#d9d5ca] bg-[#fffdf8] p-7 transition hover:border-[#a9b398] hover:bg-white"><span className="grid h-12 w-12 place-items-center rounded-full bg-[#e8eddf] text-[#58734f]"><Utensils size={22} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a17a52]">Next action</p><h2 className="mt-2 font-serif text-3xl">Confirm meal serving</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#777467]">Check a student’s selection and record served meals or no-shows.</p></div><span className="inline-flex items-center gap-2 text-sm font-semibold text-[#526d43]">Open serving list <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span></a>
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
      <section className="mx-auto max-w-[1500px] pb-8 text-[#28271f]">
        <header className="mb-8 border-b border-[#d9d5ca] pb-6"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8c5d3d]"><ShieldCheck size={15} /> Table & Thyme <span className="text-[#c5bdae]">/</span> Administration</div><div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-[#8a877c]">System overview</p><h1 className="mt-1 font-serif text-4xl font-medium tracking-tight sm:text-5xl">Account directory</h1><p className="mt-3 text-sm text-[#777467]">Manage access across your restaurant workspace.</p></div><span className="inline-flex items-center gap-2 self-start rounded-full border border-[#d9d5ca] bg-[#fffdf8] px-4 py-2 text-xs font-semibold text-[#777467] sm:self-auto"><ShieldCheck size={15} /> Administrator</span></div></header>
        <div className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-4">
          {['admin', 'owner', 'employee', 'student'].map((role, index) => { const icons = [ShieldCheck, Users, ClipboardList, Utensils]; const Icon = icons[index]; return <div key={role} className="border border-[#d9d5ca] bg-[#fffdf8] p-5"><div className="flex items-start justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8a877c]">{role} accounts</p><span className="grid h-9 w-9 place-items-center rounded-full bg-[#f1e8df] text-[#a46742]"><Icon size={17} /></span></div><p className="mt-5 font-serif text-4xl">{loading ? '…' : counts[role] || 0}</p><p className="mt-1 text-xs text-[#8a877c]">Registered accounts</p></div>; })}
        </div>
        <a href="/users" className="group mt-5 flex items-center justify-between border border-[#d9d5ca] bg-[#28271f] p-5 text-white transition hover:bg-[#39372d] sm:px-6"><span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-white/10"><Users size={18} /></span><span><span className="block text-sm font-semibold">Manage staff and accounts</span><span className="mt-1 block text-xs text-white/55">Create accounts and review access</span></span></span><ArrowRight size={18} className="transition group-hover:translate-x-1" /></a>
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
    <div className="mx-auto max-w-[1500px] pb-8 text-[#28271f]">
      <header className="mb-7 border-b border-[#d9d5ca] pb-6"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8c5d3d]"><Soup size={15} /> Table & Thyme <span className="text-[#c5bdae]">/</span> Restaurant overview</div><div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm text-[#8a877c]">{format(new Date(), 'EEEE, MMMM d')}</p><h1 className="mt-1 font-serif text-4xl font-medium tracking-tight sm:text-5xl">Good morning, {user?.name?.split(' ')[0]}.</h1><p className="mt-3 text-sm text-[#777467]">A clear view of today’s service and your restaurant.</p></div><a href="/meal-attendance" className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#d9d5ca] bg-[#fffdf8] px-4 text-xs font-semibold text-[#526d43] transition hover:border-[#a9b398]"><Calendar size={15} /> Today’s attendance <ArrowRight size={14} /></a></div></header>

      {loading ? (
        <div className="text-center py-12">Loading dashboard...</div>
      ) : (
        <>
        <div className="grid grid-cols-1 min-[520px]:grid-cols-3 gap-4 mb-6">
            {summaryCards.map((card, index) => (
              <article key={card.label} className="relative overflow-hidden border border-[#d9d5ca] bg-[#fffdf8] p-5">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#8a877c]">{card.label}</p><p className="mt-3 truncate font-serif text-3xl text-[#28271f]">{loading ? '…' : card.value}</p><p className="mt-2 truncate text-xs text-[#8a877c]">{card.hint}</p></div><span className={`grid h-10 w-10 place-items-center rounded-full ${['bg-[#f1e8df] text-[#a46742]','bg-[#e8eddf] text-[#58734f]','bg-[#f3ead8] text-[#a17a42]'][index]}`}><card.icon size={19} /></span></div>
              </article>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.85fr] gap-5 mb-6">
            <section className="border border-[#d9d5ca] bg-[#fffdf8] p-4 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-serif text-2xl text-[#28271f]">Meal count this week</h2><p className="text-xs text-[#8a877c]">Expected meals each day</p></div><div className="flex flex-wrap gap-3 text-[10px] font-semibold uppercase tracking-wider text-[#777467]">{Object.entries(mealStyles).map(([key, meal]) => <span key={key} className="inline-flex items-center gap-1.5"><i className={`h-2.5 w-2.5 rounded-full ${meal.color}`} />{meal.label}</span>)}</div></div>
              <div className="mt-5 flex h-48 items-end justify-between gap-2 border-b border-[#e8e4da] pb-2 sm:gap-4">
                {weeklySummaries.map(({ date, summary }) => {
                  const total = summary?.totalExpected || 0;
                  return <div key={date.toISOString()} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${format(date, 'EEEE, MMM d')}: ${total} meals`}>
                    <span className="text-[10px] font-semibold text-[#777467] sm:text-xs">{total}</span>
                    <div className="flex h-32 w-full max-w-10 flex-col-reverse overflow-hidden rounded-t-sm bg-[#f0eee7]">
                      {Object.keys(mealStyles).map((meal) => <div key={meal} className={mealStyles[meal].color} style={{ height: `${(summary?.[meal]?.eating || 0) / maxChartMeals * 100}%`, minHeight: summary?.[meal]?.eating ? 2 : 0 }} />)}
                    </div>
                    <span className="text-[10px] text-[#777467] sm:text-xs">{format(date, 'EEE')}</span>
                  </div>;
                })}
              </div>
              <p className="mt-3 text-xs text-[#969183]">Meal counts use student selections. Monthly contract prices remain fixed.</p>
            </section>

            <section className="border border-[#d9d5ca] bg-[#fffdf8] p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3"><div><h2 className="font-serif text-2xl text-[#28271f]">Today’s breakdown</h2><p className="text-xs text-[#8a877c]">Meals expected by service</p></div><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8eddf] text-[#58734f]"><Utensils size={18} /></span></div>
              <div className="mt-4 space-y-3">{Object.entries(mealStyles).map(([key, meal]) => {
                const count = preparationSummary?.[key]?.eating || 0;
                const pending = preparationSummary?.[key]?.pending || 0;
                const percentage = preparationSummary?.activeStudents ? Math.round(count / preparationSummary.activeStudents * 100) : 0;
                return <div key={key} className={`border-l-2 p-3 ${meal.soft}`}><div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-2 text-sm font-semibold"><meal.icon size={16} />{meal.label}</span><span className="font-serif text-xl">{count}<span className="ml-1 text-[10px] font-sans font-medium opacity-70">meals</span></span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-white/80"><div className={`h-full ${meal.color}`} style={{ width: `${percentage}%` }} /></div><p className="mt-1.5 text-[10px] opacity-75">{pending} pending · {percentage}% of active students</p></div>;
              })}</div>
              <div className="mt-4 flex items-center justify-between border-t border-[#e8e4da] pt-3"><span className="text-xs font-semibold uppercase tracking-wider text-[#777467]">Total expected</span><span className="font-serif text-2xl">{preparationSummary?.totalExpected || 0}</span></div>
            </section>
          </div>

          <section className="overflow-hidden border border-[#d9d5ca] bg-[#fffdf8]">
            <div className="flex flex-col gap-3 border-b border-[#e8e4da] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><h2 className="font-serif text-2xl text-[#28271f]">Student attendance</h2><p className="text-xs text-[#8a877c]">Check meal selections and current status</p></div><div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2"><label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#969183]" /><input value={attendanceSearch} onChange={(event) => setAttendanceSearch(event.target.value)} placeholder="Search students" className="w-full border border-[#d9d5ca] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#879976] focus:ring-2 focus:ring-[#e8eddf]" /></label><input aria-label="Attendance date" type="date" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} className="border border-[#d9d5ca] bg-white px-3 py-2 text-sm text-[#5d5a4f] outline-none focus:border-[#879976] focus:ring-2 focus:ring-[#e8eddf]" /></div></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-[#f3f1eb] text-[10px] uppercase tracking-wider text-[#777467]"><tr><th className="px-5 py-3">Student</th>{Object.values(mealStyles).map((meal) => <th key={meal.label} className="px-4 py-3">{meal.label}</th>)}<th className="px-4 py-3">Submitted</th></tr></thead><tbody className="divide-y divide-[#e8e4da]">{attendanceRows.slice(0, 8).map((row) => <tr key={row.customer._id} className="hover:bg-[#f8f6f0]"><td className="px-5 py-3"><p className="text-sm font-semibold text-[#39372f]">{row.customer.name}</p><p className="text-xs text-[#969183]">{row.customer.customerId}</p></td>{['breakfast', 'lunch', 'dinner'].map((meal) => <td key={meal} className="px-4 py-3"><span className={`inline-flex px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${badgeClass(row.selection[meal])}`}>{badgeLabel(row.selection[meal])}</span></td>)}<td className="px-4 py-3 text-xs text-[#777467]">{row.selection.submitted ? 'Yes' : 'No'}</td></tr>)}</tbody></table></div>
            {attendanceLoading && <p className="p-5 text-center text-sm text-slate-500">Updating attendance…</p>}
            {!attendanceLoading && !attendanceRows.length && <p className="p-8 text-center text-sm text-slate-500">No active students found for this date.</p>}
            <div className="flex flex-col gap-2 border-t border-[#e8e4da] bg-[#f8f6f0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"><span className="text-xs text-[#8a877c]">Showing {Math.min(attendanceRows.length, 8)} of {attendanceRows.length} students</span><a href="/meal-attendance" className="inline-flex items-center gap-1 text-xs font-semibold text-[#526d43] hover:text-[#34482c]">Open attendance <ArrowRight size={15} /></a></div>
          </section>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Add customer', href: '/customers', icon: Users },
              { label: 'New contract', href: '/contracts', icon: FileText },
              { label: 'Record payment', href: '/payments', icon: CreditCard },
              { label: 'Notifications', href: '/notifications', icon: Bell },
            ].map((action) => <a key={action.href} href={action.href} className="group border border-[#d9d5ca] bg-[#fffdf8] p-4 text-center transition hover:border-[#a9b398] hover:bg-white"><action.icon className="mx-auto text-[#8c5d3d] transition group-hover:scale-110" size={21} /><span className="mt-2 block text-xs font-semibold text-[#5d5a4f] sm:text-sm">{action.label}</span></a>)}
          </div>
        </>
      )}
    </div>
  );
}
