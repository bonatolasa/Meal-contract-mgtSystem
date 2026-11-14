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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6"><div><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Utensils className="text-indigo-600" /> Confirm Meal Serving</h1><p className="text-gray-600 mt-1">Student plans and actual servings are recorded separately.</p></div><input aria-label="Serving date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="px-3 py-2 border rounded-md" /></div>

      {summary && <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">{meals.map((meal) => <div key={meal} className="bg-white rounded-lg shadow p-4"><p className="text-sm text-gray-500 capitalize">{meal}</p><p className="font-semibold text-green-700">Served: {summary[meal].served}</p><p className="text-sm text-red-600">No-show: {summary[meal].noShow}</p></div>)}</div>}

      <div className="bg-white rounded-lg shadow overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="bg-gray-50"><tr><th className="px-4 py-3 text-sm">Student</th>{meals.map((meal) => <th key={meal} className="px-4 py-3 text-sm capitalize">{meal}</th>)}</tr></thead><tbody className="divide-y">{rows.map((row) => <tr key={row.customer._id}><td className="px-4 py-3"><p className="font-medium">{row.customer.name}</p><p className="text-xs text-gray-500">{row.customer.customerId}</p></td>{meals.map((meal) => {
        const selected = row.selection[meal] === 'EATING';
        const existing = row.selection._id ? servingFor(row.selection._id, meal) : null;
        return <td key={meal} className="px-4 py-3">{!selected ? <span className="text-xs text-gray-400">{row.selection[meal] === 'NOT_EATING' ? 'Not eating' : 'No selection'}</span> : existing ? <span className={`text-xs font-medium ${existing.status === 'SERVED' ? 'text-green-700' : 'text-red-700'}`}>{existing.status === 'SERVED' ? 'Served' : 'No-show'}</span> : <div className="flex gap-2"><button onClick={() => record(row, meal, 'SERVED')} className="px-2 py-1 text-xs rounded bg-green-100 text-green-800"><Check size={13} className="inline mr-1" />Served</button><button onClick={() => record(row, meal, 'NO_SHOW')} className="px-2 py-1 text-xs rounded bg-red-100 text-red-800"><XCircle size={13} className="inline mr-1" />No-show</button></div>}</td>;
      })}</tr>)}</tbody></table>{loading && <p className="text-center py-8 text-gray-500">Loading selections…</p>}{!loading && !rows.length && <p className="text-center py-8 text-gray-500">No active students for this date.</p>}</div>
    </div>
  );
}
