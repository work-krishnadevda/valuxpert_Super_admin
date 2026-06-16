import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import type { ApiFeature, ApiPlan } from '../types';
import { superAdminApi } from '../services/superAdminApi';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { cn } from '../utils';

const CORE_FEATURE_KEY = 'case_management';

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);
const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

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
  subscription_start_date: toDateInputValue(new Date()),
  subscription_end_date: toDateInputValue(addMonths(new Date(), 1)),
  features: ['hrms', 'case_management'],
};

export function CompanyCreateView({ onBack }: { onBack: () => void }) {
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [features, setFeatures] = useState<ApiFeature[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    const loadSetupData = async () => {
      try {
        const [planList, featureList] = await Promise.all([
          superAdminApi.plans(),
          superAdminApi.features(),
        ]);
        setPlans(planList || []);
        setFeatures(featureList || []);
      } catch (err: any) {
        setError(err?.message || 'Unable to load setup data.');
      }
    };

    loadSetupData();
  }, []);

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

  const getFieldError = (field: string) => formErrors[field];

  const requiredLabel = (label: string) => (
    <>
      {label} <span className="text-red-600">*</span>
    </>
  );

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
      ['subscription_start_date', 'Subscription Start Date is required.'],
      ['subscription_end_date', 'Subscription End Date is required.'],
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

    if (form.subscription_start_date && form.subscription_end_date) {
      const start = new Date(form.subscription_start_date);
      const end = new Date(form.subscription_end_date);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        errors.subscription_end_date = 'Please enter a valid subscription date range.';
      } else if (end <= start) {
        errors.subscription_end_date = 'Subscription End Date must be after Start Date.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
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

  const saveCompany = async () => {
    try {
      setSaving(true);
      setError('');
      await superAdminApi.createCompany(form);
      onBack();
    } catch (err: any) {
      setError(err?.message || 'Unable to create company.');
    } finally {
      setSaving(false);
      setIsConfirmOpen(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;
    setIsConfirmOpen(true);
  };

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div>
        <button onClick={onBack} className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-pine/10 px-4 py-2 text-sm font-black text-pine hover:bg-pine/5">
          <ArrowLeft size={18} /> Back to tenants
        </button>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-pine/45">Tenant Setup</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-black tracking-tight text-pine">Create Company</h1>
        <p className="mt-2 max-w-2xl text-pine/70 font-medium">
          Company create karte hi tenant ID, default admin user, permissions, settings, subscription aur default profile setup ho jayega.
        </p>
      </div>

      {error && <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 text-red-700 font-bold">{error}</div>}

      <form onSubmit={handleSubmit} noValidate className="rounded-[2rem] border-2 border-pine/10 bg-butter-light p-6 md:p-8 shadow-sm space-y-6">
        <section>
          <h2 className="text-xl font-black text-pine mb-4">Company Details</h2>
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
                    'w-full bg-butter border-2 rounded-xl py-3 px-4 text-pine font-medium outline-none focus:border-pine transition-colors shadow-sm',
                    getFieldError(key as string) ? 'border-red-400' : 'border-pine/20',
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
        </section>

        <section className="border-t border-pine/10 pt-6">
          <h2 className="text-xl font-black text-pine mb-2">Package Date Range</h2>
          <p className="text-sm font-bold text-pine/60 mb-4">
            Tenant panel will be blocked automatically after subscription end date.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ['subscription_start_date', 'Subscription Start Date'],
              ['subscription_end_date', 'Subscription End Date'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">
                  {requiredLabel(label)}
                </label>
                <input
                  required
                  type="date"
                  value={(form as any)[key]}
                  onChange={(event) => updateField(key, event.target.value)}
                  className={cn(
                    'w-full bg-butter border-2 rounded-xl py-3 px-4 text-pine font-medium outline-none focus:border-pine transition-colors shadow-sm',
                    getFieldError(key) ? 'border-red-400' : 'border-pine/20',
                  )}
                />
                {getFieldError(key) && (
                  <p className="mt-1 text-xs font-bold text-red-600">{getFieldError(key)}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-pine/10 pt-6">
          <h2 className="text-xl font-black text-pine mb-2">Default Tenant Admin Credentials</h2>
          <p className="text-sm font-bold text-pine/60 mb-4">
            Ye credentials tenant admin ke login ke liye honge.
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
                    placeholder={key === 'tenant_login_url' ? 'Example: https://valuxpert.vercel.app/login' : undefined}
                    className={cn(
                      'w-full bg-butter border-2 rounded-xl py-3 px-4 text-pine font-medium outline-none focus:border-pine transition-colors shadow-sm',
                      key === 'admin_password' ? 'pr-12' : '',
                      getFieldError(key as string) ? 'border-red-400' : 'border-pine/20',
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
        </section>

        <section className="border-t border-pine/10 pt-6">
          <h2 className="text-xl font-black text-pine mb-4">Feature Flags</h2>
          {getFieldError('features') && (
            <div className="mb-3 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {getFieldError('features')}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feature) => (
              <label key={feature.key} className={cn(
                'flex items-start gap-3 rounded-2xl bg-butter border border-pine/10 p-4 hover:border-pine/30',
                isCoreFeature(feature) ? 'cursor-not-allowed opacity-90' : 'cursor-pointer',
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
        </section>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={onBack} className="flex-1 px-4 py-3 border-2 border-pine/20 text-pine font-bold rounded-xl hover:bg-pine/5 transition-colors cursor-pointer">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 px-4 py-3 bg-pine text-butter font-bold rounded-xl hover:bg-pine-light transition-colors shadow-md cursor-pointer disabled:opacity-60">
            {saving ? 'Saving...' : 'Create & Setup'}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={isConfirmOpen}
        title="Create company?"
        message={`Are you sure you want to create ${form.name || 'this company'}?`}
        confirmLabel="Create"
        loading={saving}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={saveCompany}
      />
    </div>
  );
}
