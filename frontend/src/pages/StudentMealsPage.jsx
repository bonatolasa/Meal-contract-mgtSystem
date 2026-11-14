import { useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { Check, XCircle, Utensils } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getMyContracts, getMyMealSelection, getMyMealSelectionHistory, submitMyMealSelection } from '../services/api';

const mealTypes = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
];

const translatedMeals = {
  breakfast: { 'Afaan Oromo': 'Ciree', Amharic: 'ቁርስ' },
  lunch: { 'Afaan Oromo': 'Laaqana', Amharic: 'ምሳ' },
  dinner: { 'Afaan Oromo': 'Irbaata', Amharic: 'እራት' },
};

function menuId(value) {
  return value?._id || value || '';
}

export default function StudentMealsPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const [date, setDate] = useState(today);
  const [contract, setContract] = useState(null);
  const [menu, setMenu] = useState([]);
  const [deadlines, setDeadlines] = useState({});
  const [locked, setLocked] = useState({});
  const [selection, setSelection] = useState({ breakfast: 'PENDING', lunch: 'PENDING', dinner: 'PENDING', breakfastMenu: '', lunchMenu: '', dinnerMenu: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState('English');
  const [history, setHistory] = useState([]);

  const load = async (selectedDate = date) => {
    setLoading(true);
    try {
      const [selectionRes, contractRes] = await Promise.all([getMyMealSelection(selectedDate), getMyContracts()]);
      const data = selectionRes.data;
      const value = data.selection || {};
      setSelection({
        breakfast: value.breakfast || 'PENDING', lunch: value.lunch || 'PENDING', dinner: value.dinner || 'PENDING',
        breakfastMenu: menuId(value.breakfastMenu), lunchMenu: menuId(value.lunchMenu), dinnerMenu: menuId(value.dinnerMenu),
      });
      setMenu(data.menu || []);
      setDeadlines(data.deadlines || {});
      setLocked(data.locked || {});
      setContract((contractRes.data || []).find((item) => item.status === 'Active' && new Date(item.startDate) <= new Date(`${selectedDate}T23:59:59`) && new Date(item.endDate) >= new Date(`${selectedDate}T00:00:00`)) || null);
    } catch (error) {
      setContract(null);
      setMenu([]);
      toast.error(error.response?.data?.message || 'An active monthly contract is required for this date');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(today); }, []);

  useEffect(() => {
    getMyMealSelectionHistory().then((response) => setHistory(response.data || [])).catch(() => {});
  }, []);

  const changeDate = (event) => {
    setDate(event.target.value);
    load(event.target.value);
  };

  const menuFor = (mealType) => menu.filter((entry) => entry.mealType === mealType && entry.isAvailable);
  const saveDisabled = useMemo(() => mealTypes.every(({ key }) => locked[key]) || mealTypes.every(({ key }) => selection[key] === 'PENDING'), [locked, selection]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await submitMyMealSelection({ date, ...selection });
      toast.success('Your meal selections have been submitted successfully.');
      await load(date);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save meal selections');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Utensils className="text-indigo-600" /> My Daily Meals</h1><p className="text-gray-600 mt-1">Choose meals for today or tomorrow. This does not change your monthly contract price.</p></div>
        <label className="text-sm font-medium text-gray-700">Meal date<input type="date" min={today} max={tomorrow} value={date} onChange={changeDate} className="block mt-1 px-3 py-2 border rounded-md" /></label>
      </div>

      {contract && <div className="bg-white rounded-lg shadow p-4 sm:p-5 mb-5 grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-4 gap-4">
        <div><p className="text-xs text-gray-500">Contract</p><p className="font-semibold">{contract.status}</p></div>
        <div><p className="text-xs text-gray-500">Monthly price</p><p className="font-semibold">ETB {Number(contract.monthlyPrice).toLocaleString()}</p></div>
        <div><p className="text-xs text-gray-500">Payment</p><p className="font-semibold">{contract.paymentStatus}</p></div>
        <div><p className="text-xs text-gray-500">Valid through</p><p className="font-semibold">{format(new Date(contract.endDate), 'MMM d, yyyy')}</p></div>
      </div>}

      {loading ? <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">Loading your menu…</div> : !contract ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-amber-800">You need an active monthly contract for this date. Contact the restaurant owner.</div>
      ) : <>
        <div className="flex justify-end"><label className="text-sm text-gray-600">Language <select value={language} onChange={(event) => setLanguage(event.target.value)} className="ml-2 px-2 py-1 border rounded"><option>English</option><option>Afaan Oromo</option><option>Amharic</option></select></label></div>
        <section className="bg-white rounded-lg shadow p-4 sm:p-5 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Today's menu and prices</h2>
          <p className="text-sm text-gray-500 mt-1">Prices are shown for reference and are included in your fixed monthly contract.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {mealTypes.map(({ key, label }) => {
              const mealLabel = translatedMeals[key][language] || label;
              const items = menuFor(key);
              return <div key={key} className="rounded-md border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800">{mealLabel}</h3>
                {items.length ? <ul className="mt-3 space-y-2">{items.map((entry) => {
                  const item = entry.menuItem || {};
                  const name = language === 'Afaan Oromo' ? item.nameAfaanOromo || item.nameEnglish : language === 'Amharic' ? item.nameAmharic || item.nameEnglish : item.nameEnglish;
                  return <li key={entry._id} className="flex justify-between gap-3 text-sm"><span className="text-gray-700">{name}</span><span className="font-medium whitespace-nowrap">ETB {Number(entry.displayPrice).toLocaleString()}</span></li>;
                })}</ul> : <p className="text-sm text-gray-500 mt-2">No menu published.</p>}
              </div>;
            })}
          </div>
        </section>
        <form onSubmit={save} className="space-y-4">
        {mealTypes.map(({ key, label }) => {
          const options = menuFor(key);
          const lockedMeal = Boolean(locked[key]);
          const mealLabel = translatedMeals[key][language] || label;
          return <section key={key} className="bg-white rounded-lg shadow p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div><div className="flex items-center gap-2"><h2 className="text-lg font-semibold text-gray-900">{mealLabel}</h2>{lockedMeal && <span className="rounded-full bg-gray-100 text-gray-600 px-2 py-1 text-xs">Locked</span>}</div><p className="text-xs text-gray-500 mt-1">Selection closes at {deadlines[key] || '—'} ({deadlines.timezone || 'local time'})</p></div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button type="button" disabled={lockedMeal} onClick={() => setSelection((current) => ({ ...current, [key]: 'EATING' }))} className={`min-h-11 rounded-lg px-3 sm:px-4 py-2 text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-50 ${selection[key] === 'EATING' ? 'bg-green-600 text-white shadow-sm' : 'bg-green-50 text-green-800 hover:bg-green-100'}`}><Check size={15} className="inline mr-1" />Eating</button>
                <button type="button" disabled={lockedMeal} onClick={() => setSelection((current) => ({ ...current, [key]: 'NOT_EATING', [`${key}Menu`]: '' }))} className={`min-h-11 rounded-lg px-3 sm:px-4 py-2 text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 ${selection[key] === 'NOT_EATING' ? 'bg-red-600 text-white shadow-sm' : 'bg-red-50 text-red-800 hover:bg-red-100'}`}><XCircle size={15} className="inline mr-1" />Not eating</button>
              </div>
            </div>
            {selection[key] === 'EATING' && <div className="mt-4">
              {options.length ? <select disabled={lockedMeal} required value={selection[`${key}Menu`]} onChange={(event) => setSelection((current) => ({ ...current, [`${key}Menu`]: event.target.value }))} className="w-full sm:max-w-xl px-3 py-2 border rounded-md">
                <option value="">Choose from today's menu</option>
                {options.map((entry) => {
                  const item = entry.menuItem || {};
                  const name = language === 'Afaan Oromo' ? item.nameAfaanOromo || item.nameEnglish : language === 'Amharic' ? item.nameAmharic || item.nameEnglish : item.nameEnglish;
                  return <option key={entry._id} value={entry._id}>{name} — ETB {entry.displayPrice} (included in monthly contract)</option>;
                })}
              </select> : <p className="text-sm text-amber-700">No {label.toLowerCase()} menu has been published for this date.</p>}
            </div>}
          </section>;
        })}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-indigo-50 rounded-lg p-4">
          <p className="text-sm text-indigo-900">Menu prices are for display only. Your monthly contract price stays the same.</p>
          <button disabled={saving || saveDisabled} className="btn-primary w-full sm:w-auto">{saving ? 'Saving…' : 'Save my selections'}</button>
        </div>
        </form>
      </>}

      <section className="bg-white rounded-lg shadow p-5 mt-7">
        <h2 className="font-semibold text-lg text-gray-900">My meal selection history</h2>
        {history.length ? <div className="overflow-x-auto mt-3"><table className="w-full min-w-[540px] text-left"><thead><tr className="text-sm text-gray-500"><th className="py-2">Date</th>{mealTypes.map(({ key, label }) => <th className="py-2" key={key}>{label}</th>)}</tr></thead><tbody className="divide-y">{history.slice(0, 14).map((item) => <tr key={item._id}><td className="py-3 text-sm">{item.date}</td>{mealTypes.map(({ key }) => <td className="py-3 text-sm" key={key}><span className={item[key] === 'EATING' ? 'text-green-700' : item[key] === 'NOT_EATING' ? 'text-red-700' : 'text-gray-500'}>{item[key] === 'EATING' ? 'Eating' : item[key] === 'NOT_EATING' ? 'Not eating' : 'Pending'}</span></td>)}</tr>)}</tbody></table></div> : <p className="text-sm text-gray-500 mt-3">No selections submitted yet.</p>}
      </section>
    </div>
  );
}
