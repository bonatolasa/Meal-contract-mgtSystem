import { useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { Check, XCircle, Utensils, Coffee, Sun, Moon, CalendarDays, Clock3, Sparkles, ArrowRight, History, CircleDot } from 'lucide-react';
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
  const selectedCount = mealTypes.filter(({ key }) => selection[key] !== 'PENDING').length;
  const displayName = (item) => language === 'Afaan Oromo' ? item.nameAfaanOromo || item.nameEnglish : language === 'Amharic' ? item.nameAmharic || item.nameEnglish : item.nameEnglish;
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
    <div className="mx-auto max-w-[1500px] pb-10 text-[#28271f]">
      <header className="mb-8 border-b border-[#d9d5ca] pb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8c5d3d]"><Utensils size={15} /> Table & Thyme <span className="text-[#c5bdae]">/</span> Meal planner</div>
          <label className="flex items-center gap-2 rounded-full border border-[#d9d5ca] bg-[#fffdf8] py-2 pl-4 pr-2 text-xs font-semibold uppercase tracking-wider text-[#827d70]"><CalendarDays size={15} /><input aria-label="Select meal date" type="date" min={today} max={tomorrow} value={date} onChange={changeDate} className="border-0 bg-transparent py-1 text-sm font-semibold normal-case tracking-normal text-[#29291f] outline-none focus:ring-0" /></label>
        </div>
        <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="text-sm font-medium text-[#8a877c]">{format(new Date(`${date}T12:00:00`), 'EEEE, MMMM d')}</p><h1 className="mt-1 font-serif text-4xl font-medium leading-tight tracking-tight sm:text-5xl">What sounds good?</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#777467]">Choose your meals for the day. Your selections are covered by your monthly plan.</p></div>
          <div className="flex items-center gap-4 lg:pb-1"><div className="text-right"><span className="block text-2xl font-semibold leading-none">{selectedCount}<span className="text-[#aaa596]">/3</span></span><span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a877c]">Meals planned</span></div><div className="h-10 w-px bg-[#d9d5ca]" /><label className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a877c]">Language<select value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-1 block rounded-lg border-[#d9d5ca] bg-[#fffdf8] px-2 py-1.5 text-xs font-semibold normal-case tracking-normal text-[#29291f]"><option>English</option><option>Afaan Oromo</option><option>Amharic</option></select></label></div>
        </div>
      </header>

      {contract && <div className="mb-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-[#d9d5ca] py-3 text-xs text-[#777467]"><span className="font-bold uppercase tracking-[0.14em] text-[#8c5d3d]">Monthly plan</span><span>{contract.status} · ETB {Number(contract.monthlyPrice).toLocaleString()}</span><span>Payment {contract.paymentStatus}</span><span>Valid through {format(new Date(contract.endDate), 'MMM d, yyyy')}</span></div>}

      {loading ? <div className="grid min-h-64 place-items-center bg-[#fffdf8] text-sm text-[#777467]">Preparing today’s menu…</div> : !contract ? (
        <div className="border-l-4 border-[#d79b50] bg-[#fff8e9] p-6 text-sm text-[#78552c]">You need an active monthly contract for this date. Contact the restaurant owner.</div>
      ) : <>
        <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-2xl">The daily table</h2><p className="hidden text-xs text-[#8a877c] sm:block">Menu prices are listed for reference</p></div>
        <form onSubmit={save} className="grid items-start gap-4 lg:grid-cols-3">
        {mealTypes.map(({ key, label, icon: Icon, time }) => {
          const options = menuFor(key);
          const lockedMeal = Boolean(locked[key]);
          const mealLabel = translatedMeals[key][language] || label;
          const eating = selection[key] === 'EATING';
          const notEating = selection[key] === 'NOT_EATING';
          return <section key={key} className={`overflow-hidden border bg-[#fffdf8] transition ${eating ? 'border-[#668453] shadow-[0_8px_30px_rgba(65,87,51,0.12)]' : notEating ? 'border-[#d9d5ca]' : 'border-[#d9d5ca]'}`}>
            <div className="border-b border-[#e8e4da] p-5">
              <div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className={`grid h-11 w-11 place-items-center rounded-full ${eating ? 'bg-[#e6eddd] text-[#58734f]' : 'bg-[#f0eee7] text-[#797568]'}`}><Icon size={20} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a17a52]">{time}</p><h3 className="mt-0.5 font-serif text-2xl">{mealLabel}</h3></div></div>{lockedMeal && <span className="rounded-full bg-[#edeae2] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#797568]">Closed</span>}</div>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-[#8a877c]"><Clock3 size={13} /> Selection closes {deadlines[key] || '—'} {deadlines.timezone || ''}</p>
              <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" aria-pressed={eating} disabled={lockedMeal} onClick={() => setSelection((current) => ({ ...current, [key]: 'EATING' }))} className={`flex min-h-10 items-center justify-center gap-2 border px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${eating ? 'border-[#526d43] bg-[#526d43] text-white' : 'border-[#d9d5ca] bg-transparent text-[#5d5a4f] hover:border-[#879976]'}`}><Check size={14} />Having this</button><button type="button" aria-pressed={notEating} disabled={lockedMeal} onClick={() => setSelection((current) => ({ ...current, [key]: 'NOT_EATING', [`${key}Menu`]: '' }))} className={`flex min-h-10 items-center justify-center gap-2 border px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${notEating ? 'border-[#777467] bg-[#777467] text-white' : 'border-[#d9d5ca] bg-transparent text-[#777467] hover:border-[#aaa596]'}`}><XCircle size={14} />Skipping</button></div>
            </div>
            <div className="p-4">
              {eating ? options.length ? <fieldset disabled={lockedMeal}><legend className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#908b7d]">Choose one dish</legend><div className="space-y-2">{options.map((entry) => { const item = entry.menuItem || {}; const name = displayName(item); const chosen = selection[`${key}Menu`] === entry._id; return <label key={entry._id} className={`flex cursor-pointer items-center gap-3 border p-3 transition ${chosen ? 'border-[#789364] bg-[#f1f5eb]' : 'border-[#e8e4da] bg-white hover:border-[#a3b195]'} ${lockedMeal ? 'cursor-not-allowed opacity-60' : ''}`}><input type="radio" required name={`${key}Menu`} value={entry._id} checked={chosen} onChange={() => setSelection((current) => ({ ...current, [`${key}Menu`]: entry._id }))} className="h-4 w-4 accent-[#526d43]" /><CircleDot size={15} className={chosen ? 'text-[#526d43]' : 'text-[#c9c5b9]'} /><span className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</span><span className="text-xs font-medium text-[#777467]">ETB {Number(entry.displayPrice).toLocaleString()}</span></label>; })}</div>{!selection[`${key}Menu`] && <p className="mt-2 text-[11px] text-[#a17a52]">Select a dish to finish this meal.</p>}</fieldset> : <p className="bg-[#fff5e4] p-3 text-xs text-[#8b6031]">No {label.toLowerCase()} menu is available for this date.</p> : <div className="py-3 text-center text-xs text-[#9a9689]">{notEating ? 'You marked this meal as skipped.' : 'Choose whether you are having this meal.'}</div>}
              {eating && selection[`${key}Menu`] && <p className="mt-3 border-t border-[#e8e4da] pt-3 text-xs text-[#58734f]">Selected · included in your monthly plan</p>}
            </div>
          </section>;
        })}
        <div className="sticky bottom-3 z-10 flex flex-col justify-between gap-3 border border-[#d9d5ca] bg-[#28271f] p-4 text-white shadow-xl sm:col-span-3 sm:flex-row sm:items-center sm:px-6"><div><p className="text-sm font-semibold">Your day, your way</p><p className="mt-1 text-xs text-white/60">{selectedCount} of 3 meals planned · Monthly price stays the same</p></div><button disabled={saving || saveDisabled} className="flex min-h-12 w-full items-center justify-center gap-2 bg-[#c67b4d] px-6 text-sm font-bold text-white transition hover:bg-[#b96c40] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">{saving ? 'Saving…' : 'Save daily plan'} {!saving && <ArrowRight size={16} />}</button></div>
        </form>
      </>}

      <section className="mt-10 border-t border-[#d9d5ca] pt-5">
        <div className="mb-3 flex items-center gap-2 text-[#8c5d3d]"><History size={16} /><h2 className="text-xs font-bold uppercase tracking-[0.18em]">Recent meal plans</h2></div>
        {history.length ? <div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left"><thead><tr className="border-b border-[#d9d5ca] text-[10px] uppercase tracking-wider text-[#8a877c]"><th className="py-3">Date</th>{mealTypes.map(({ key, label }) => <th className="py-3" key={key}>{label}</th>)}</tr></thead><tbody>{history.slice(0, 14).map((item) => <tr key={item._id} className="border-b border-[#e8e4da]"><td className="py-3 text-sm font-medium">{item.date}</td>{mealTypes.map(({ key }) => <td className="py-3 text-xs" key={key}><span className={item[key] === 'EATING' ? 'font-semibold text-[#58734f]' : item[key] === 'NOT_EATING' ? 'text-[#8a877c]' : 'text-[#aaa596]'}>{item[key] === 'EATING' ? 'Planned' : item[key] === 'NOT_EATING' ? 'Skipped' : 'Pending'}</span></td>)}</tr>)}</tbody></table></div> : <p className="text-sm text-[#8a877c]">Your submitted meal plans will appear here.</p>}
      </section>
    </div>
  );
}
