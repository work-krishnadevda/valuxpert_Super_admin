import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, MoreVertical, Plus, Search, ShieldAlert, Trash2, X } from 'lucide-react';
import type { ApiCompany, ApiFeature, ApiPlan } from '../types';
import { superAdminApi } from '../services/superAdminApi';
import { cn } from '../utils';
import { ConfirmDialog } from '../components/ConfirmDialog';

const emptyForm = {
  name: '',
  display_name: '',
  description: '',
  admin_name: '',
  admin_email: '',
  admin_personal_email: '',
  admin_password: '',
  admin_mobile: '',
  tenant_login_url: 'http://localhost:3008',
  plan: 'starter',
  features: ['hrms', 'case_management'],
};

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
};

export function TenantManagementView() {
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [features, setFeatures] = useState<ApiFeature[]>([]);
  const [search, setSearch] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<ApiCompany | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [companyList, planList, featureList] = await Promise.all([
        superAdminApi.companies(),
        superAdminApi.plans(),
        superAdminApi.features(),
      ]);
      setCompanies(companyList || []);
      setPlans(planList || []);
      setFeatures(featureList || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load companies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCompanies = useMemo(() => {
    const value = search.toLowerCase();
    return companies.filter((company) =>
      [company.name, company.display_name, company.tenant_id, company.admin_contact?.email]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(value)),
    );
  }, [companies, search]);

  const openCreate = () => {
    setEditingCompany(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (company: ApiCompany) => {
    setEditingCompany(company);
    setForm({
      name: company.name || '',
      display_name: company.display_name || '',
      description: company.description || '',
      admin_name: company.admin_contact?.name || '',
      admin_email: company.admin_contact?.email || '',
      admin_personal_email: company.admin_contact?.personal_email || '',
      admin_password: '',
      admin_mobile: company.admin_contact?.mobile || '',
      tenant_login_url: company.admin_contact?.login_url || 'http://localhost:3008',
      plan: company.subscription?.plan_key || 'starter',
      features: company.features?.length ? company.features : [],
    });
    setIsModalOpen(true);
    setActiveDropdownId(null);
  };

  const saveCompany = async () => {
    setSaving(true);
    setError('');

    try {
      if (editingCompany) {
        await superAdminApi.updateCompany(editingCompany._id, form);
        await superAdminApi.updateFeatures(editingCompany._id, form.features);
        await superAdminApi.updateSubscription(editingCompany._id, {
          plan_key: form.plan,
          status: editingCompany.subscription?.status || 'active',
          payment_status: editingCompany.subscription?.payment_status || 'pending',
        });
      } else {
        await superAdminApi.createCompany(form);
      }
      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Unable to save company.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setConfirmState({
      title: editingCompany ? 'Update company?' : 'Create company?',
      message: editingCompany
        ? `Are you sure you want to update ${form.name || editingCompany.name}?`
        : `Are you sure you want to create ${form.name || 'this company'}?`,
      confirmLabel: editingCompany ? 'Update' : 'Create',
      onConfirm: saveCompany,
    });
  };

  const toggleFeature = (featureKey: string) => {
    setForm((current) => ({
      ...current,
      features: current.features.includes(featureKey)
        ? current.features.filter((feature) => feature !== featureKey)
        : [...current.features, featureKey],
    }));
  };

  const changeStatus = (company: ApiCompany) => {
    const isSuspended = company.status === 'suspended';
    setConfirmState({
      title: isSuspended ? 'Reactivate company?' : 'Suspend company?',
      message: isSuspended
        ? `Are you sure you want to reactivate ${company.name}?`
        : `Are you sure you want to suspend access for ${company.name}?`,
      confirmLabel: isSuspended ? 'Reactivate' : 'Suspend',
      danger: !isSuspended,
      onConfirm: async () => {
        if (isSuspended) {
          await superAdminApi.activateCompany(company._id);
        } else {
          await superAdminApi.suspendCompany(company._id);
        }
        setActiveDropdownId(null);
        await loadData();
      },
    });
  };

  const deleteCompany = (company: ApiCompany) => {
    setConfirmState({
      title: 'Soft delete company?',
      message: `Are you sure you want to soft delete ${company.name}? This company will no longer be active.`,
      confirmLabel: 'Soft delete',
      danger: true,
      onConfirm: async () => {
        await superAdminApi.deleteCompany(company._id);
        setActiveDropdownId(null);
        await loadData();
      },
    });
  };

  const confirmAction = async () => {
    if (!confirmState) return;
    try {
      setSaving(true);
      await confirmState.onConfirm();
      setConfirmState(null);
    } catch (err: any) {
      setError(err?.message || 'Action failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1 md:mb-2 text-pine">Tenants Management</h1>
          <p className="text-pine/70 font-medium text-base md:text-lg">Manage companies, subscriptions, feature access, users, and tenant setup from one place.</p>
        </div>
        <button onClick={openCreate} className="bg-pine text-butter hover:bg-pine/90 transition-colors px-5 md:px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 shadow-sm whitespace-nowrap cursor-pointer">
          <Plus strokeWidth={2.5} size={20} />
          Create Company
        </button>
      </div>

      {error && <div className="mb-5 rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 text-red-700 font-bold">{error}</div>}
      {loading && <div className="mb-5 rounded-2xl border-2 border-pine/10 bg-butter-light px-5 py-4 text-pine/70 font-bold">Loading companies from backend...</div>}

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-butter-light border-2 border-pine/10 rounded-2xl md:rounded-[2rem] flex flex-col items-stretch overflow-hidden">
          <div className="p-4 md:p-6 border-b border-pine/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pine/50" size={20} />
              <input
                type="text"
                placeholder="Search companies..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-butter border-2 border-pine/20 rounded-full py-2.5 md:py-3 pl-12 pr-4 text-pine placeholder:text-pine/50 font-medium outline-none focus:border-pine transition-all shadow-sm"
              />
            </div>
            <div className="text-sm font-bold text-pine/60 shrink-0">
              Showing {filteredCompanies.length} tenants
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap min-w-[880px]">
              <thead>
                <tr className="border-b border-pine/10 text-pine/60 uppercase text-xs md:text-sm tracking-wider">
                  <th className="p-4 md:p-6 font-bold">Company</th>
                  <th className="p-4 md:p-6 font-bold">Plan</th>
                  <th className="p-4 md:p-6 font-bold">Limits</th>
                  <th className="p-4 md:p-6 font-bold">Status</th>
                  <th className="p-4 md:p-6 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pine/5">
                {filteredCompanies.map((company) => (
                  <tr key={company._id} className="hover:bg-pine/[0.02] transition-colors group">
                    <td className="p-4 md:p-6">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 bg-butter border-2 border-pine/10 rounded-xl flex items-center justify-center text-pine font-bold text-lg shadow-sm">
                          {company.name?.charAt(0) || 'V'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-base md:text-lg text-pine leading-tight truncate">{company.name}</p>
                          <p className="text-xs md:text-sm font-mono opacity-60 truncate mt-0.5">{company.tenant_id}</p>
                          <p className="text-xs text-pine/50 font-bold truncate">{company.admin_contact?.email || 'No admin email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 md:p-6">
                      <span className="font-bold border-2 border-pine/10 bg-butter/50 px-3 py-1.5 rounded-full text-xs md:text-sm inline-flex">
                        {company.subscription?.plan_name || '-'}
                      </span>
                    </td>
                    <td className="p-4 md:p-6 font-semibold text-pine/80 text-sm">
                      {company.limits?.max_users || 0} users / {company.limits?.max_employees || 0} employees
                    </td>
                    <td className="p-4 md:p-6">
                      <span className={cn(
                        "font-bold px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm inline-flex items-center gap-1.5 border-2 shadow-sm capitalize",
                        company.status === 'active'
                          ? "bg-[#d1f4da] text-[#115e3c] border-[#b0e8c1]"
                          : "bg-[#ffe0e0] text-[#8a2222] border-[#ffc2c2]",
                      )}>
                        {company.status === 'active' ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
                        {company.status}
                      </span>
                    </td>
                    <td className="p-4 md:p-6 text-right relative">
                      <button onClick={() => setActiveDropdownId(activeDropdownId === company._id ? null : company._id)} className="text-pine/50 hover:text-pine hover:bg-pine/10 transition-colors p-2 rounded-full cursor-pointer">
                        <MoreVertical size={20} />
                      </button>
                      {activeDropdownId === company._id && (
                        <div className="absolute right-6 top-14 mt-1 w-52 bg-butter border-2 border-pine/10 rounded-xl shadow-lg z-20 py-2 flex flex-col overflow-hidden">
                          <button onClick={() => openEdit(company)} className="w-full text-left px-4 py-2.5 hover:bg-pine/10 text-pine font-semibold text-sm cursor-pointer transition-colors">Edit details</button>
                          <button onClick={() => changeStatus(company)} className="w-full text-left px-4 py-2.5 hover:bg-pine/10 text-pine font-semibold text-sm cursor-pointer transition-colors">
                            {company.status === 'suspended' ? 'Reactivate access' : 'Suspend access'}
                          </button>
                          <div className="h-px bg-pine/10 my-1 w-full" />
                          <button onClick={() => deleteCompany(company)} className="w-full text-left px-4 py-2.5 hover:bg-[#ffe0e0] text-[#8a2222] font-semibold text-sm cursor-pointer transition-colors flex items-center gap-2">
                            <Trash2 size={15} /> Soft delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-pine/50 backdrop-blur-sm cursor-pointer" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-butter-light border-2 border-pine/10 rounded-[2rem] p-6 md:p-8 max-w-3xl w-full shadow-2xl z-10 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-pine tracking-tight">{editingCompany ? 'Edit Company' : 'Create Company'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-pine/50 hover:bg-pine/10 hover:text-pine rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h3 className="text-lg font-black text-pine mb-3">Company Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ['name', 'Company Name', 'text', true],
                  ['display_name', 'Display Name', 'text', false],
                ].map(([key, label, type, required]) => (
                  <div key={String(key)}>
                    <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">{label}</label>
                    <input
                      required={Boolean(required)}
                      type={String(type)}
                      value={(form as any)[key as string]}
                      onChange={(event) => setForm({ ...form, [key as string]: event.target.value })}
                      className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-medium outline-none focus:border-pine transition-colors shadow-sm"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Plan</label>
                  <select value={form.plan} onChange={(event) => setForm({ ...form, plan: event.target.value })} className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-bold outline-none focus:border-pine transition-colors shadow-sm">
                    {plans.map((plan) => <option key={plan.key} value={plan.key}>{plan.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Description</label>
                  <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-medium outline-none focus:border-pine transition-colors shadow-sm" />
                </div>
              </div>

              <div className="border-t border-pine/10 pt-5">
                <h3 className="text-lg font-black text-pine mb-3">Default Tenant Admin Credentials</h3>
                <p className="text-sm font-bold text-pine/60 mb-4">
                  These credentials are for the tenant admin. Send them to the personal email together with the tenant software URL.
                  {editingCompany && (
                    <span className="block mt-2 text-amber-800">
                      When editing, changing Login Email or Login Password updates the real tenant login account in the database.
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ['admin_name', 'Admin Name', 'text', !editingCompany],
                    ['admin_email', 'Login Email', 'email', !editingCompany],
                    ['admin_password', 'Login Password', 'text', false],
                    ['admin_personal_email', 'Personal Email', 'email', false],
                    ['admin_mobile', 'Mobile Number', 'text', false],
                    ['tenant_login_url', 'Tenant Software URL', 'url', false],
                  ].map(([key, label, type, required]) => (
                    <div key={String(key)} className={key === 'tenant_login_url' ? 'md:col-span-2' : ''}>
                      <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">{label}</label>
                      <input
                        required={Boolean(required)}
                        type={String(type)}
                        value={(form as any)[key as string]}
                        onChange={(event) => setForm({ ...form, [key as string]: event.target.value })}
                        placeholder={key === 'tenant_login_url' ? 'Example: http://localhost:3008/login' : undefined}
                        className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-medium outline-none focus:border-pine transition-colors shadow-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-pine/10 pt-5">
                <h3 className="text-lg font-black text-pine mb-3">Feature Flags</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((feature) => (
                    <label key={feature.key} className="flex items-start gap-3 rounded-2xl bg-butter border border-pine/10 p-4 cursor-pointer hover:border-pine/30">
                      <input type="checkbox" checked={form.features.includes(feature.key)} onChange={() => toggleFeature(feature.key)} className="mt-1" />
                      <span>
                        <strong className="block text-pine">{feature.name}</strong>
                        <small className="text-pine/55 font-bold">{feature.description}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border-2 border-pine/20 text-pine font-bold rounded-xl hover:bg-pine/5 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-pine text-butter font-bold rounded-xl hover:bg-pine-light transition-colors shadow-md cursor-pointer disabled:opacity-60">
                  {saving ? 'Saving...' : editingCompany ? 'Update Company' : 'Create & Setup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title || ''}
        message={confirmState?.message || ''}
        confirmLabel={confirmState?.confirmLabel}
        danger={confirmState?.danger}
        loading={saving}
        onCancel={() => setConfirmState(null)}
        onConfirm={confirmAction}
      />
    </div>
  );
}
