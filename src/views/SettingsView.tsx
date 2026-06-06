import { useEffect, useState } from 'react';
import type { ApiCompany } from '../types';
import { superAdminApi } from '../services/superAdminApi';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { FormSkeleton } from '../components/SkeletonLoaders';

export function SettingsView() {
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [settings, setSettings] = useState<any>({
    company_name: '',
    logo_url: '',
    branding: { primary_color: '#013e37' },
    theme: { mode: 'light' },
    email_configuration: { from_email: '', smtp_host: '' },
    notification_settings: { email_enabled: true, sms_enabled: false },
  });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    superAdminApi.companies()
      .then(async (companyList) => {
        setCompanies(companyList || []);
        if (companyList?.length) {
          setSelectedCompanyId(companyList[0]._id);
          await loadSettings(companyList[0]._id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const loadSettings = async (companyId: string) => {
    const data = await superAdminApi.companySettings(companyId);
    setSettings({
      company_name: data?.company_name || '',
      logo_url: data?.logo_url || '',
      branding: { primary_color: '#013e37', ...(data?.branding || {}) },
      theme: { mode: 'light', ...(data?.theme || {}) },
      email_configuration: { from_email: '', smtp_host: '', ...(data?.email_configuration || {}) },
      notification_settings: { email_enabled: true, sms_enabled: false, ...(data?.notification_settings || {}) },
    });
  };

  const selectCompany = (companyId: string) => {
    setSelectedCompanyId(companyId);
    loadSettings(companyId);
  };

  const updateNested = (section: string, key: string, value: any) => {
    setSettings((current: any) => ({
      ...current,
      [section]: {
        ...(current[section] || {}),
        [key]: value,
      },
    }));
  };

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCompanyId) return;
    setIsConfirmOpen(true);
  };

  const confirmSaveSettings = async () => {
    if (!selectedCompanyId) return;
    setSaving(true);
    await superAdminApi.updateSettings(selectedCompanyId, settings);
    setMessage('Tenant settings saved successfully.');
    setIsConfirmOpen(false);
    setSaving(false);
  };

  const selectedCompany = companies.find((company) => company._id === selectedCompanyId);

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1 md:mb-2 text-pine">Tenant Settings</h1>
        <p className="text-pine/70 font-medium text-base md:text-lg">Per-company branding, logo, theme, email, and notifications.</p>
      </div>

      {loading ? (
        <FormSkeleton />
      ) : (
      <>
      <div className="mb-5 bg-butter-light border-2 border-pine/10 rounded-[2rem] p-5">
        <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Select Company</label>
        <select value={selectedCompanyId} onChange={(event) => selectCompany(event.target.value)} className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-bold outline-none focus:border-pine">
          {companies.map((company) => <option key={company._id} value={company._id}>{company.name}</option>)}
        </select>
      </div>

      {message && <div className="mb-5 rounded-2xl border-2 border-green-200 bg-green-50 px-5 py-4 text-green-700 font-bold">{message}</div>}

      <div className="bg-butter-light border-2 border-pine/10 p-6 md:p-8 rounded-[2rem] shadow-sm">
        <form className="space-y-6" onSubmit={saveSettings}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Company Name</label>
              <input type="text" value={settings.company_name || ''} onChange={(event) => setSettings({ ...settings, company_name: event.target.value })} className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-medium outline-none focus:border-pine cursor-text transition-colors shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Logo URL</label>
              <input type="url" value={settings.logo_url || ''} onChange={(event) => setSettings({ ...settings, logo_url: event.target.value })} className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-medium outline-none focus:border-pine cursor-text transition-colors shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Primary Color</label>
              <input type="text" value={settings.branding?.primary_color || ''} onChange={(event) => updateNested('branding', 'primary_color', event.target.value)} className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-medium outline-none focus:border-pine cursor-text transition-colors shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Theme Mode</label>
              <select value={settings.theme?.mode || 'light'} onChange={(event) => updateNested('theme', 'mode', event.target.value)} className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-bold outline-none focus:border-pine">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">From Email</label>
              <input type="email" value={settings.email_configuration?.from_email || ''} onChange={(event) => updateNested('email_configuration', 'from_email', event.target.value)} className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-medium outline-none focus:border-pine cursor-text transition-colors shadow-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">SMTP Host</label>
              <input type="text" value={settings.email_configuration?.smtp_host || ''} onChange={(event) => updateNested('email_configuration', 'smtp_host', event.target.value)} className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-medium outline-none focus:border-pine cursor-text transition-colors shadow-sm" />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 font-bold text-pine cursor-pointer">
                <input type="checkbox" checked={Boolean(settings.notification_settings?.email_enabled)} onChange={(event) => updateNested('notification_settings', 'email_enabled', event.target.checked)} />
                Email Notifications
              </label>
              <label className="flex items-center gap-2 font-bold text-pine cursor-pointer">
                <input type="checkbox" checked={Boolean(settings.notification_settings?.sms_enabled)} onChange={(event) => updateNested('notification_settings', 'sms_enabled', event.target.checked)} />
                SMS Notifications
              </label>
            </div>
          </div>
          <div className="pt-6 border-t border-pine/10">
            <button type="submit" disabled={saving} className="px-6 py-3 bg-pine text-butter font-bold rounded-xl hover:bg-pine/90 transition-colors shadow-md cursor-pointer inline-block disabled:opacity-60">{saving ? 'Saving...' : 'Save Settings'}</button>
          </div>
        </form>
      </div>
      </>
      )}

      <ConfirmDialog
        open={isConfirmOpen}
        title="Save tenant settings?"
        message={`Are you sure you want to update settings for ${selectedCompany?.name || 'this company'}?`}
        confirmLabel="Save Settings"
        loading={saving}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={confirmSaveSettings}
      />
    </div>
  );
}
