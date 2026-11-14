import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { CalendarDays, RefreshCw, Utensils } from 'lucide-react';
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
  const statusStyle = (status) => status === 'EATING' ? 'text-green-700 bg-green-50' : status === 'NOT_EATING' ? 'text-red-700 bg-red-50' : 'text-gray-600 bg-gray-100';

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Utensils className="text-indigo-600" /> Daily Meal Attendance</h1><p className="text-gray-600 mt-1">Student meal selections and preparation quantities</p></div>
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2"><CalendarDays size={18} /><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="px-3 py-2 border rounded-md" /></label>
      </div>

      {summary && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow"><p className="text-sm text-gray-500">Active students</p><p className="text-2xl font-bold mt-1">{summary.activeStudents}</p></div>
        {mealTypes.map((meal) => <div key={meal} className="bg-white p-4 rounded-lg shadow"><p className="text-sm text-gray-500 capitalize">{meal} expected</p><p className="text-2xl font-bold text-indigo-700 mt-1">{summary[meal].eating}</p><p className="text-xs text-gray-500 mt-1">{summary[meal].notEating} not eating · {summary[meal].pending} pending</p></div>)}
        <div className="bg-indigo-700 text-white p-4 rounded-lg shadow sm:col-span-2 xl:col-span-1"><p className="text-sm text-indigo-100">Total meals to prepare</p><p className="text-3xl font-bold mt-1">{summary.totalExpected}</p></div>
      </div>}

      <section className="bg-white rounded-lg shadow p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input value={filters.name} onChange={handleFilterName} placeholder="Search student name" className="px-3 py-2 border rounded-md" />
        <select value={filters.mealType} onChange={(event) => setFilters({ ...filters, mealType: event.target.value })} className="px-3 py-2 border rounded-md"><option value="">All meals</option>{mealTypes.map((meal) => <option key={meal} value={meal}>{meal}</option>)}</select>
        <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="px-3 py-2 border rounded-md"><option value="">All selections</option><option value="EATING">Eating</option><option value="NOT_EATING">Not eating</option><option value="PENDING">Not submitted</option></select>
      </section>

      <section className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-left min-w-[850px]">
          <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-sm">Student</th>{mealTypes.map((meal) => <th className="px-4 py-3 text-sm capitalize" key={meal}>{meal}</th>)}<th className="px-4 py-3 text-sm">Submitted</th></tr></thead>
          <tbody className="divide-y">{rows.map((row) => <tr key={row.customer._id}>
            <td className="px-4 py-3"><p className="font-medium">{row.customer.name}</p><p className="text-xs text-gray-500">{row.customer.customerId}</p></td>
            {mealTypes.map((meal) => <td key={meal} className="px-4 py-3"><div className="flex flex-col items-start gap-1"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyle(row.selection[meal])}`}>{statusLabel(row.selection[meal])}</span>{row.selection[`${meal}Menu`]?.menuItem?.nameEnglish && <span className="text-xs text-gray-500">{row.selection[`${meal}Menu`].menuItem.nameEnglish}</span>}{row.selection._id && <select aria-label={`Correct ${meal} selection for ${row.customer.name}`} value={row.selection[meal]} onChange={(event) => applyOverride(row, meal, event.target.value)} className="text-xs border rounded px-1 py-1"><option value="EATING">Eating</option><option value="NOT_EATING">Not eating</option><option value="PENDING">Not submitted</option></select>}</div></td>)}
            <td className="px-4 py-3 text-sm">{row.selection.submitted ? 'Yes' : 'No'}</td>
          </tr>)}</tbody>
        </table>
        {!loading && !rows.length && <p className="text-center py-8 text-gray-500">No active students match these filters.</p>}
        {loading && <p className="text-center py-8 text-gray-500"><RefreshCw className="inline mr-2 animate-spin" size={16} />Loading attendance…</p>}
      </section>
    </div>
  );
}
