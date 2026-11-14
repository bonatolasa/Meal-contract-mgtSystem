import { useEffect, useState } from 'react';
import { getContracts, createContract, updateContract, deleteContract, getCustomers } from '../services/api';
import { toast } from 'react-hot-toast';
import { FileText, Plus, Edit2, Trash2, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const emptyForm = {
  contractId: '', customer: '', mealPackage: '', startDate: '', endDate: '',
  durationType: 'monthly', monthlyPrice: 0, totalAmount: 0,
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState('all');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [c, cust] = await Promise.all([getContracts(), getCustomers()]);
      setContracts(c.data || []);
      setCustomers(cust.data || []);
    } catch (err) {
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateContract(editing._id, form);
        toast.success('Contract updated');
      } else {
        await createContract(form);
        toast.success('Contract created');
      }
      setShowModal(false);
      setEditing(null);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (c) => {
    setEditing(c);
    setForm({
      contractId: c.contractId, customer: c.customer?._id || c.customer,
      mealPackage: c.mealPackage?._id || c.mealPackage, startDate: c.startDate?.slice(0, 10) || '',
      endDate: c.endDate?.slice(0, 10) || '', durationType: c.durationType,
      monthlyPrice: c.monthlyPrice, totalAmount: c.totalAmount,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contract?')) return;
    try {
      await deleteContract(id);
      toast.success('Contract deleted');
      load();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleStatus = async (c, status) => {
    try {
      await updateContract(c._id, { status });
      toast.success(`Status updated to ${status}`);
      load();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const filtered = contracts.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'active') return c.status === 'Active';
    if (filter === 'expired') return c.status === 'Expired';
    if (filter === 'suspended') return c.status === 'Suspended';
    return true;
  });

  const statusBadge = (status) => {
    const styles = {
      Active: 'bg-green-100 text-green-800',
      Expired: 'bg-red-100 text-red-800',
      Suspended: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText size={28} className="text-indigo-600" /> Contracts
          </h1>
          <p className="text-gray-600 mt-1">Manage food contracts and agreements</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm(emptyForm); setShowModal(true); }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus size={18} /> New Contract
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        {['all', 'active', 'expired', 'suspended'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Contract ID</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Customer</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Package</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Period</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Amount</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Paid</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Balance</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.contractId}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{c.customer?.name || c.customer}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.mealPackage?.name || c.mealPackage}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {c.startDate?.slice(0, 10)} - {c.endDate?.slice(0, 10)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">ETB {c.totalAmount?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">ETB {c.amountPaid?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">ETB {c.remainingBalance?.toLocaleString()}</td>
                  <td className="px-6 py-4">{statusBadge(c.status)}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => handleEdit(c)} className="text-blue-600 hover:text-blue-800" title="Edit">
                      <Edit2 size={16} />
                    </button>
                    {c.status !== 'Active' && (
                      <button onClick={() => handleStatus(c, 'Active')} className="text-green-600 hover:text-green-800" title="Activate">
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {c.status === 'Active' && (
                      <button onClick={() => handleStatus(c, 'Suspended')} className="text-yellow-600 hover:text-yellow-800" title="Suspend">
                        <Clock size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(c._id)} className="text-red-600 hover:text-red-800" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center py-8 text-gray-500">No contracts found.</p>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">{editing ? 'Edit Contract' : 'New Contract'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input placeholder="Contract ID" value={form.contractId} onChange={(e) => setForm({ ...form, contractId: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
              <select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className="w-full px-3 py-2 border rounded-md" required>
                <option value="">Select Customer</option>
                {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <select value={form.mealPackage} onChange={(e) => setForm({ ...form, mealPackage: e.target.value })} className="w-full px-3 py-2 border rounded-md" required>
                <option value="">Select Meal Package</option>
                {/* Options will be populated from meal packages API */}
                <option value="">(Load from API)</option>
              </select>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
              <select value={form.durationType} onChange={(e) => setForm({ ...form, durationType: e.target.value })} className="w-full px-3 py-2 border rounded-md">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <input type="number" placeholder="Monthly Price" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: +e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
              <input type="number" placeholder="Total Amount" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: +e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">
                {editing ? 'Update' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}