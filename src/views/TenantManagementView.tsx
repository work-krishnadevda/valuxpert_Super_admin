import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, MoreVertical, Plus, RotateCcw, Search, ShieldAlert, Trash2, X } from 'lucide-react';
import type { ApiAuditLog, ApiCompany, ApiFeature, ApiPlan } from '../types';
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
  tenant_login_url: 'https://valuxpert.vercel.app',
  plan: 'starter',
  features: ['hrms', 'case_management'],
};

const CORE_FEATURE_KEY = 'case_management';

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
};

type TenantViewMode = 'all' | 'suspended' | 'trash';

type DeleteReasonState = {
  company: ApiCompany;
  reason: string;
};

type CompanyViewDetails = {
  company: ApiCompany;
  employeeCount: number;
  activeUsers: number;
  inactiveUsers: number;
  auditLogs: ApiAuditLog[];
};

function TenantTableSkeleton() {
  return (
    <tbody className="divide-y divide-pine/5">
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="animate-pulse">
          <td className="p-4 md:p-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-pine/10" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-pine/10" />
                <div className="h-3 w-28 rounded bg-pine/10" />
                <div className="h-3 w-36 rounded bg-pine/10" />
              </div>
            </div>
          </td>
          <td className="p-4 md:p-6"><div className="h-8 w-28 rounded-full bg-pine/10" /></td>
          <td className="p-4 md:p-6"><div className="h-4 w-36 rounded bg-pine/10" /></td>
          <td className="p-4 md:p-6"><div className="h-8 w-24 rounded-full bg-pine/10" /></td>
          <td className="p-4 md:p-6"><div className="ml-auto h-8 w-8 rounded-full bg-pine/10" /></td>
        </tr>
      ))}
    </tbody>
  );
}

export function TenantManagementView({
  mode = 'all',
  onNavigate,
}: {
  mode?: TenantViewMode;
  onNavigate?: (view: string) => void;
}) {
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [deleteReasonState, setDeleteReasonState] = useState<DeleteReasonState | null>(null);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [viewDetails, setViewDetails] = useState<CompanyViewDetails | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const pageMeta = {
    all: {
      title: 'Tenants Management',
      subtitle: 'Manage companies, subscriptions, feature access, users, and tenant setup from one place.',
      empty: 'No tenants found.',
    },
    suspended: {
      title: 'Suspended Tenants',
      subtitle: 'Review suspended tenant companies, reactivate access, or move them to trash with a reason.',
      empty: 'No suspended tenants found.',
    },
    trash: {
      title: 'Tenant Trash',
      subtitle: 'Restore soft-deleted tenant companies. Restored tenants remain suspended until you reactivate them.',
      empty: 'No trashed tenants found.',
    },
  }[mode];

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const loadCompanies =
        mode === 'trash'
          ? superAdminApi.trashedCompanies()
          : mode === 'suspended'
            ? superAdminApi.suspendedCompanies()
            : superAdminApi.companies();
      const [companyList, planList, featureList] = await Promise.all([
        loadCompanies,
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
  }, [mode]);

  const filteredCompanies = useMemo(() => {
    const value = search.toLowerCase();
    return companies.filter((company) =>
      [company.name, company.display_name, company.tenant_id, company.admin_contact?.email]
        .filter(Boolean)
        .some((item) => String(item).toLowerCase().includes(value)),
    );
  }, [companies, search]);

  const featureLabelByKey = useMemo(
    () => new Map(features.map((feature) => [feature.key, feature.name])),
    [features],
  );

  const formatDateTime = (value?: string) =>
    value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

  const formatValue = (value?: string | number | null) => {
    if (value === undefined || value === null || value === '') return '-';
    return String(value);
  };

  const getCredentialChangeMessages = (log: ApiAuditLog) => {
    const metadata = log.metadata || {};
    const credentialChanges = metadata.admin_credential_changes || {};
    const messages: string[] = [];

    Object.entries(credentialChanges).forEach(([field, change]: [string, any]) => {
      if (field === 'admin_password') {
        messages.push('Login password changed');
        return;
      }

      const label = field
        .replace('admin_', 'Admin ')
        .replace('tenant_login_url', 'Tenant software URL')
        .replace(/_/g, ' ');
      messages.push(`${label} changed from ${formatValue(change?.from)} to ${formatValue(change?.to)}`);
    });

    // Older audit records saved the submitted form directly. Keep display safe and never show raw passwords.
    if (!messages.length && metadata.admin_password) {
      messages.push('Login password changed');
    }
    if (!messages.length && metadata.admin_email) {
      messages.push(`Admin login email updated to ${metadata.admin_email}`);
    }

    return messages;
  };

  const credentialAuditLogs = (viewDetails?.auditLogs || [])
    .map((log) => ({ log, messages: getCredentialChangeMessages(log) }))
    .filter((item) => item.messages.length > 0);

  const openCreate = () => {
    if (onNavigate) {
      onNavigate('tenant-create');
      return;
    }

    setEditingCompany(null);
    setForm(emptyForm);
    setFormErrors({});
    setError('');
    setShowAdminPassword(false);
    setIsModalOpen(true);
  };

  const openEdit = (company: ApiCompany) => {
    if (onNavigate) {
      setActiveDropdownId(null);
      onNavigate(`tenant-edit:${company._id}`);
      return;
    }

    setEditingCompany(company);
    setForm({
      name: company.name || '',
      display_name: company.display_name || '',
      description: company.description || '',
      admin_name: company.admin_contact?.name || '',
      admin_email: company.admin_contact?.email || '',
      admin_personal_email: company.admin_contact?.personal_email || '',
      admin_password: company.admin_contact?.password || '',
      admin_mobile: company.admin_contact?.mobile || '',
      tenant_login_url: company.admin_contact?.login_url || 'http://localhost:3008',
      plan: company.subscription?.plan_key || 'starter',
      features: company.features?.includes(CORE_FEATURE_KEY)
        ? company.features
        : [...(company.features || []), CORE_FEATURE_KEY],
    });
    setFormErrors({});
    setError('');
    setShowAdminPassword(false);
    setIsModalOpen(true);
    setActiveDropdownId(null);
  };

  const openView = async (company: ApiCompany) => {
    if (onNavigate) {
      setActiveDropdownId(null);
      onNavigate(`tenant-detail:${company._id}`);
      return;
    }

    setActiveDropdownId(null);
    setViewLoading(true);
    setError('');
    setViewDetails({
      company,
      employeeCount: 0,
      activeUsers: 0,
      inactiveUsers: 0,
      auditLogs: [],
    });

    try {
      const [freshCompany, usersData, auditLogs] = await Promise.all([
        superAdminApi.company(company._id),
        superAdminApi.companyUsers(company._id, { page: 1, count: 1 }),
        superAdminApi.companyAuditLogs(company._id),
      ]);

      setViewDetails({
        company: freshCompany || company,
        employeeCount: usersData?.totalUsers || 0,
        activeUsers: usersData?.activeUsers || 0,
        inactiveUsers: usersData?.inactiveUsers || 0,
        auditLogs: auditLogs || [],
      });
    } catch (err: any) {
      setViewDetails(null);
      setError(err?.message || 'Unable to load company details.');
    } finally {
      setViewLoading(false);
    }
  };

  const getFieldError = (field: string) => formErrors[field];

  const requiredLabel = (label: string) => (
    <>
      {label} <span className="text-red-600">*</span>
    </>
  );

  const updateField = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const updateMobile = (value: string) => {
    updateField('admin_mobile', value.replace(/\D/g, '').slice(0, 10));
  };

  const isCoreFeature = (feature: ApiFeature) =>
    feature.key === CORE_FEATURE_KEY || feature.name?.toLowerCase().includes('case management');

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const requiredFields = [
      ['name', 'Company Name is required.'],
      ['admin_name', 'Admin Name is required.'],
      ['admin_email', 'User Login / Email Address is required.'],
      ['admin_password', 'Login Password is required.'],
      ['admin_personal_email', 'Personal Email is required.'],
      ['admin_mobile', 'Mobile Number is required.'],
      ['tenant_login_url', 'Tenant Software URL is required.'],
    ];

    requiredFields.forEach(([field, message]) => {
      if (!String((form as any)[field] || '').trim()) {
        errors[field] = message;
      }
    });

    if (form.admin_mobile && !/^\d{10}$/.test(form.admin_mobile)) {
      errors.admin_mobile = 'Mobile Number must be exactly 10 digits.';
    }

    if (form.admin_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.admin_email)) {
      errors.admin_email = 'Please enter a valid User Login / Email Address.';
    }

    if (
      form.admin_personal_email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.admin_personal_email)
    ) {
      errors.admin_personal_email = 'Please enter a valid Personal Email.';
    }

    if (!form.features.length) {
      errors.features = 'Please select at least one feature.';
    } else if (!form.features.includes(CORE_FEATURE_KEY)) {
      errors.features = 'Case Management is mandatory and cannot be removed.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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
    if (!validateForm()) {
      return;
    }
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
    if (featureKey === CORE_FEATURE_KEY) {
      setFormErrors((current) => ({
        ...current,
        features: 'Case Management is mandatory and cannot be removed.',
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      features: current.features.includes(featureKey)
        ? current.features.filter((feature) => feature !== featureKey)
        : [...current.features, featureKey],
    }));
    setFormErrors((current) => {
      const next = { ...current };
      delete next.features;
      return next;
    });
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
    if (company.status !== 'suspended') {
      setError('Company must be suspended before it can be deleted.');
      setActiveDropdownId(null);
      return;
    }
    setDeleteReasonState({ company, reason: '' });
    setActiveDropdownId(null);
  };

  const confirmDeleteCompany = async () => {
    if (!deleteReasonState) return;
    const reason = deleteReasonState.reason.trim();
    if (!reason) {
      setError('Delete reason is required.');
      return;
    }
    try {
      setSaving(true);
      setError('');
      await superAdminApi.deleteCompany(deleteReasonState.company._id, reason);
      setDeleteReasonState(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Unable to delete company.');
    } finally {
      setSaving(false);
    }
  };

  const restoreCompany = (company: ApiCompany) => {
    setConfirmState({
      title: 'Restore company?',
      message: `Are you sure you want to restore ${company.name}? It will remain suspended until you reactivate it.`,
      confirmLabel: 'Restore',
      onConfirm: async () => {
        await superAdminApi.restoreCompany(company._id);
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
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1 md:mb-2 text-pine">{pageMeta.title}</h1>
          <p className="text-pine/70 font-medium text-base md:text-lg">{pageMeta.subtitle}</p>
        </div>
        {mode === 'all' && (
          <button onClick={openCreate} className="bg-pine text-butter hover:bg-pine/90 transition-colors px-5 md:px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 shadow-sm whitespace-nowrap cursor-pointer">
            <Plus strokeWidth={2.5} size={20} />
            Create Company
          </button>
        )}
      </div>

      {error && <div className="mb-5 rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 text-red-700 font-bold">{error}</div>}

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
              {loading ? 'Loading tenants...' : `Showing ${filteredCompanies.length} tenants`}
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
              {loading ? (
                <TenantTableSkeleton />
              ) : (
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
                          {mode === 'trash' && (
                            <div className="mt-2 max-w-xl whitespace-normal rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-800">
                              <p>Reason: {company.delete_history?.reason || 'No reason found'}</p>
                              <p className="mt-1 text-red-700/70">
                                Deleted by {company.delete_history?.actor_email || 'system'}
                                {company.delete_history?.deleted_at
                                  ? ` on ${new Date(company.delete_history.deleted_at).toLocaleString()}`
                                  : ''}
                              </p>
                            </div>
                          )}
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
                          {mode === 'trash' ? (
                            <button onClick={() => restoreCompany(company)} className="w-full text-left px-4 py-2.5 hover:bg-pine/10 text-pine font-semibold text-sm cursor-pointer transition-colors flex items-center gap-2">
                              <RotateCcw size={15} /> Restore
                            </button>
                          ) : (
                            <>
                              <button onClick={() => openView(company)} className="w-full text-left px-4 py-2.5 hover:bg-pine/10 text-pine font-semibold text-sm cursor-pointer transition-colors flex items-center gap-2">
                                <Eye size={15} /> View details
                              </button>
                              {mode === 'all' && (
                                <button onClick={() => openEdit(company)} className="w-full text-left px-4 py-2.5 hover:bg-pine/10 text-pine font-semibold text-sm cursor-pointer transition-colors">Edit details</button>
                              )}
                              <button onClick={() => changeStatus(company)} className="w-full text-left px-4 py-2.5 hover:bg-pine/10 text-pine font-semibold text-sm cursor-pointer transition-colors">
                                {company.status === 'suspended' ? 'Reactivate access' : 'Suspend access'}
                              </button>
                              {company.status === 'suspended' && (
                                <>
                                  <div className="h-px bg-pine/10 my-1 w-full" />
                                  <button onClick={() => deleteCompany(company)} className="w-full text-left px-4 py-2.5 hover:bg-[#ffe0e0] text-[#8a2222] font-semibold text-sm cursor-pointer transition-colors flex items-center gap-2">
                                    <Trash2 size={15} /> Move to trash
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {!filteredCompanies.length && (
                  <tr>
                    <td className="p-8 text-center text-sm font-bold text-pine/50" colSpan={5}>
                      {pageMeta.empty}
                    </td>
                  </tr>
                )}
              </tbody>
              )}
            </table>
          </div>
        </div>

      </div>

      {viewDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-pine/50 backdrop-blur-sm cursor-pointer" onClick={() => setViewDetails(null)} />
          <div className="relative bg-butter-light border-2 border-pine/10 rounded-[2rem] p-6 md:p-8 max-w-5xl w-full shadow-2xl z-10 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-pine/45">Company Details</p>
                <h2 className="text-2xl md:text-3xl font-black text-pine tracking-tight">
                  {viewDetails.company.display_name || viewDetails.company.name}
                </h2>
                <p className="mt-1 font-mono text-sm font-bold text-pine/55">{viewDetails.company.tenant_id}</p>
              </div>
              <button onClick={() => setViewDetails(null)} className="self-end sm:self-auto p-2 text-pine/50 hover:bg-pine/10 hover:text-pine rounded-full transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {viewLoading ? (
              <div className="rounded-3xl border-2 border-pine/10 bg-butter p-8 text-center font-black text-pine/60">
                Loading company details...
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-3xl bg-pine text-butter p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-wider text-butter/60">Employees</p>
                    <p className="mt-2 text-4xl font-black">{viewDetails.employeeCount}</p>
                    <p className="mt-1 text-sm font-bold text-butter/70">
                      Active {viewDetails.activeUsers} / Inactive {viewDetails.inactiveUsers}
                    </p>
                  </div>
                  <div className="rounded-3xl border-2 border-pine/10 bg-butter p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-wider text-pine/50">Status</p>
                    <p className="mt-2 text-2xl font-black capitalize text-pine">{viewDetails.company.status}</p>
                    <p className="mt-1 text-sm font-bold text-pine/60">Created {formatDateTime(viewDetails.company.created_at)}</p>
                  </div>
                  <div className="rounded-3xl border-2 border-pine/10 bg-butter p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-wider text-pine/50">Plan</p>
                    <p className="mt-2 text-2xl font-black text-pine">{viewDetails.company.subscription?.plan_name || '-'}</p>
                    <p className="mt-1 text-sm font-bold text-pine/60">
                      Payment: {viewDetails.company.subscription?.payment_status || '-'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <section className="rounded-3xl border-2 border-pine/10 bg-butter p-5">
                    <h3 className="text-lg font-black text-pine mb-4">Company Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {[
                        ['Company Name', viewDetails.company.name],
                        ['Display Name', viewDetails.company.display_name],
                        ['Description', viewDetails.company.description],
                        ['Tenant ID', viewDetails.company.tenant_id],
                        ['Created At', formatDateTime(viewDetails.company.created_at)],
                        ['Last Updated', formatDateTime(viewDetails.company.updated_at)],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl bg-butter-light border border-pine/10 px-4 py-3">
                          <p className="text-xs font-black uppercase tracking-wider text-pine/45">{label}</p>
                          <p className="mt-1 break-words font-bold text-pine">{formatValue(value)}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-3xl border-2 border-pine/10 bg-butter p-5">
                    <h3 className="text-lg font-black text-pine mb-4">Tenant Admin Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {[
                        ['Admin Name', viewDetails.company.admin_contact?.name],
                        ['Login Email', viewDetails.company.admin_contact?.email],
                        ['Personal Email', viewDetails.company.admin_contact?.personal_email],
                        ['Mobile Number', viewDetails.company.admin_contact?.mobile],
                        ['Tenant Software URL', viewDetails.company.admin_contact?.login_url],
                        ['Current Login Password', viewDetails.company.admin_contact?.password],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl bg-butter-light border border-pine/10 px-4 py-3">
                          <p className="text-xs font-black uppercase tracking-wider text-pine/45">{label}</p>
                          <p className="mt-1 break-words font-bold text-pine">{formatValue(value)}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <section className="rounded-3xl border-2 border-pine/10 bg-butter p-5">
                  <h3 className="text-lg font-black text-pine mb-4">Subscription, Limits & Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    {[
                      ['Max Users', viewDetails.company.limits?.max_users],
                      ['Max Employees', viewDetails.company.limits?.max_employees],
                      ['Storage MB', viewDetails.company.limits?.storage_mb],
                      ['API Calls / Month', viewDetails.company.limits?.api_calls_per_month],
                      ['Subscription Status', viewDetails.company.subscription?.status],
                      ['Renewal Date', formatDateTime(viewDetails.company.subscription?.renewal_date)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl bg-butter-light border border-pine/10 px-4 py-3">
                        <p className="text-xs font-black uppercase tracking-wider text-pine/45">{label}</p>
                        <p className="mt-1 break-words font-bold text-pine">{formatValue(value)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(viewDetails.company.features || []).map((featureKey) => (
                      <span key={featureKey} className="rounded-full bg-pine/10 px-3 py-1 text-xs font-black text-pine">
                        {featureLabelByKey.get(featureKey) || featureKey}
                      </span>
                    ))}
                    {!viewDetails.company.features?.length && (
                      <span className="text-sm font-bold text-pine/50">No features assigned.</span>
                    )}
                  </div>
                </section>

                <section className="rounded-3xl border-2 border-pine/10 bg-butter p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <h3 className="text-lg font-black text-pine">Admin Email / Password Change History</h3>
                    <p className="text-xs font-bold text-pine/50">Raw passwords are never shown in audit history.</p>
                  </div>
                  {credentialAuditLogs.length ? (
                    <div className="space-y-3">
                      {credentialAuditLogs.map(({ log, messages }) => (
                        <div key={log._id} className="rounded-2xl border border-pine/10 bg-butter-light px-4 py-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <p className="font-black text-pine">{formatDateTime(log.created_at)}</p>
                            <p className="text-xs font-bold text-pine/50">Updated by {log.actor_email || 'system'}</p>
                          </div>
                          <ul className="mt-2 space-y-1">
                            {messages.map((message) => (
                              <li key={message} className="text-sm font-bold text-pine/75">{message}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-butter-light border border-pine/10 px-4 py-4 text-sm font-bold text-pine/55">
                      No admin email or password update history found for this company.
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      )}

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

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <h3 className="text-lg font-black text-pine mb-3">Company Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ['name', 'Company Name', 'text', true],
                  ['display_name', 'Display Name', 'text', false],
                ].map(([key, label, type, required]) => (
                  <div key={String(key)}>
                    <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">
                      {required ? requiredLabel(String(label)) : label}
                    </label>
                    <input
                      required={Boolean(required)}
                      type={String(type)}
                      value={(form as any)[key as string]}
                      onChange={(event) => updateField(key as string, event.target.value)}
                      className={cn(
                        "w-full bg-butter border-2 rounded-xl py-3 px-4 text-pine font-medium outline-none focus:border-pine transition-colors shadow-sm",
                        getFieldError(key as string) ? "border-red-400" : "border-pine/20",
                      )}
                    />
                    {getFieldError(key as string) && (
                      <p className="mt-1 text-xs font-bold text-red-600">{getFieldError(key as string)}</p>
                    )}
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
                  <textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={3} className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-medium outline-none focus:border-pine transition-colors shadow-sm" />
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
                    ['admin_name', 'Admin Name', 'text', true],
                    ['admin_email', 'User Login / Email Address', 'email', true],
                    ['admin_password', 'Login Password', 'password', true],
                    ['admin_personal_email', 'Personal Email', 'email', true],
                    ['admin_mobile', 'Mobile Number', 'tel', true],
                    ['tenant_login_url', 'Tenant Software URL', 'url', true],
                  ].map(([key, label, type, required]) => (
                    <div key={String(key)} className={key === 'tenant_login_url' ? 'md:col-span-2' : ''}>
                      <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">
                        {required ? requiredLabel(String(label)) : label}
                      </label>
                      <div className="relative">
                        <input
                          required={Boolean(required)}
                          type={key === 'admin_password' ? (showAdminPassword ? 'text' : 'password') : String(type)}
                          value={(form as any)[key as string]}
                          onChange={(event) =>
                            key === 'admin_mobile'
                              ? updateMobile(event.target.value)
                              : updateField(key as string, event.target.value)
                          }
                          inputMode={key === 'admin_mobile' ? 'numeric' : undefined}
                          maxLength={key === 'admin_mobile' ? 10 : undefined}
                          pattern={key === 'admin_mobile' ? '\\d{10}' : undefined}
                          placeholder={key === 'tenant_login_url' ? 'Example: http://localhost:3008/login' : undefined}
                          className={cn(
                            "w-full bg-butter border-2 rounded-xl py-3 px-4 text-pine font-medium outline-none focus:border-pine transition-colors shadow-sm",
                            key === 'admin_password' ? "pr-12" : "",
                            getFieldError(key as string) ? "border-red-400" : "border-pine/20",
                          )}
                        />
                        {key === 'admin_password' && (
                          <button
                            type="button"
                            onClick={() => setShowAdminPassword((current) => !current)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-pine/55 hover:bg-pine/10 hover:text-pine"
                            aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                          >
                            {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        )}
                      </div>
                      {getFieldError(key as string) && (
                        <p className="mt-1 text-xs font-bold text-red-600">{getFieldError(key as string)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-pine/10 pt-5">
                <h3 className="text-lg font-black text-pine mb-3">Feature Flags</h3>
                {getFieldError('features') && (
                  <div className="mb-3 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                    {getFieldError('features')}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.map((feature) => (
                    <label key={feature.key} className={cn(
                      "flex items-start gap-3 rounded-2xl bg-butter border border-pine/10 p-4 hover:border-pine/30",
                      isCoreFeature(feature) ? "cursor-not-allowed opacity-90" : "cursor-pointer",
                    )}>
                      <input
                        type="checkbox"
                        checked={form.features.includes(feature.key)}
                        disabled={isCoreFeature(feature)}
                        onChange={() => toggleFeature(feature.key)}
                        className="mt-1"
                      />
                      <span>
                        <strong className="block text-pine">{feature.name}</strong>
                        <small className="text-pine/55 font-bold">
                          {feature.description}
                          {isCoreFeature(feature) ? ' Mandatory core feature' : ''}
                        </small>
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

      {deleteReasonState && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-pine/55 backdrop-blur-sm" onClick={saving ? undefined : () => setDeleteReasonState(null)} />
          <div className="relative z-10 w-full max-w-md rounded-[2rem] border-2 border-pine/10 bg-butter-light p-6 shadow-2xl">
            <h2 className="text-2xl font-black text-pine">Move to trash?</h2>
            <p className="mt-3 text-sm font-bold leading-relaxed text-pine/65">
              Tell why you are deleting {deleteReasonState.company.name}. This reason will be saved in company history.
            </p>
            <textarea
              value={deleteReasonState.reason}
              onChange={(event) => setDeleteReasonState({ ...deleteReasonState, reason: event.target.value })}
              rows={4}
              placeholder="Enter delete reason"
              className="mt-4 w-full rounded-xl border-2 border-pine/20 bg-butter px-4 py-3 font-bold text-pine outline-none focus:border-pine"
            />
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteReasonState(null)}
                disabled={saving}
                className="flex-1 rounded-xl border-2 border-pine/20 px-4 py-3 font-bold text-pine transition-colors hover:bg-pine/5 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCompany}
                disabled={saving}
                className="flex-1 rounded-xl bg-[#8a2222] px-4 py-3 font-bold text-butter shadow-md transition-colors hover:bg-[#6f1b1b] disabled:opacity-60"
              >
                {saving ? 'Please wait...' : 'Move to trash'}
              </button>
            </div>
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
