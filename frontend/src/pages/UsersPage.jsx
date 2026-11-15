import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { createUser, deleteUser, getUsers, updateUser } from '../services/api';

const blank = { name: '', email: '', password: '', role: 'employee', phone: '', address: '' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data || []);
    } catch {
      toast.error('Could not load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await createUser(form);
      toast.success(`${form.role} account created`);
      setForm(blank);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create account');
    }
  };

  const toggleActive = async (user) => {
    try {
      if (user.isActive) {
        if (!window.confirm(`Deactivate ${user.name}'s account?`)) return;
        await deleteUser(user._id);
      } else {
        await updateUser(user._id, { isActive: true });
      }
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update account');
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <section className="bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold text-gray-900">Create an account</h1>
        <form onSubmit={submit} className="space-y-3 mt-5">
          <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
          <input required type="password" minLength="8" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border rounded-md"><option value="employee">Employee</option><option value="student">Student</option></select>
          <input required type="tel" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
          <input required placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
          <button className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">Create account</button>
        </form>
      </section>
      <section className="bg-white rounded-lg shadow p-6 xl:col-span-2">
        <h2 className="text-xl font-bold text-gray-900">Accounts</h2>
        {loading ? <p className="py-8 text-gray-500">Loading…</p> : <div className="overflow-x-auto mt-4"><table className="w-full min-w-[760px] text-left">
          <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-sm">Name</th><th className="px-4 py-3 text-sm">Email</th><th className="px-4 py-3 text-sm">Role</th><th className="px-4 py-3 text-sm">Status</th><th className="px-4 py-3 text-sm">Action</th></tr></thead>
          <tbody className="divide-y">{users.map((user) => <tr key={user._id}><td className="px-4 py-3">{user.name}</td><td className="px-4 py-3">{user.email}</td><td className="px-4 py-3 capitalize">{user.role}</td><td className="px-4 py-3">{user.isActive ? 'Active' : 'Inactive'}</td><td className="px-4 py-3"><button onClick={() => toggleActive(user)} className="text-indigo-700 hover:underline">{user.isActive ? 'Deactivate' : 'Reactivate'}</button></td></tr>)}</tbody>
        </table></div>}
      </section>
    </div>
  );
}
