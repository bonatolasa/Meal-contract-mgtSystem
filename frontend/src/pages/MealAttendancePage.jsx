import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { CalendarDays, RefreshCw, Utensils, Search, Users, Coffee, Sun, Moon, CheckCircle2, Filter, ClipboardList, ArrowUpRight, X, CircleDot } from 'lucide-react';
import { getMealAttendance, getMealSummary, overrideMealSelection, overrideCustomerMealSelection } from '../services/api';

const mealTypes = ['breakfast', 'lunch', 'dinner'];

export default function MealAttendancePage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ name: '', mealType: '', status: '', customerType: '', submitted: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [summaryRes, rowsRes] = await Promise.all([getMealSummary(date), getMealAttendance(date, filters)]);
      setSummary(summaryRes.data);
      setRows(rowsRes.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load meal attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date, filters.name, filters.mealType, filters.status, filters.customerType, filters.submitted]);

  const handleFilterName = (event) => {
    const name = event.target.value;
    setFilters((current) => ({ ...current, name }));
  };

  const applyOverride = async (row, mealType, status) => {
    try {
      if (row.selection._id) await overrideMealSelection(row.selection._id, { [mealType]: status, note: 'Owner correction' });
      else await overrideCustomerMealSelection(row.customer._id, date, { [mealType]: status, note: 'Owner authorized late selection' });
      toast.success(`${mealType} selection updated`);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update selection');
    }
  };

  const statusLabel = (status) => status === 'EATING' ? 'Eating' : status === 'NOT_EATING' ? 'Not eating' : 'Not submitted';
  const statusStyle = (status) => status === 'EATING' ? 'text-emerald-700 bg-emerald-50 ring-emerald-600/20' : status === 'NOT_EATING' ? 'text-rose-700 bg-rose-50 ring-rose-600/20' : 'text-slate-600 bg-slate-100 ring-slate-500/20';
  const summaryCards = summary ? [
    { label: 'Active students', value: summary.activeStudents, icon: Users, theme: 'from-blue-600 to-indigo-600' },
    { label: 'Breakfast expected', value: summary.breakfast.eating, icon: Coffee, theme: 'from-amber-500 to-orange-500' },
    { label: 'Lunch expected', value: summary.lunch.eating, icon: Sun, theme: 'from-emerald-500 to-teal-600' },
    { label: 'Dinner expected', value: summary.dinner.eating, icon: Moon, theme: 'from-violet-600 to-purple-600' },
  ] : [];
  const submittedCount = rows.filter((row) => row.selection.submitted).length;

  return (
    <div className="mx-auto max-w-[1500px] pb-8">
      <header className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 p-5 text-white shadow-lg sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[30px] border-white/[0.06]" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-100"><ClipboardList size={13} /> Owner operations</p><h1 className="mt-4 flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-3xl"><Utensils className="text-indigo-200" /> Meal service control</h1><p className="mt-2 max-w-xl text-sm text-white/70">Track daily student choices, preparation totals, and update selections when needed.</p></div><label className="flex items-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/75 lg:self-auto"><CalendarDays size={16} className="text-indigo-200" /><input aria-label="Attendance date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="min-w-0 bg-transparent text-sm text-white outline-none [color-scheme:dark]" /></label></div>
        <div className="relative mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-xs text-white/65"><span>{format(new Date(`${date}T00:00:00`), 'EEEE, MMMM d, yyyy')}</span><span className="hidden h-1 w-1 rounded-full bg-white/40 sm:block" /><span>{loading ? 'Updating records…' : `${rows.length} students in view`}</span><span className="hidden h-1 w-1 rounded-full bg-white/40 sm:block" /><span>{loading ? '—' : `${submittedCount} selections submitted`}</span></div>
      </header>

      {summary && <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {summaryCards.map((card) => <article key={card.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.theme} p-4 text-white shadow-md`}><div className="flex items-center justify-between"><card.icon size={18} className="text-white/75" /><ArrowUpRight size={15} className="text-white/50" /></div><p className="mt-3 text-2xl font-bold">{card.value}</p><p className="text-xs text-white/80">{card.label}</p></article>)}
        <article className="col-span-2 flex items-center justify-between rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm sm:col-span-1 xl:col-span-1"><div><p className="text-xs font-semibold text-indigo-700">Meals to prepare</p><p className="mt-1 text-3xl font-bold text-slate-900">{summary.totalExpected}</p><p className="mt-1 text-[11px] text-slate-500">Across {summary.activeStudents} students</p></div><span className="rounded-xl bg-indigo-50 p-3 text-indigo-700"><Utensils size={20} /></span></article>
      </div>}

      <div className="grid items-start gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:sticky xl:top-24"><div className="mb-4 flex items-center gap-2"><span className="rounded-lg bg-indigo-50 p-2 text-indigo-700"><Filter size={16} /></span><div><h2 className="font-bold text-slate-900">Filters</h2><p className="text-[11px] text-slate-500">Narrow the student list</p></div></div><div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-600">Student name<span className="relative mt-1.5 block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={filters.name} onChange={handleFilterName} placeholder="Search students" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm font-normal outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></span></label>
          <label className="block text-xs font-semibold text-slate-600">Meal<select aria-label="Filter by meal" value={filters.mealType} onChange={(event) => setFilters({ ...filters, mealType: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"><option value="">All meals</option>{mealTypes.map((meal) => <option key={meal} value={meal}>{meal[0].toUpperCase() + meal.slice(1)}</option>)}</select></label>
          <label className="block text-xs font-semibold text-slate-600">Selection status<select aria-label="Filter by status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"><option value="">All selections</option><option value="EATING">Eating</option><option value="NOT_EATING">Not eating</option><option value="PENDING">Not submitted</option></select></label>
          <label className="block text-xs font-semibold text-slate-600">Customer type<select aria-label="Filter by customer type" value={filters.customerType} onChange={(event) => setFilters({ ...filters, customerType: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"><option value="">All types</option><option value="student">Student</option><option value="employee">Employee</option><option value="individual">Individual</option></select></label>
          <label className="block text-xs font-semibold text-slate-600">Submission<select aria-label="Filter by submission" value={filters.submitted} onChange={(event) => setFilters({ ...filters, submitted: event.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"><option value="">All submissions</option><option value="true">Submitted</option><option value="false">Not submitted</option></select></label>
          {(filters.name || filters.mealType || filters.status || filters.customerType || filters.submitted) && <button type="button" onClick={() => setFilters({ name: '', mealType: '', status: '', customerType: '', submitted: '' })} className="inline-flex items-center gap-1.5 pt-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900"><X size={14} /> Clear all filters</button>}
        </div><div className="mt-5 border-t border-slate-100 pt-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submission progress</p><div className="mt-2 flex items-center justify-between text-xs"><span className="text-slate-500">Submitted</span><span className="font-semibold text-slate-700">{submittedCount} / {rows.length}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${rows.length ? submittedCount / rows.length * 100 : 0}%` }} /></div></div></aside>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700"><Users size={19} /></span><div><h2 className="font-bold text-slate-900">Student meal status</h2><p className="text-xs text-slate-500">Review choices and make owner corrections</p></div></div><span className="self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 sm:self-auto">{rows.length} students</span></div>
          <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[850px] text-left"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Student</th>{mealTypes.map((meal) => <th className="px-4 py-3 capitalize" key={meal}>{meal}</th>)}<th className="px-4 py-3">Submitted</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.customer._id} className="transition hover:bg-indigo-50/30"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">{row.customer.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><span><span className="block text-sm font-semibold text-slate-800">{row.customer.name}</span><span className="block text-xs text-slate-400">{row.customer.customerId}</span></span></div></td>
              {mealTypes.map((meal) => <td key={meal} className="px-4 py-3"><div className="flex min-w-[130px] flex-col items-start gap-1.5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle(row.selection[meal])}`}>{statusLabel(row.selection[meal])}</span>{row.selection[`${meal}Menu`]?.menuItem?.nameEnglish && <span className="max-w-[150px] truncate text-xs text-slate-500">{row.selection[`${meal}Menu`].menuItem.nameEnglish}</span>}{row.selection._id && <label className="text-[10px] font-medium text-slate-400">Correct status<select aria-label={`Correct ${meal} selection for ${row.customer.name}`} value={row.selection[meal]} onChange={(event) => applyOverride(row, meal, event.target.value)} className="mt-1 block rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"><option value="EATING">Eating</option><option value="NOT_EATING">Not eating</option><option value="PENDING">Not submitted</option></select></label>}</div></td>)}
              <td className="px-4 py-3 text-sm text-slate-500">{row.selection.submitted ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 size={15} /> Yes</span> : <span className="inline-flex items-center gap-1 text-slate-400"><CircleDot size={14} /> No</span>}</td>
            </tr>)}</tbody></table></div>
          <div className="divide-y divide-slate-100 md:hidden">{rows.map((row) => <article key={row.customer._id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700">{row.customer.name?.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</span><div><p className="font-semibold text-slate-900">{row.customer.name}</p><p className="text-xs text-slate-400">{row.customer.customerId}</p></div></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.selection.submitted ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{row.selection.submitted ? 'Submitted' : 'Pending'}</span></div><div className="mt-3 grid grid-cols-1 gap-2 min-[400px]:grid-cols-3">{mealTypes.map((meal) => <div key={meal} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{meal}</p><span className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle(row.selection[meal])}`}>{statusLabel(row.selection[meal])}</span>{row.selection[`${meal}Menu`]?.menuItem?.nameEnglish && <p className="mt-1 truncate text-xs text-slate-500">{row.selection[`${meal}Menu`].menuItem.nameEnglish}</p>}{row.selection._id && <select aria-label={`Correct ${meal} selection for ${row.customer.name}`} value={row.selection[meal]} onChange={(event) => applyOverride(row, meal, event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs"><option value="EATING">Eating</option><option value="NOT_EATING">Not eating</option><option value="PENDING">Not submitted</option></select>}</div>)}</div></article>)}</div>
          {!loading && !rows.length && <div className="grid justify-items-center px-6 py-12 text-center"><span className="rounded-full bg-slate-100 p-3 text-slate-400"><Users size={20} /></span><p className="mt-3 text-sm font-semibold text-slate-700">No students found</p><p className="mt-1 text-xs text-slate-500">Try changing your filters or choose another date.</p></div>}
          {loading && <p className="py-8 text-center text-sm text-slate-500"><RefreshCw className="mr-2 inline animate-spin" size={16} />Loading attendance…</p>}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-500 sm:px-5"><span>{submittedCount} submitted · {rows.length - submittedCount} pending in this view</span><span>{format(new Date(`${date}T00:00:00`), 'MMM d, yyyy')}</span></div>
        </section>
      </div>
    </div>
  );
}
