import { useEffect, useState } from 'react';
import { Check, Save } from 'lucide-react';
import type { ApiPlan } from '../types';
import { superAdminApi } from '../services/superAdminApi';

export function SubscriptionsView() {
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<ApiPlan | null>(null);
  const [activeCounts, setActiveCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [planList, companies] = await Promise.all([superAdminApi.plans(), superAdminApi.companies()]);
      setPlans(planList || []);
      const counts: Record<string, number> = {};
      (companies || []).forEach((company: any) => {
        const key = company.subscription?.plan_key;
        if (key) counts[key] = (counts[key] || 0) + 1;
      });
      setActiveCounts(counts);
    } catch (err: any) {
      setError(err?.message || 'Unable to load plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const savePlan = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingPlan) return;
    await superAdminApi.savePlan(editingPlan.key, editingPlan);
    setEditingPlan(null);
    await loadData();
  };

  return (
    <div className="w-full">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1 md:mb-2 text-pine">Subscription Plans</h1>
        <p className="text-pine/70 font-medium text-base md:text-lg">Manage platform pricing and tenant limits.</p>
      </div>
      {error && <div className="mb-5 rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 text-red-700 font-bold">{error}</div>}
      {loading && <div className="mb-5 rounded-2xl border-2 border-pine/10 bg-butter-light px-5 py-4 text-pine/70 font-bold">Loading plans...</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.name} className="bg-butter-light border-2 border-pine/10 p-6 md:p-8 rounded-[2rem] shadow-sm hover:border-pine/20 transition-all flex flex-col group cursor-pointer hover:-translate-y-1">
            <h3 className="text-2xl font-bold text-pine mb-2">{plan.name}</h3>
            <p className="text-4xl font-extrabold text-pine mb-6">₹{Number(plan.monthly_price || 0).toLocaleString('en-IN')}<span className="text-lg text-pine/50 font-medium">/mo</span></p>
            <div className="mb-6">
              <span className="bg-[#d1f4da] text-[#115e3c] border-[#b0e8c1] border px-3 py-1 rounded-full text-xs font-bold inline-block">{activeCounts[plan.key] || 0} Active Tenants</span>
            </div>
            <div className="flex-1 space-y-4 mb-8">
              <p className="font-bold text-sm text-pine/60 uppercase tracking-wider">Features</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-pine font-medium"><Check size={18} className="text-pine" /> {plan.limits?.max_users || 0} users</li>
                <li className="flex items-center gap-3 text-pine font-medium"><Check size={18} className="text-pine" /> {plan.limits?.max_employees || 0} employees</li>
                <li className="flex items-center gap-3 text-pine font-medium"><Check size={18} className="text-pine" /> {plan.limits?.storage_mb || 0} MB storage</li>
                {(plan.allowed_modules || []).map(mod => (
                  <li key={mod} className="flex items-center gap-3 text-pine font-medium"><Check size={18} className="text-pine" /> {mod}</li>
                ))}
              </ul>
            </div>
            <button onClick={() => setEditingPlan(plan)} className="w-full py-3 rounded-xl border-2 border-pine text-pine font-bold group-hover:bg-pine group-hover:text-butter transition-colors cursor-pointer">Edit Plan</button>
          </div>
        ))}
      </div>

      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-pine/50 backdrop-blur-sm" onClick={() => setEditingPlan(null)} />
          <form onSubmit={savePlan} className="relative bg-butter-light border-2 border-pine/10 rounded-[2rem] p-6 md:p-8 max-w-2xl w-full shadow-2xl z-10 space-y-4">
            <h2 className="text-2xl font-black text-pine">Edit {editingPlan.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input value={editingPlan.name} onChange={(event) => setEditingPlan({ ...editingPlan, name: event.target.value })} className="bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-bold outline-none focus:border-pine" />
              <input type="number" value={editingPlan.monthly_price || 0} onChange={(event) => setEditingPlan({ ...editingPlan, monthly_price: Number(event.target.value) })} className="bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-bold outline-none focus:border-pine" />
              <input type="number" value={editingPlan.limits?.max_users || 0} onChange={(event) => setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits, max_users: Number(event.target.value) } })} className="bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-bold outline-none focus:border-pine" placeholder="Max users" />
              <input type="number" value={editingPlan.limits?.max_employees || 0} onChange={(event) => setEditingPlan({ ...editingPlan, limits: { ...editingPlan.limits, max_employees: Number(event.target.value) } })} className="bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-bold outline-none focus:border-pine" placeholder="Max employees" />
            </div>
            <textarea value={(editingPlan.allowed_modules || []).join(', ')} onChange={(event) => setEditingPlan({ ...editingPlan, allowed_modules: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} rows={3} className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-bold outline-none focus:border-pine" placeholder="Modules comma separated" />
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditingPlan(null)} className="flex-1 px-4 py-3 border-2 border-pine/20 text-pine font-bold rounded-xl hover:bg-pine/5 transition-colors">Cancel</button>
              <button type="submit" className="flex-1 px-4 py-3 bg-pine text-butter font-bold rounded-xl hover:bg-pine-light transition-colors flex items-center justify-center gap-2"><Save size={18} /> Save Plan</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
