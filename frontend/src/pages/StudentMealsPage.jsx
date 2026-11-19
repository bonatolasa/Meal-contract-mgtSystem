import { useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { Check, XCircle, Utensils, Coffee, Sun, Moon, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getMyContracts, getMyMealSelection, getMyMealSelectionHistory, submitMyMealSelection } from '../services/api';

const mealTypes = [
  { key: 'breakfast', label: 'Breakfast', icon: Coffee, time: 'Start the day well' },
  { key: 'lunch', label: 'Lunch', icon: Sun, time: 'A midday meal' },
  { key: 'dinner', label: 'Dinner', icon: Moon, time: 'End the day well' },
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
    <div className="mx-auto max-w-5xl pb-8">
      <div className="mb-6 flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-[#26372f] via-[#31453b] to-[#405746] p-6 text-white shadow-lg shadow-emerald-950/10 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Your meal plan</p><h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl"><Utensils className="text-emerald-300" /> My Daily Meals</h1><p className="mt-2 max-w-xl text-sm text-white/75">Choose what you’ll enjoy today or tomorrow. Your monthly contract price stays the same.</p></div>
        <label className="text-sm font-medium text-white/80">Meal date<input type="date" min={today} max={tomorrow} value={date} onChange={changeDate} className="mt-1 block rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-white outline-none [color-scheme:dark] focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/30" /></label>
      </div>

      {contract && <div className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm min-[380px]:grid-cols-2 sm:grid-cols-4 sm:p-5">
        <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Contract</p><p className="mt-1 font-semibold text-slate-800">{contract.status}</p></div>
        <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Monthly price</p><p className="mt-1 font-semibold text-slate-800">ETB {Number(contract.monthlyPrice).toLocaleString()}</p></div>
        <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Payment</p><p className="mt-1 font-semibold text-slate-800">{contract.paymentStatus}</p></div>
        <div><p className="text-xs font-medium uppercase tracking-wide text-slate-400">Valid through</p><p className="mt-1 font-semibold text-slate-800">{format(new Date(contract.endDate), 'MMM d, yyyy')}</p></div>
      </div>}

      {loading ? <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">Loading your menu…</div> : !contract ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-amber-800">You need an active monthly contract for this date. Contact the restaurant owner.</div>
      ) : <>
        <div className="mb-3 flex justify-end"><label className="text-sm font-medium text-slate-600">Language <select value={language} onChange={(event) => setLanguage(event.target.value)} className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"><option>English</option><option>Afaan Oromo</option><option>Amharic</option></select></label></div>
        <section className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold text-slate-900">Today's menu and prices</h2>
          <p className="text-sm text-gray-500 mt-1">Prices are shown for reference and are included in your fixed monthly contract.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {mealTypes.map(({ key, label }) => {
              const mealLabel = translatedMeals[key][language] || label;
              const items = menuFor(key);
              const Icon = mealTypes.find((meal) => meal.key === key).icon;
              return <div key={key} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <h3 className="flex items-center gap-2 font-semibold text-slate-800"><Icon size={17} className="text-emerald-700" />{mealLabel}</h3>
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
        {mealTypes.map(({ key, label, icon: Icon, time }) => {
          const options = menuFor(key);
          const lockedMeal = Boolean(locked[key]);
          const mealLabel = translatedMeals[key][language] || label;
          const eating = selection[key] === 'EATING';
          const notEating = selection[key] === 'NOT_EATING';
          return <section key={key} className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${eating ? 'border-emerald-300 ring-2 ring-emerald-100' : notEating ? 'border-slate-300' : 'border-slate-200'}`}>
            <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${eating ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}><Icon size={20} /></div><div><div className="flex items-center gap-2"><h2 className="text-lg font-semibold text-slate-900">{mealLabel}</h2>{lockedMeal && <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">Locked</span>}{eating && <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">Selected</span>}</div><p className="mt-0.5 text-xs text-slate-500">{time} · Closes at {deadlines[key] || '—'} ({deadlines.timezone || 'local time'})</p></div></div>
              <div className="grid grid-cols-2 gap-2 sm:min-w-[290px]">
                <button type="button" aria-pressed={eating} disabled={lockedMeal} onClick={() => setSelection((current) => ({ ...current, [key]: 'EATING' }))} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${eating ? 'border-emerald-700 bg-emerald-700 text-white shadow-md shadow-emerald-900/15' : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400 hover:bg-emerald-100'}`}><Check size={16} />I’m eating</button>
                <button type="button" aria-pressed={notEating} disabled={lockedMeal} onClick={() => setSelection((current) => ({ ...current, [key]: 'NOT_EATING', [`${key}Menu`]: '' }))} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${notEating ? 'border-slate-600 bg-slate-700 text-white shadow-md shadow-slate-900/15' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}><XCircle size={16} />Not eating</button>
              </div>
            </div>
            {selection[key] === 'EATING' && <div className="mt-4">
              {options.length ? <div className="relative border-t border-emerald-100 bg-emerald-50/60 -mx-4 -mb-4 mt-4 p-4 sm:-mx-5 sm:-mb-5 sm:px-5 sm:py-4"><label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-emerald-900">Choose your {label.toLowerCase()}</label><select disabled={lockedMeal} required value={selection[`${key}Menu`]} onChange={(event) => setSelection((current) => ({ ...current, [`${key}Menu`]: event.target.value }))} className="w-full appearance-none rounded-xl border border-emerald-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100">
                <option value="">Choose from today's menu</option>
                {options.map((entry) => {
                  const item = entry.menuItem || {};
                  const name = language === 'Afaan Oromo' ? item.nameAfaanOromo || item.nameEnglish : language === 'Amharic' ? item.nameAmharic || item.nameEnglish : item.nameEnglish;
                  return <option key={entry._id} value={entry._id}>{name} — ETB {entry.displayPrice} (included in monthly contract)</option>;
                })}
              </select><ChevronDown size={17} className="pointer-events-none absolute right-7 top-[58px] text-emerald-700" /></div> : <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">No {label.toLowerCase()} menu has been published for this date.</p>}
            </div>}
            </div>
          </section>;
        })}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <p className="text-sm text-slate-600">Your monthly contract price stays the same, whatever you choose.</p>
          <button disabled={saving || saveDisabled} className="w-full rounded-xl bg-[#26372f] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-[#354b3e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">{saving ? 'Saving your plan…' : 'Save my selections'}</button>
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
