import { useEffect, useState } from 'react';
import { ReceiptText } from 'lucide-react';
import { superAdminApi } from '../services/superAdminApi';

export function BillingView() {
  const [billing, setBilling] = useState<any>({ invoices: [], monthlyRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    superAdminApi.billing()
      .then((data) => setBilling(data || { invoices: [], monthlyRevenue: 0 }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-6xl">
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1 md:mb-2 text-pine">Billing & Revenue</h1>
          <p className="text-pine/70 font-medium text-base md:text-lg">Payment status, invoice history, renewals, and revenue reports.</p>
        </div>
        <div className="bg-pine text-butter px-6 py-3 rounded-full font-black shadow-sm">
          ₹{Number(billing.monthlyRevenue || 0).toLocaleString('en-IN')} this month
        </div>
      </div>

      <div className="bg-butter-light border-2 border-pine/10 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-pine/10 text-pine/60 uppercase text-xs tracking-wider">
                <th className="p-6 font-bold">Invoice</th>
                <th className="p-6 font-bold">Company</th>
                <th className="p-6 font-bold">Amount</th>
                <th className="p-6 font-bold">Status</th>
                <th className="p-6 font-bold text-right">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine/5">
              {loading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-pine/60 font-bold">Loading billing data...</td>
                </tr>
              )}
              {!loading && (billing.invoices || []).map((invoice: any) => (
                <tr key={invoice._id} className="hover:bg-pine/[0.02] transition-colors">
                  <td className="p-6 font-bold text-pine">
                    <div className="flex items-center gap-2">
                      <ReceiptText size={17} className="text-pine/60" />
                      {invoice.invoice_number}
                    </div>
                  </td>
                  <td className="p-6 text-sm font-medium text-pine/80">{invoice.company_name || '-'}</td>
                  <td className="p-6 font-black text-pine">₹{Number(invoice.amount || 0).toLocaleString('en-IN')}</td>
                  <td className="p-6">
                    <span className="bg-[#d1f4da] text-[#115e3c] border border-[#b0e8c1] font-bold px-3 py-1 rounded-full text-xs capitalize">
                      {invoice.payment_status || 'pending'}
                    </span>
                  </td>
                  <td className="p-6 text-sm font-medium text-pine/60 text-right">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
              {!loading && (!billing.invoices || billing.invoices.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-pine/50 font-bold">No invoices found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
