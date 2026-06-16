import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Building2, ShieldCheck, Users } from 'lucide-react';
import type { ApiAuditLog, ApiCompany, ApiFeature } from '../types';
import { superAdminApi } from '../services/superAdminApi';

type CompanyDetailViewProps = {
  companyId: string;
  onBack: () => void;
};

type CompanyViewDetails = {
  company: ApiCompany;
  employeeCount: number;
  activeUsers: number;
  inactiveUsers: number;
  auditLogs: ApiAuditLog[];
};

export function CompanyDetailView({ companyId, onBack }: CompanyDetailViewProps) {
  const [details, setDetails] = useState<CompanyViewDetails | null>(null);
  const [features, setFeatures] = useState<ApiFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDetails();
  }, [companyId]);

  const featureLabelByKey = useMemo(
    () => new Map(features.map((feature) => [feature.key, feature.name])),
    [features],
  );

  const credentialAuditLogs = useMemo(
    () =>
      (details?.auditLogs || [])
        .map((log) => ({ log, messages: getCredentialChangeMessages(log) }))
        .filter((item) => item.messages.length > 0),
    [details],
  );

  const loadDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const [company, usersData, auditLogs, featureList] = await Promise.all([
        superAdminApi.company(companyId),
        superAdminApi.companyUsers(companyId, { page: 1, count: 1 }),
        superAdminApi.companyAuditLogs(companyId),
        superAdminApi.features(),
      ]);

      setDetails({
        company,
        employeeCount: usersData?.totalUsers || 0,
        activeUsers: usersData?.activeUsers || 0,
        inactiveUsers: usersData?.inactiveUsers || 0,
        auditLogs: auditLogs || [],
      });
      setFeatures(featureList || []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load company details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[2rem] border-2 border-pine/10 bg-butter-light p-8 text-center font-black text-pine/60">
        Loading company details...
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-full border-2 border-pine/10 px-4 py-2 font-black text-pine hover:bg-pine/5">
          <ArrowLeft size={18} /> Back to tenants
        </button>
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700">
          {error || 'Company not found.'}
        </div>
      </div>
    );
  }

  const { company } = details;

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button onClick={onBack} className="mb-4 inline-flex items-center gap-2 rounded-full border-2 border-pine/10 px-4 py-2 text-sm font-black text-pine hover:bg-pine/5">
            <ArrowLeft size={18} /> Back to tenants
          </button>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-pine/45">Company View</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-black tracking-tight text-pine">
            {company.display_name || company.name}
          </h1>
          <p className="mt-1 font-mono text-sm font-bold text-pine/55">{company.tenant_id}</p>
        </div>
        <span className="self-start rounded-full bg-pine px-4 py-2 text-sm font-black capitalize text-butter">
          {company.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard icon={<Users size={22} />} label="Employees" value={details.employeeCount} helper={`Active ${details.activeUsers} / Inactive ${details.inactiveUsers}`} dark />
        <SummaryCard icon={<ShieldCheck size={22} />} label="Plan" value={company.subscription?.plan_name || '-'} helper={`Payment: ${company.subscription?.payment_status || '-'}`} />
        <SummaryCard icon={<Building2 size={22} />} label="Created" value={formatDateTime(company.created_at)} helper={`Updated: ${formatDateTime(company.updated_at)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DetailSection
          title="Company Information"
          items={[
            ['Company Name', company.name],
            ['Display Name', company.display_name],
            ['Description', company.description],
            ['Tenant ID', company.tenant_id],
            ['Created At', formatDateTime(company.created_at)],
            ['Last Updated', formatDateTime(company.updated_at)],
          ]}
        />

        <DetailSection
          title="Tenant Admin Information"
          items={[
            ['Admin Name', company.admin_contact?.name],
            ['Login Email', company.admin_contact?.email],
            ['Personal Email', company.admin_contact?.personal_email],
            ['Mobile Number', company.admin_contact?.mobile],
            ['Tenant Software URL', company.admin_contact?.login_url],
            ['Current Login Password', company.admin_contact?.password],
          ]}
        />
      </div>

      <section className="rounded-3xl border-2 border-pine/10 bg-butter-light p-5 md:p-6">
        <h2 className="text-xl font-black text-pine mb-4">Subscription, Limits & Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {[
            ['Max Users', company.limits?.max_users],
            ['Max Employees', company.limits?.max_employees],
            ['Storage MB', company.limits?.storage_mb],
            ['API Calls / Month', company.limits?.api_calls_per_month],
            ['Subscription Status', company.subscription?.status],
            ['Start Date', formatDateTime(company.subscription?.start_date)],
            ['Subscription End Date', formatDateTime(company.subscription?.renewal_date)],
          ].map(([label, value]) => (
            <InfoTile key={label} label={String(label)} value={formatValue(value as any)} />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(company.features || []).map((featureKey) => (
            <span key={featureKey} className="rounded-full bg-pine/10 px-3 py-1 text-xs font-black text-pine">
              {featureLabelByKey.get(featureKey) || featureKey}
            </span>
          ))}
          {!company.features?.length && <span className="text-sm font-bold text-pine/50">No features assigned.</span>}
        </div>
      </section>

      <section className="rounded-3xl border-2 border-pine/10 bg-butter-light p-5 md:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="text-xl font-black text-pine">Admin Email / Password Change History</h2>
          <p className="text-xs font-bold text-pine/50">Raw passwords are never shown in audit history.</p>
        </div>
        {credentialAuditLogs.length ? (
          <div className="space-y-3">
            {credentialAuditLogs.map(({ log, messages }) => (
              <div key={log._id} className="rounded-2xl border border-pine/10 bg-butter px-4 py-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="rounded-2xl border border-pine/10 bg-butter px-4 py-4 text-sm font-bold text-pine/55">
            No admin email or password update history found for this company.
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  helper,
  dark = false,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  helper: string;
  dark?: boolean;
}) {
  return (
    <div className={`rounded-3xl p-5 shadow-sm ${dark ? 'bg-pine text-butter' : 'border-2 border-pine/10 bg-butter-light text-pine'}`}>
      <div className="flex items-center gap-2">
        {icon}
        <p className={`text-xs font-black uppercase tracking-wider ${dark ? 'text-butter/60' : 'text-pine/50'}`}>{label}</p>
      </div>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <p className={`mt-1 text-sm font-bold ${dark ? 'text-butter/70' : 'text-pine/60'}`}>{helper}</p>
    </div>
  );
}

function DetailSection({ title, items }: { title: string; items: Array<[string, any]> }) {
  return (
    <section className="rounded-3xl border-2 border-pine/10 bg-butter-light p-5 md:p-6">
      <h2 className="text-xl font-black text-pine mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {items.map(([label, value]) => (
          <InfoTile key={label} label={label} value={formatValue(value)} />
        ))}
      </div>
    </section>
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

function formatDateTime(value?: string) {
  return value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
}

function formatValue(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
}

function getCredentialChangeMessages(log: ApiAuditLog) {
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

  if (!messages.length && metadata.admin_password) {
    messages.push('Login password changed');
  }
  if (!messages.length && metadata.admin_email) {
    messages.push(`Admin login email updated to ${metadata.admin_email}`);
  }

  return messages;
}
