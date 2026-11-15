import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Check, XCircle, Utensils } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getMealAttendance, getMealServings, getMealServingSummary, recordMealServing } from '../services/api';

const meals = ['breakfast', 'lunch', 'dinner'];

export default function MealServingPage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [rows, setRows] = useState([]);
  const [servings, setServings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [attendanceRes, servingRes, summaryRes] = await Promise.all([getMealAttendance(date), getMealServings(date), getMealServingSummary(date)]);
      setRows(attendanceRes.data || []);
      setServings(servingRes.data || []);
      setSummary(summaryRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load student selections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [date]);

  const servingFor = (selectionId, mealType) => servings.find((item) => (item.selection?._id || item.selection) === selectionId && item.mealType === mealType);

  const record = async (row, mealType, status) => {
    try {
      await recordMealServing(row.selection._id, mealType, status);
      toast.success(status === 'SERVED' ? 'Meal marked as served' : 'No-show recorded');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save serving record');
    }
  };

  const renderMealStatus = (row, meal) => {
    const selected = row.selection[meal] === 'EATING';
    const existing = row.selection._id ? servingFor(row.selection._id, meal) : null;
    if (!selected) return <span className="text-xs text-slate-400">{row.selection[meal] === 'NOT_EATING' ? 'Not eating' : 'No selection'}</span>;
    if (existing) return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${existing.status === 'SERVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{existing.status === 'SERVED' ? 'Served' : 'No-show'}</span>;
    return <div className="flex flex-wrap gap-2"><button onClick={() => record(row, meal, 'SERVED')} className="min-h-10 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"><Check size={13} className="inline mr-1" />Served</button><button onClick={() => record(row, meal, 'NO_SHOW')} className="min-h-10 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 hover:bg-rose-100"><XCircle size={13} className="inline mr-1" />No-show</button></div>;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6"><div><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Utensils className="text-indigo-600" /> Confirm Meal Serving</h1><p className="text-gray-600 mt-1">Student plans and actual servings are recorded separately.</p></div><input aria-label="Serving date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="px-3 py-2 border rounded-md" /></div>

      {summary && <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">{meals.map((meal) => <div key={meal} className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500 capitalize">{meal}</p><p className="font-semibold text-green-700">Served: {summary[meal].served}</p><p className="text-sm text-red-600">No-show: {summary[meal].noShow}</p></div>)}</div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[850px] text-left"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3">Student</th>{meals.map((meal) => <th key={meal} className="px-4 py-3 capitalize">{meal}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.customer._id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold text-slate-800">{row.customer.name}</p><p className="text-xs text-slate-400">{row.customer.customerId}</p></td>{meals.map((meal) => <td key={meal} className="px-4 py-3">{renderMealStatus(row, meal)}</td>)}</tr>)}</tbody></table></div>
        <div className="divide-y divide-slate-100 md:hidden">{rows.map((row) => <article key={row.customer._id} className="p-4"><p className="font-semibold text-slate-900">{row.customer.name}</p><p className="text-xs text-slate-400">{row.customer.customerId}</p><div className="mt-3 grid grid-cols-1 min-[400px]:grid-cols-3 gap-2">{meals.map((meal) => <div key={meal} className="rounded-xl bg-slate-50 p-3"><p className="mb-2 text-[11px] font-bold uppercase text-slate-500">{meal}</p>{renderMealStatus(row, meal)}</div>)}</div></article>)}</div>
        {loading && <p className="text-center py-8 text-gray-500">Loading selections…</p>}{!loading && !rows.length && <p className="text-center py-8 text-gray-500">No active students for this date.</p>}
      </div>
    </div>
  );
}
