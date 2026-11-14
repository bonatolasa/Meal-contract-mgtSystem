import { useEffect, useState } from 'react';
import { getCustomers, getContracts, recordMeal, getMealTrackingByDate, getTodayStats } from '../services/api';
import { toast } from 'react-hot-toast';
import { Utensils, Calendar, Check, X, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function MealTrackingPage() {
  const [customers, setCustomers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [records, setRecords] = useState({});
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [c, ct, s] = await Promise.all([getCustomers(), getContracts(), getTodayStats()]);
      setCustomers(c.data || []);
      setContracts(ct.data || []);
      setStats(s.data);
      loadRecords(selectedDate);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async (date) => {
    try {
      const res = await getMealTrackingByDate(date);
      const map = {};
      (res.data || []).forEach((r) => {
        map[r.customer?._id || r.customer] = { breakfast: r.breakfast, lunch: r.lunch, dinner: r.dinner, notes: r.notes };
      });
      setRecords(map);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    loadRecords(e.target.value);
  };

  const toggleMeal = (customerId, mealType) => {
    setRecords((prev) => ({
      ...prev,
      [customerId]: {
        ...(prev[customerId] || {}),
        [mealType]: !prev[customerId]?.[mealType],
      },
    }));
  };

  const saveRecord = async (customerId) => {
    const data = records[customerId] || {};
    try {
      await recordMeal({
        customer: customerId,
        date: selectedDate,
        breakfast: !!data.breakfast,
        lunch: !!data.lunch,
        dinner: !!data.dinner,
        notes: data.notes || '',
      });
      toast.success('Meal record saved');
      load();
    } catch (err) {
      toast.error('Save failed');
    }
  };

  const activeContracts = contracts.filter((c) => c.status === 'Active');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Utensils size={28} className="text-indigo-600" /> Meal Tracking
        </h1>
        <p className="text-gray-600 mt-1">Record daily meals consumed by customers</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-4">
          <Calendar className="text-indigo-600" size={20} />
          <label className="text-sm font-medium text-gray-700">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={load} className="flex items-center gap-1 px-3 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Today's Customers</p>
            <p className="text-2xl font-bold text-indigo-600">{stats.totalCustomers}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Breakfast</p>
            <p className="text-2xl font-bold text-orange-500">{stats.totalBreakfast}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Lunch</p>
            <p className="text-2xl font-bold text-green-500">{stats.totalLunch}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Dinner</p>
            <p className="text-2xl font-bold text-blue-500">{stats.totalDinner}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Customer</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Breakfast</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Lunch</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Dinner</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Notes</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.filter((c) => c.isActive).map((customer) => {
                const hasContract = activeContracts.some((c) => c.customer?._id === customer._id);
                const record = records[customer._id] || {};
                return (
                  <tr key={customer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{customer.name}</div>
                      {!hasContract && <span className="text-xs text-red-500">No active contract</span>}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleMeal(customer._id, 'breakfast')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${record.breakfast ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                      >
                        {record.breakfast ? <Check size={16} /> : <X size={16} />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleMeal(customer._id, 'lunch')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${record.lunch ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                      >
                        {record.lunch ? <Check size={16} /> : <X size={16} />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleMeal(customer._id, 'dinner')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${record.dinner ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                      >
                        {record.dinner ? <Check size={16} /> : <X size={16} />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        placeholder="Notes"
                        value={record.notes || ''}
                        onChange={(e) => setRecords((prev) => ({
                          ...prev,
                          [customer._id]: { ...(prev[customer._id] || {}), notes: e.target.value },
                        }))}
                        className="w-full px-3 py-1 border rounded-md text-sm"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => saveRecord(customer._id)}
                        className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 text-sm"
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}