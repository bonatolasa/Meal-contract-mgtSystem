import { useEffect, useState } from 'react';
import { getPayments, createPayment, getContracts, getCustomers, getOutstandingPayments, reversePayment } from '../services/api';
import { toast } from 'react-hot-toast';
import { CreditCard, Plus, DollarSign, AlertTriangle, X } from 'lucide-react';

const emptyForm = { contract: '', customer: '', amount: 0, paymentMethod: 'cash', reference: '', notes: '' };

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [outstanding, setOutstanding] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [p, c, cust, o] = await Promise.all([getPayments(), getContracts(), getCustomers(), getOutstandingPayments()]);
      setPayments(p.data || []);
      setContracts(c.data || []);
      setCustomers(cust.data || []);
      setOutstanding(o.data || []);
    } catch (err) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPayment(form);
      toast.success('Payment recorded');
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const totalOutstanding = outstanding.reduce((sum, c) => sum + (Number(c.remainingBalance) || 0), 0);

  const downloadReceipt = async (payment) => {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    pdf.setFontSize(18);
    pdf.text('Payment Receipt', 14, 20);
    pdf.setFontSize(11);
    const lines = [
      `Receipt: ${payment._id}`,
      `Date: ${payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : '—'}`,
      `Customer: ${payment.customer?.name || '—'}`,
      `Contract: ${payment.contract?.contractId || '—'}`,
      `Amount: ETB ${Number(payment.amount).toLocaleString()}`,
      `Method: ${payment.paymentMethod}`,
      `Reference: ${payment.reference || '—'}`,
      `Recorded by: ${payment.recordedBy?.name || '—'}`,
      `Status: ${payment.status}`,
    ];
    pdf.text(lines, 14, 34);
    pdf.save(`receipt-${payment._id}.pdf`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard size={28} className="text-indigo-600" /> Payments
          </h1>
          <p className="text-gray-600 mt-1">Track payments, debts, and outstanding balances</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus size={18} /> Record Payment
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-green-600">ETB {payments.filter((p) => p.status !== 'reversed').reduce((s, p) => s + (Number(p.amount) || 0), 0).toLocaleString()}</p>
            </div>
            <DollarSign className="text-green-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding Balance</p>
              <p className="text-2xl font-bold text-red-600">ETB {totalOutstanding.toLocaleString()}</p>
            </div>
            <AlertTriangle className="text-red-500" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Contracts with Balance</p>
              <p className="text-2xl font-bold text-yellow-600">{outstanding.length}</p>
            </div>
            <CreditCard className="text-yellow-500" size={32} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <h3 className="text-lg font-semibold text-gray-900 px-6 py-4 border-b">Outstanding Balances</h3>
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">Contract ID</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">Customer</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">Total</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">Paid</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {outstanding.map((c) => (
              <tr key={c._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium">{c.contractId}</td>
                <td className="px-6 py-4 text-sm">{c.customer?.name || c.customer}</td>
                <td className="px-6 py-4 text-sm">ETB {c.totalAmount?.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-green-600">ETB {c.amountPaid?.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm font-medium text-red-600">ETB {c.remainingBalance?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {outstanding.length === 0 && <p className="text-center py-4 text-gray-500">No outstanding balances.</p>}
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h3 className="text-lg font-semibold text-gray-900 px-6 py-4 border-b">Payment History</h3>
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Date</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Customer</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Contract</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Amount</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Method</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Reference</th>
                <th className="px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((p) => (
                <tr key={p._id} className={`hover:bg-gray-50 ${p.status === 'reversed' ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.paymentDate?.slice(0, 10) || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.customer?.name || p.customer}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.contract?.contractId || p.contract}</td>
                  <td className="px-6 py-4 text-sm font-medium text-green-600">ETB {Number(p.amount).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{p.paymentMethod}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.reference || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    {p.status === 'reversed' ? <span className="text-red-600">Reversed</span> : <><button onClick={() => downloadReceipt(p)} className="text-indigo-700 hover:underline mr-3">Receipt</button><button onClick={async () => {
                      const note = window.prompt('Reason for reversing this payment:');
                      if (!note?.trim()) return;
                      try { await reversePayment(p._id, note.trim()); toast.success('Payment reversed'); load(); }
                      catch (error) { toast.error(error.response?.data?.message || 'Could not reverse payment'); }
                    }} className="text-red-600 hover:underline">Reverse</button></>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <p className="text-center py-8 text-gray-500">No payments recorded.</p>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Record Payment</h3>
              <button onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select value={form.contract} onChange={(e) => {
                const contract = contracts.find((item) => item._id === e.target.value);
                setForm({ ...form, contract: e.target.value, customer: contract?.customer?._id || contract?.customer || '' });
              }} className="w-full px-3 py-2 border rounded-md" required>
                <option value="">Select Contract</option>
                {contracts.filter((c) => Number(c.remainingBalance) > 0).map((c) => <option key={c._id} value={c._id}>{c.contractId} - {c.customer?.name || c.customer} (ETB {c.remainingBalance} due)</option>)}
              </select>
              <input type="number" min="0.01" step="0.01" max={contracts.find((c) => c._id === form.contract)?.remainingBalance || undefined} placeholder="Amount (ETB)" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="w-full px-3 py-2 border rounded-md">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="card">Card</option>
              </select>
              <input placeholder="Reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border rounded-md" />
              <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700">Record Payment</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
