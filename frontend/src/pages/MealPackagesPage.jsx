import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { createMealPackage, getMealPackages, updateMealPackage } from '../services/api';

const initial = { name: '', description: '', pricePerMonth: 0, includesBreakfast: true, includesLunch: true, includesDinner: true };

export default function MealPackagesPage() {
  const [packages, setPackages] = useState([]);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = await getMealPackages();
      setPackages(response.data || []);
    } catch {
      toast.error('Could not load meal packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await createMealPackage(form);
      toast.success('Meal package created');
      setForm(initial);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not create meal package');
    }
  };

  const numberField = (key, label) => (
    <label className="block text-sm text-gray-700">{label}
      <input type="number" min="0" step="0.01" required value={form[key]} onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })} className="mt-1 w-full px-3 py-2 border rounded-md" />
    </label>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <section className="bg-white rounded-lg shadow p-6 xl:col-span-1">
        <h1 className="text-xl font-bold text-gray-900">Create meal package</h1>
        <form onSubmit={submit} className="space-y-4 mt-5">
          <input required placeholder="Package name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
          <textarea required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
          {numberField('pricePerMonth', 'Monthly price (ETB)')}
          <button className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">Save package</button>
        </form>
      </section>
      <section className="bg-white rounded-lg shadow p-6 xl:col-span-2">
        <h2 className="text-xl font-bold text-gray-900">Meal packages</h2>
        {loading ? <p className="mt-5 text-gray-500">Loading…</p> : packages.length ? (
          <div className="divide-y mt-4">
            {packages.map((pkg) => <article key={pkg._id} className="py-4">
              <div className="flex justify-between gap-4"><h3 className="font-semibold text-gray-900">{pkg.name}</h3><div className="flex gap-4 items-start"><span className="text-sm font-medium">ETB {Number(pkg.pricePerMonth).toLocaleString()}/month</span><button onClick={async () => {
                const isActive = !pkg.isActive;
                try { await updateMealPackage(pkg._id, { isActive }); toast.success(isActive ? 'Package activated' : 'Package deactivated'); load(); }
                catch (error) { toast.error(error.response?.data?.message || 'Could not update package'); }
              }} className={`text-sm hover:underline ${pkg.isActive ? 'text-red-600' : 'text-green-700'}`}>{pkg.isActive ? 'Deactivate' : 'Activate'}</button></div></div>
              <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
              <p className="text-xs text-gray-500 mt-2">Fixed monthly food subscription package</p>
            </article>)}
          </div>
        ) : <p className="mt-5 text-gray-500">No meal packages yet.</p>}
      </section>
    </div>
  );
}
