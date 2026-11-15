import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { CalendarDays, RefreshCw, Utensils, Search, Users, Coffee, Sun, Moon, CheckCircle2 } from 'lucide-react';
import { getMealAttendance, getMealSummary, overrideMealSelection, overrideCustomerMealSelection } from '../services/api';

const mealTypes = ['breakfast', 'lunch', 'dinner'];

export default function MealAttendancePage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ name: '', mealType: '', status: '' });
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

  useEffect(() => { load(); }, [date, filters.name, filters.mealType, filters.status]);

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

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">Restaurant operations</p><h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2"><Utensils className="text-indigo-600" /> Daily Meal Attendance</h1><p className="text-slate-500 mt-1">Student meal selections and preparation quantities</p></div>
        <label className="text-sm font-semibold text-slate-600 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"><CalendarDays size={18} className="text-indigo-600" /><input aria-label="Attendance date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="min-w-0 bg-transparent outline-none" /></label>
      </div>

      {summary && <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {summaryCards.map((card) => <article key={card.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.theme} p-4 text-white shadow-md`}><card.icon size={18} className="text-white/80" /><p className="mt-3 text-2xl font-bold">{card.value}</p><p className="text-xs text-white/80">{card.label}</p></article>)}
        <article className="col-span-2 xl:col-span-1 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 sm:col-span-2 xl:col-span-1"><p className="text-sm font-semibold text-indigo-700">Total meals to prepare</p><p className="mt-1 text-3xl font-bold text-indigo-950">{summary.totalExpected}</p><p className="mt-1 text-xs text-indigo-600">{summary.activeStudents} active students</p></article>
      </div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 mb-4 shadow-sm">
        <div className="mb-3"><h2 className="font-bold text-slate-900">Find a student</h2><p className="text-xs text-slate-500">Filter by name, meal, or selection status</p></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={filters.name} onChange={handleFilterName} placeholder="Search student name" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></label>
          <select aria-label="Filter by meal" value={filters.mealType} onChange={(event) => setFilters({ ...filters, mealType: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"><option value="">All meals</option>{mealTypes.map((meal) => <option key={meal} value={meal}>{meal}</option>)}</select>
          <select aria-label="Filter by status" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"><option value="">All selections</option><option value="EATING">Eating</option><option value="NOT_EATING">Not eating</option><option value="PENDING">Not submitted</option></select>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5"><div><h2 className="font-bold text-slate-900">Student meal status</h2><p className="text-xs text-slate-500">{format(new Date(`${date}T00:00:00`), 'EEEE, MMMM d, yyyy')}</p></div><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">{rows.length} students</span></div>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[850px] text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Student</th>{mealTypes.map((meal) => <th className="px-4 py-3 capitalize" key={meal}>{meal}</th>)}<th className="px-4 py-3">Submitted</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.customer._id} className="hover:bg-slate-50/70">
            <td className="px-5 py-4"><p className="font-semibold text-slate-800">{row.customer.name}</p><p className="text-xs text-slate-400">{row.customer.customerId}</p></td>
            {mealTypes.map((meal) => <td key={meal} className="px-4 py-3"><div className="flex flex-col items-start gap-1.5"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle(row.selection[meal])}`}>{statusLabel(row.selection[meal])}</span>{row.selection[`${meal}Menu`]?.menuItem?.nameEnglish && <span className="text-xs text-slate-500">{row.selection[`${meal}Menu`].menuItem.nameEnglish}</span>}{row.selection._id && <select aria-label={`Correct ${meal} selection for ${row.customer.name}`} value={row.selection[meal]} onChange={(event) => applyOverride(row, meal, event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"><option value="EATING">Eating</option><option value="NOT_EATING">Not eating</option><option value="PENDING">Not submitted</option></select>}</div></td>)}
            <td className="px-4 py-3 text-sm text-slate-500">{row.selection.submitted ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 size={15} /> Yes</span> : 'No'}</td>
          </tr>)}</tbody>
        </table></div>
        <div className="divide-y divide-slate-100 md:hidden">{rows.map((row) => <article key={row.customer._id} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{row.customer.name}</p><p className="text-xs text-slate-400">{row.customer.customerId}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.selection.submitted ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{row.selection.submitted ? 'Submitted' : 'Pending'}</span></div><div className="mt-3 grid grid-cols-1 min-[400px]:grid-cols-3 gap-2">{mealTypes.map((meal) => <div key={meal} className="rounded-xl bg-slate-50 p-2.5"><p className="text-[11px] font-semibold uppercase text-slate-500">{meal}</p><span className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle(row.selection[meal])}`}>{statusLabel(row.selection[meal])}</span>{row.selection[`${meal}Menu`]?.menuItem?.nameEnglish && <p className="mt-1 truncate text-xs text-slate-500">{row.selection[`${meal}Menu`].menuItem.nameEnglish}</p>}{row.selection._id && <select aria-label={`Correct ${meal} selection for ${row.customer.name}`} value={row.selection[meal]} onChange={(event) => applyOverride(row, meal, event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs"><option value="EATING">Eating</option><option value="NOT_EATING">Not eating</option><option value="PENDING">Not submitted</option></select>}</div>)}</div></article>)}</div>
        {!loading && !rows.length && <p className="text-center py-8 text-gray-500">No active students match these filters.</p>}
        {loading && <p className="text-center py-8 text-gray-500"><RefreshCw className="inline mr-2 animate-spin" size={16} />Loading attendance…</p>}
      </section>
    </div>
  );
}
