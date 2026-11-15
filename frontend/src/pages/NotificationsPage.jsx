import { useEffect, useState } from 'react';
import { getNotifications, createNotification, markNotificationRead, deleteNotification, getUnreadNotifications } from '../services/api';
import { toast } from 'react-hot-toast';
import { Bell, BellOff, Plus, X, CheckCircle, Trash2 } from 'lucide-react';

const emptyForm = { customer: '', title: '', message: '', type: 'general' };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [n, c] = await Promise.all([getNotifications(), getCustomers()]);
      setNotifications(n.data || []);
      setCustomers(c.data || []);
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createNotification(form);
      toast.success('Notification created');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error('Create failed');
    }
  };

  const handleRead = async (id) => {
    try {
      await markNotificationRead(id);
      load();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await deleteNotification(id);
      toast.success('Deleted');
      load();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={28} className="text-indigo-600" /> Notifications
          </h1>
          <p className="text-gray-600 mt-1">Notify customers about expired contracts and unpaid bills</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus size={18} /> New Notification
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Customer</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Title</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Message</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Type</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Created</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {notifications.map((n) => (
                <tr key={n._id} className={`hover:bg-gray-50 ${!n.isRead ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4 text-sm text-gray-900">{n.customer?.name || n.customer}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{n.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{n.message}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">{n.type}</span>
                  </td>
                  <td className="px-6 py-4">
                    {n.isRead ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle size={14} /> Read</span>
                    ) : (
                      <span className="flex items-center gap-1 text-blue-600 text-sm"><Bell size={14} /> Unread</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{n.createdAt?.slice(0, 10) || '-'}</td>
                  <td className="px-6 py-4 flex gap-2">
                    {!n.isRead && (
                      <button onClick={() => handleRead(n._id)} className="text-green-600 hover:text-green-800" title="Mark read">
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(n._id)} className="text-red-600 hover:text-red-800" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {notifications.length === 0 && <p className="text-center py-8 text-gray-500">No notifications.</p>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="mx-4 w-[calc(100vw-2rem)] max-w-md max-h-[90dvh] overflow-y-auto bg-white rounded-2xl p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">New Notification</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className="w-full px-3 py-2 border rounded-md" required>
                <option value="">Select Customer</option>
                {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
              <textarea placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-md">
                <option value="general">General</option>
                <option value="contract_expiry">Contract Expiry</option>
                <option value="payment_due">Payment Due</option>
              </select>
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">Create</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
