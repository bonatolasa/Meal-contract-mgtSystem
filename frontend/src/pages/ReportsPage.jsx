import { useEffect, useState } from 'react';
import { getReports, generateDailyReport, generateWeeklyReport, generateMonthlyReport } from '../services/api';
import { toast } from 'react-hot-toast';
import { BarChart3, FileText, Calendar, TrendingUp, X } from 'lucide-react';
import { format } from 'date-fns';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [reportType, setReportType] = useState('daily');
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(), 'yyyy-MM-dd'), month: new Date().getMonth() + 1, year: new Date().getFullYear(), generatedBy: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await getReports();
      setReports(res.data || []);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      let res;
      if (reportType === 'daily') {
        res = await generateDailyReport(form.date, form.generatedBy);
      } else if (reportType === 'weekly') {
        res = await generateWeeklyReport(form.startDate, form.endDate, form.generatedBy);
      } else {
        res = await generateMonthlyReport(+form.month, +form.year, form.generatedBy);
      }
      toast.success('Report generated');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error('Generation failed');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={28} className="text-indigo-600" /> Reports
          </h1>
          <p className="text-gray-600 mt-1">Generate daily, weekly, and monthly reports</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <FileText size={18} /> Generate Report
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Title</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Type</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Generated At</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">By</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((r) => (
                <tr key={r._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.title}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">{r.type}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.generatedAt?.slice(0, 10) || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.generatedBy || '-'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => alert(JSON.stringify(r.data, null, 2))} className="text-blue-600 hover:text-blue-800 text-sm">View Data</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 && <p className="text-center py-8 text-gray-500">No reports generated yet.</p>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Generate Report</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleGenerate} className="space-y-4">
              <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                <option value="daily">Daily Report</option>
                <option value="weekly">Weekly Report</option>
                <option value="monthly">Monthly Report</option>
              </select>

              {reportType === 'daily' && (
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
              )}
              {reportType === 'weekly' && (
                <div className="space-y-2">
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border rounded-md" required placeholder="Start Date" />
                  <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border rounded-md" required placeholder="End Date" />
                </div>
              )}
              {reportType === 'monthly' && (
                <div className="flex gap-2">
                  <input type="number" min="1" max="12" placeholder="Month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="w-1/2 px-3 py-2 border rounded-md" required />
                  <input type="number" placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="w-1/2 px-3 py-2 border rounded-md" required />
                </div>
              )}

              <input placeholder="Generated By" value={form.generatedBy} onChange={(e) => setForm({ ...form, generatedBy: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">Generate Report</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}