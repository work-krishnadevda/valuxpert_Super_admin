import { useEffect, useState } from 'react';
import { ArrowLeft, CreditCard, Plus } from 'lucide-react';
import type { ApiCompany, CompanyBillingSummary, CompanyPayment } from '../types';
import { superAdminApi } from '../services/superAdminApi';

export function CompanyPaymentView({ companyId, onBack }: { companyId: string; onBack: () => void }) {
  const [company, setCompany] = useState<ApiCompany | null>(null);
  const [billing, setBilling] = useState<CompanyBillingSummary | null>(null);
  const [payments, setPayments] = useState<CompanyPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [billingForm, setBillingForm] = useState({
    price_per_employee: '',
    start_date: '',
    end_date: '',
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_date: new Date().toISOString().slice(0, 10),
    payment_mode: 'bank_transfer',
    note: '',
  });
  const [savingBilling, setSavingBilling] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    loadPaymentPage();
  }, [companyId]);

  const loadPaymentPage = async () => {
    setLoading(true);
    setError('');
    try {
      const [companyData, billingData, paymentData] = await Promise.all([
        superAdminApi.company(companyId),
        superAdminApi.companyBilling(companyId),
        superAdminApi.companyPayments(companyId),
      ]);
      setCompany(companyData);
      setBilling(billingData);
      setPayments(paymentData || []);
      setBillingForm({
        price_per_employee: String(billingData?.pricePerEmployee || companyData.billing?.price_per_employee || ''),
        start_date: toDateInput(billingData?.startDate || companyData.billing?.start_date || companyData.subscription?.start_date),
        end_date: toDateInput(billingData?.endDate || companyData.billing?.end_date || companyData.subscription?.renewal_date),
      });
    } catch (err: any) {
      setError(err?.message || 'Unable to load payment details.');
    } finally {
      setLoading(false);
    }
  };

  const saveBilling = async () => {
    setSavingBilling(true);
    setError('');
    try {
      const nextBilling = await superAdminApi.updateCompanyBilling(companyId, billingForm);
      setBilling(nextBilling);
    } catch (err: any) {
      setError(err?.message || 'Unable to save billing details.');
    } finally {
      setSavingBilling(false);
    }
  };

  const addPayment = async () => {
    setSavingPayment(true);
    setError('');
    try {
      const result = await superAdminApi.addCompanyPayment(companyId, {
        ...paymentForm,
        amount: Number(paymentForm.amount),
      });
      const nextPayments = await superAdminApi.companyPayments(companyId);
      setBilling(result.summary);
      setPayments(nextPayments || []);
      setPaymentForm({
        amount: '',
        payment_date: new Date().toISOString().slice(0, 10),
        payment_mode: 'bank_transfer',
        note: '',
      });
      setShowAddPayment(false);
    } catch (err: any) {
      setError(err?.message || 'Unable to add payment.');
    } finally {
      setSavingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[2rem] border-2 border-pine/10 bg-butter-light p-8 text-center font-black text-pine/60">
        Loading payment details...
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-full border-2 border-pine/10 px-4 py-2 font-black text-pine hover:bg-pine/5">
          <ArrowLeft size={18} /> Back to company
        </button>
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button onClick={onBack} className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-pine/10 px-4 py-2 text-sm font-black text-pine hover:bg-pine/5">
            <ArrowLeft size={18} /> Back to company
          </button>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-pine/45">Company Payment</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-black tracking-tight text-pine">
            {company?.display_name || company?.name || 'Company'}
          </h1>
          <p className="mt-1 font-mono text-sm font-bold text-pine/55">{company?.tenant_id}</p>
        </div>
        <button
          onClick={() => setShowAddPayment((value) => !value)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-pine px-5 py-3 text-sm font-black text-butter hover:bg-pine/90"
        >
          <Plus size={18} /> Add Payment
        </button>
      </div>

      {error && (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard label="Total Amount" value={formatCurrency(billing?.totalAmount || 0)} helper={`${billing?.employeeCount || 0} employees x ${formatCurrency(billing?.pricePerEmployee || 0)} / month`} dark />
        <SummaryCard label="Received Amount" value={formatCurrency(billing?.paidAmount || 0)} helper={`${payments.length} payment entries`} />
        <SummaryCard label="Pending Amount" value={formatCurrency(billing?.pendingAmount || 0)} helper={`${billing?.billingDays || 0} billing days`} />
      </div>

      <section className="rounded-3xl border-2 border-pine/10 bg-butter-light p-5 md:p-6">
        <h2 className="mb-1 text-xl font-black text-pine">Pricing & Subscription Dates</h2>
        <p className="mb-5 text-sm font-bold text-pine/55">
          Amount = employee count x per employee monthly price x billing days / 30
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InputField
            label="Price / Employee / Month"
            type="number"
            value={billingForm.price_per_employee}
            onChange={(value) => setBillingForm((form) => ({ ...form, price_per_employee: value }))}
          />
          <InputField
            label="Start Date"
            type="date"
            value={billingForm.start_date}
            onChange={(value) => setBillingForm((form) => ({ ...form, start_date: value }))}
          />
          <InputField
            label="End Date"
            type="date"
            value={billingForm.end_date}
            onChange={(value) => setBillingForm((form) => ({ ...form, end_date: value }))}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <InfoTile label="Employees" value={formatValue(billing?.employeeCount)} />
          <InfoTile label="Billing Days" value={formatValue(billing?.billingDays)} />
          <InfoTile label="Total Amount" value={formatCurrency(billing?.totalAmount || 0)} />
        </div>
        <button
          onClick={saveBilling}
          disabled={savingBilling}
          className="mt-4 rounded-full bg-pine px-5 py-2.5 text-sm font-black text-butter hover:bg-pine/90 disabled:opacity-60"
        >
          {savingBilling ? 'Saving...' : 'Save Pricing'}
        </button>
      </section>

      {showAddPayment && (
        <section className="rounded-3xl border-2 border-pine/10 bg-butter-light p-5 md:p-6">
          <h2 className="mb-4 text-xl font-black text-pine">Add Payment</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <InputField
              label="Payment Amount"
              type="number"
              value={paymentForm.amount}
              onChange={(value) => setPaymentForm((form) => ({ ...form, amount: value }))}
            />
            <InputField
              label="Payment Date"
              type="date"
              value={paymentForm.payment_date}
              onChange={(value) => setPaymentForm((form) => ({ ...form, payment_date: value }))}
            />
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wider text-pine/45">Payment Mode</span>
              <select
                value={paymentForm.payment_mode}
                onChange={(event) => setPaymentForm((form) => ({ ...form, payment_mode: event.target.value }))}
                className="mt-1 w-full rounded-2xl border border-pine/10 bg-butter px-3 py-2 font-bold text-pine outline-none focus:border-pine/30"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </label>
            <InputField
              label="Note"
              value={paymentForm.note}
              onChange={(value) => setPaymentForm((form) => ({ ...form, note: value }))}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <InfoTile label="Total" value={formatCurrency(billing?.totalAmount || 0)} />
            <InfoTile label="Received" value={formatCurrency(billing?.paidAmount || 0)} />
            <InfoTile label="Pending" value={formatCurrency(billing?.pendingAmount || 0)} />
          </div>
          <button
            onClick={addPayment}
            disabled={savingPayment || !paymentForm.amount}
            className="mt-4 rounded-full bg-pine px-5 py-2.5 text-sm font-black text-butter hover:bg-pine/90 disabled:opacity-60"
          >
            {savingPayment ? 'Adding...' : 'Save Payment'}
          </button>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border-2 border-pine/10 bg-butter-light">
        <div className="border-b border-pine/10 px-5 py-4">
          <h2 className="text-xl font-black text-pine">All Transactions</h2>
        </div>
        {payments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-pine/5 text-xs font-black uppercase tracking-wider text-pine/55">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Filled By</th>
                  <th className="px-4 py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id} className="border-t border-pine/10">
                    <td className="px-4 py-3 font-bold text-pine">{formatDateTime(payment.payment_date || payment.created_at)}</td>
                    <td className="px-4 py-3 font-black text-pine">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-3 font-bold capitalize text-pine/70">{formatValue(payment.payment_mode?.replace(/_/g, ' '))}</td>
                    <td className="px-4 py-3 font-bold text-pine/70">{payment.received_by_name || payment.received_by_email || '-'}</td>
                    <td className="px-4 py-3 font-bold text-pine/60">{payment.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-6 text-sm font-bold text-pine/55">No payment transactions added yet.</div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, helper, dark = false }: { label: string; value: string | number; helper: string; dark?: boolean }) {
  return (
    <div className={`rounded-3xl p-5 shadow-sm ${dark ? 'bg-pine text-butter' : 'border-2 border-pine/10 bg-butter-light text-pine'}`}>
      <div className="flex items-center gap-2">
        <CreditCard size={22} />
        <p className={`text-xs font-black uppercase tracking-wider ${dark ? 'text-butter/60' : 'text-pine/50'}`}>{label}</p>
      </div>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <p className={`mt-1 text-sm font-bold ${dark ? 'text-butter/70' : 'text-pine/60'}`}>{helper}</p>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-butter border border-pine/10 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-wider text-pine/45">{label}</p>
      <p className="mt-1 break-words font-bold text-pine">{value}</p>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wider text-pine/45">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-2xl border border-pine/10 bg-butter px-3 py-2 font-bold text-pine outline-none focus:border-pine/30"
      />
    </label>
  );
}

function formatDateTime(value?: string) {
  return value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
}

function formatValue(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
}

function formatCurrency(value?: string | number | null) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function toDateInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}
