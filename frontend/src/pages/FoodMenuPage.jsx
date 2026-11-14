import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { BookOpen, Globe, Plus, Save, Trash2, Pencil, X } from 'lucide-react';
import { createMenuItem, getDailyMenu, getMealSettings, getMenuItems, publishDailyMenu, removeDailyMenuEntry, updateMealSettings, updateMenuItem } from '../services/api';

const emptyItem = { nameEnglish: '', nameAfaanOromo: '', nameAmharic: '', description: '', category: 'breakfast', price: 0, imageUrl: '' };
const types = ['breakfast', 'lunch', 'dinner'];
const defaultMenu = [
  { name: 'Firfir', category: 'breakfast', price: 80 },
  { name: 'Chechebsa', category: 'breakfast', price: 90 },
  { name: 'Genfo', category: 'breakfast', price: 70 },
  { name: 'Injera with Shiro', category: 'lunch', price: 120 },
  { name: 'Injera with Misir Wot', category: 'lunch', price: 110 },
  { name: 'Injera with Doro Wot', category: 'lunch', price: 180 },
  { name: 'Rice with Meat', category: 'lunch', price: 150 },
  { name: 'Injera with Tibs', category: 'dinner', price: 160 },
  { name: 'Injera with Shiro', category: 'dinner', price: 120 },
  { name: 'Pasta', category: 'dinner', price: 100 },
];

export default function FoodMenuPage() {
  const [items, setItems] = useState([]);
  const [dailyMenu, setDailyMenu] = useState([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [form, setForm] = useState(emptyItem);
  const [editingId, setEditingId] = useState(null);
  const [chosen, setChosen] = useState({ breakfast: '', lunch: '', dinner: '' });
  const [settings, setSettings] = useState({ breakfastDeadline: '07:00', lunchDeadline: '10:00', dinnerDeadline: '15:00', timezone: 'Africa/Addis_Ababa' });

  const load = async () => {
    try {
      const [itemRes, menuRes, settingsRes] = await Promise.all([getMenuItems(), getDailyMenu(date), getMealSettings()]);
      setItems(itemRes.data || []);
      setDailyMenu(menuRes.data || []);
      setSettings(settingsRes.data || settings);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load menu settings');
    }
  };

  useEffect(() => { load(); }, [date]);

  const saveItem = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await updateMenuItem(editingId, form);
        toast.success('Food item updated');
      } else {
        await createMenuItem(form);
        toast.success('Food item added');
      }
      setForm(emptyItem);
      setEditingId(null);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add food item');
    }
  };

  const editItem = (item) => {
    setEditingId(item._id);
    setForm({
      nameEnglish: item.nameEnglish || '',
      nameAfaanOromo: item.nameAfaanOromo || '',
      nameAmharic: item.nameAmharic || '',
      description: item.description || '',
      category: item.category || 'breakfast',
      price: Number(item.price) || 0,
      imageUrl: item.imageUrl || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyItem);
  };

  const addToMenu = async (mealType) => {
    const menuItem = chosen[mealType];
    if (!menuItem) return toast.error(`Choose a ${mealType} food item first`);
    const item = items.find((entry) => entry._id === menuItem);
    try {
      await publishDailyMenu({ date, mealType, menuItem, displayPrice: item.price });
      toast.success(`${mealType} menu published`);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not publish menu');
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    try {
      const response = await updateMealSettings(settings);
      setSettings(response.data);
      toast.success('Meal deadlines saved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save deadlines');
    }
  };

  const toggleItem = async (item) => {
    try {
      await updateMenuItem(item._id, { isAvailable: !item.isAvailable });
      toast.success(item.isAvailable ? 'Food item deactivated' : 'Food item activated');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update food item');
    }
  };

  const removeEntry = async (entry) => {
    try {
      await removeDailyMenuEntry(entry._id);
      toast.success('Menu entry removed');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not remove menu entry');
    }
  };

  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><BookOpen className="text-indigo-600" /> Food Menu Management</h1><p className="text-gray-600 mt-1">Manage Ethiopian food names, prices, daily menus, and selection deadlines.</p></header>

        <section className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 sm:p-5">
        <h2 className="font-semibold text-indigo-950">Default Ethiopian menu · editable prices</h2>
        <p className="text-sm text-indigo-800 mt-1">These suggested ETB prices are added to the food list automatically. Change an item’s price before publishing a daily menu.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {defaultMenu.map((item) => <div key={`${item.category}-${item.name}`} className="bg-white rounded-md px-4 py-3 flex justify-between gap-3 text-sm"><span><span className="capitalize text-gray-500">{item.category}</span><br /><span className="font-medium text-gray-900">{item.name}</span></span><span className="font-semibold whitespace-nowrap">ETB {item.price}</span></div>)}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <section className="min-w-0 bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="font-semibold text-lg">{editingId ? 'Edit food item' : 'Add food item'}</h2>
          <form onSubmit={saveItem} className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            <input required placeholder="Name in English" value={form.nameEnglish} onChange={(e) => setForm({ ...form, nameEnglish: e.target.value })} className="px-3 py-2 border rounded-md" />
            <input placeholder="Maqaa Afaan Oromoo" value={form.nameAfaanOromo} onChange={(e) => setForm({ ...form, nameAfaanOromo: e.target.value })} className="px-3 py-2 border rounded-md" />
            <input placeholder="ስም በአማርኛ" value={form.nameAmharic} onChange={(e) => setForm({ ...form, nameAmharic: e.target.value })} className="px-3 py-2 border rounded-md" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2 border rounded-md">{types.map((type) => <option key={type} value={type}>{type}</option>)}</select>
            <input type="number" min="0" step="0.01" required placeholder="Display price (ETB)" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="px-3 py-2 border rounded-md" />
            <input placeholder="Image URL (optional)" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="px-3 py-2 border rounded-md" />
            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="px-3 py-2 border rounded-md md:col-span-2" />
            <div className="md:col-span-2 flex gap-2">
              <button className="btn-primary flex-1">{editingId ? <><Save size={17} /> Save changes</> : <><Plus size={17} /> Add food item</>}</button>
              {editingId && <button type="button" onClick={cancelEdit} className="btn-secondary"><X size={17} /> Cancel</button>}
            </div>
          </form>
          <div className="mt-5 divide-y max-h-80 overflow-y-auto">
            {items.map((item) => <article key={item._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"><div className="min-w-0"><p className="font-medium break-words">{item.nameEnglish} <span className="text-sm text-gray-500">{item.nameAfaanOromo} {item.nameAmharic}</span></p><p className="text-xs text-gray-500 capitalize">{item.category} · ETB {item.price}</p></div><div className="flex flex-wrap items-center gap-2"><button onClick={() => editItem(item)} className="btn-secondary min-h-10 px-3 py-1.5 text-xs"><Pencil size={14} /> Edit</button><button onClick={() => toggleItem(item)} className={`min-h-10 rounded-lg px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${item.isAvailable ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>{item.isAvailable ? 'Deactivate' : 'Reactivate'}</button></div></article>)}
          </div>
        </section>

        <section className="min-w-0 bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><h2 className="font-semibold text-lg">Publish daily menu</h2><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 border rounded-md" /></div>
          <div className="space-y-4 mt-5">{types.map((mealType) => <div key={mealType} className="flex flex-col sm:flex-row gap-2"><select value={chosen[mealType]} onChange={(e) => setChosen({ ...chosen, [mealType]: e.target.value })} className="min-w-0 flex-1 px-3 py-2 border rounded-md"><option value="">Choose {mealType} item</option>{items.filter((item) => item.isAvailable && item.category === mealType).map((item) => <option key={item._id} value={item._id}>{item.nameEnglish} — ETB {item.price}</option>)}</select><button onClick={() => addToMenu(mealType)} className="btn-primary w-full sm:w-auto">Publish {mealType}</button></div>)}</div>
          <div className="divide-y mt-5">{dailyMenu.map((entry) => <div key={entry._id} className="py-3 flex items-center justify-between"><div><p className="font-medium">{entry.menuItem?.nameEnglish}</p><p className="text-xs text-gray-500 capitalize">{entry.mealType} · ETB {entry.displayPrice}</p></div><button aria-label="Remove menu item" onClick={() => removeEntry(entry)} className="text-red-600"><Trash2 size={17} /></button></div>)}{!dailyMenu.length && <p className="py-4 text-sm text-gray-500">No menu published for {date}.</p>}</div>
        </section>
      </div>

      <section className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="font-semibold text-lg flex items-center gap-2"><Globe size={18} /> Student selection deadlines</h2>
        <form onSubmit={saveSettings} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4 items-end">
          {types.map((meal) => <label key={meal} className="text-sm text-gray-600 capitalize">{meal} closes at<input type="time" value={settings[`${meal}Deadline`]} onChange={(e) => setSettings({ ...settings, [`${meal}Deadline`]: e.target.value })} className="block w-full mt-1 px-3 py-2 border rounded-md" /></label>)}
          <label className="text-sm text-gray-600">Timezone<input value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className="block w-full mt-1 px-3 py-2 border rounded-md" /></label>
          <button className="btn-primary w-full sm:col-span-2 xl:col-span-4"><Save size={17} /> Save deadlines</button>
        </form>
      </section>
    </div>
  );
}
