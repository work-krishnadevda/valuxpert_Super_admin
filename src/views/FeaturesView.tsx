import { useEffect, useMemo, useState } from 'react';
import type { ApiCompany, ApiFeature } from '../types';
import { superAdminApi } from '../services/superAdminApi';

export function FeaturesView() {
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [features, setFeatures] = useState<ApiFeature[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([superAdminApi.companies(), superAdminApi.features()]).then(([companyList, featureList]) => {
      setCompanies(companyList || []);
      setFeatures(featureList || []);
      if (companyList?.length) {
        setSelectedCompanyId(companyList[0]._id);
        setEnabledFeatures(companyList[0].features || []);
      }
    });
  }, []);

  const selectedCompany = useMemo(
    () => companies.find((company) => company._id === selectedCompanyId),
    [companies, selectedCompanyId],
  );

  const selectCompany = (companyId: string) => {
    const company = companies.find((item) => item._id === companyId);
    setSelectedCompanyId(companyId);
    setEnabledFeatures(company?.features || []);
  };

  const toggleFeature = (id: string) => {
    setEnabledFeatures((current) =>
      current.includes(id) ? current.filter((feature) => feature !== id) : [...current, id],
    );
  };

  const saveFeatures = async () => {
    if (!selectedCompanyId) return;
    setSaving(true);
    setMessage('');
    await superAdminApi.updateFeatures(selectedCompanyId, enabledFeatures);
    setCompanies((current) =>
      current.map((company) =>
        company._id === selectedCompanyId ? { ...company, features: enabledFeatures } : company,
      ),
    );
    setMessage('Feature flags saved successfully.');
    setSaving(false);
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1 md:mb-2 text-pine">Tenant Feature Flags</h1>
        <p className="text-pine/70 font-medium text-base md:text-lg">Enable or disable modules for each company.</p>
      </div>

      <div className="mb-5 bg-butter-light border-2 border-pine/10 rounded-[2rem] p-5">
        <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Select Company</label>
        <select value={selectedCompanyId} onChange={(event) => selectCompany(event.target.value)} className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-bold outline-none focus:border-pine">
          {companies.map((company) => <option key={company._id} value={company._id}>{company.name}</option>)}
        </select>
        {selectedCompany && <p className="mt-3 text-sm font-bold text-pine/60">{selectedCompany.tenant_id}</p>}
      </div>

      {message && <div className="mb-5 rounded-2xl border-2 border-green-200 bg-green-50 px-5 py-4 text-green-700 font-bold">{message}</div>}

      <div className="bg-butter-light border-2 border-pine/10 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="divide-y divide-pine/10">
          {features.map(feat => (
            <div key={feat.key} className="p-4 md:p-6 flex items-center justify-between hover:bg-pine/[0.02] transition-colors cursor-pointer" onClick={() => toggleFeature(feat.key)}>
              <div>
                <h3 className="font-bold text-lg text-pine leading-tight">{feat.name}</h3>
                <p className="text-pine/60 font-medium text-sm mt-1">{feat.description}</p>
              </div>
              <button 
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors cursor-pointer ${enabledFeatures.includes(feat.key) ? 'bg-pine' : 'bg-pine/20'}`}
                aria-label={`Toggle ${feat.name}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-butter transition-transform shadow-sm ${enabledFeatures.includes(feat.key) ? 'translate-x-[22px]' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button onClick={saveFeatures} disabled={saving || !selectedCompanyId} className="mt-5 px-6 py-3 bg-pine text-butter font-bold rounded-xl hover:bg-pine-light transition-colors shadow-md cursor-pointer disabled:opacity-60">
        {saving ? 'Saving...' : 'Save Feature Flags'}
      </button>
    </div>
  );
}
