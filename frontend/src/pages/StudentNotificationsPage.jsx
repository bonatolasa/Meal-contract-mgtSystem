import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getMyNotifications, markMyNotificationRead } from '../services/api';

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = await getMyNotifications();
      setNotifications(response.data || []);
    } catch {
      toast.error('Could not load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await markMyNotificationRead(id);
      setNotifications((items) => items.map((item) => item._id === id ? { ...item, isRead: true } : item));
    } catch {
      toast.error('Could not update notification');
    }
  };

  return (
    <section className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Bell className="text-indigo-600" /> Notifications</h1>
      {loading ? <p className="py-10 text-center text-gray-500">Loading…</p> : notifications.length ? (
        <div className="bg-white rounded-lg shadow divide-y mt-5">
          {notifications.map((notification) => <article key={notification._id} className={`p-5 ${notification.isRead ? '' : 'bg-indigo-50/50'}`}>
            <div className="flex justify-between gap-4">
              <div><h2 className="font-semibold text-gray-900">{notification.title}</h2><p className="text-sm text-gray-600 mt-1">{notification.message}</p><p className="text-xs text-gray-400 mt-2">{new Date(notification.createdAt).toLocaleString()}</p></div>
              {!notification.isRead && <button aria-label="Mark as read" onClick={() => markRead(notification._id)} className="h-8 px-2 text-indigo-700 hover:bg-indigo-100 rounded"><Check size={16} /></button>}
            </div>
          </article>)}
        </div>
      ) : <p className="py-10 text-center text-gray-500">You have no notifications.</p>}
    </section>
  );
}
