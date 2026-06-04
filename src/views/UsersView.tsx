import { useEffect, useState } from 'react';
import { Users as UsersIcon } from 'lucide-react';
import type { ApiCompany } from '../types';
import { superAdminApi } from '../services/superAdminApi';

export function UsersView() {
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalUsers: 0, activeUsers: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    superAdminApi.companies().then((companyList) => {
      setCompanies(companyList || []);
      if (companyList?.length) {
        setSelectedCompanyId(companyList[0]._id);
        loadUsers(companyList[0]._id);
      }
    });
  }, []);

  const loadUsers = async (companyId: string) => {
    setLoading(true);
    const data = await superAdminApi.companyUsers(companyId);
    setUsers(data?.users || []);
    setSummary({
      totalUsers: data?.totalUsers || 0,
      activeUsers: data?.activeUsers || 0,
    });
    setLoading(false);
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    loadUsers(companyId);
  };

  return (
    <div className="w-full max-w-5xl">
       <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1 md:mb-2 text-pine">Tenant Users & Roles</h1>
          <p className="text-pine/70 font-medium text-base md:text-lg">Company-wise user monitoring, status, and roles.</p>
        </div>
        <div className="bg-pine text-butter px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
          <UsersIcon size={18} />
          {summary.activeUsers}/{summary.totalUsers} Active
        </div>
      </div>

      <div className="mb-5 bg-butter-light border-2 border-pine/10 rounded-[2rem] p-5">
        <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Select Company</label>
        <select value={selectedCompanyId} onChange={(event) => handleCompanyChange(event.target.value)} className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-bold outline-none focus:border-pine">
          {companies.map((company) => <option key={company._id} value={company._id}>{company.name}</option>)}
        </select>
      </div>

      <div className="bg-butter-light border-2 border-pine/10 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-pine/10 text-pine/60 uppercase text-xs tracking-wider">
                <th className="p-6 font-bold">Admin</th>
                <th className="p-6 font-bold">Role</th>
                <th className="p-6 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine/5">
              {loading && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-pine/60 font-bold">Loading users...</td>
                </tr>
              )}
              {!loading && users.map((u) => (
                <tr key={u._id || u.email} className="hover:bg-pine/[0.02] transition-colors">
                  <td className="p-6">
                    <div className="font-bold text-lg text-pine">{u.name || '-'}</div>
                    <div className="text-sm font-medium text-pine/60">{u.email}</div>
                  </td>
                  <td className="p-6 font-bold text-pine/80">
                    {(u.role || []).map((role: any) => role.display_name || role.name).join(', ') || '-'}
                  </td>
                  <td className="p-6">
                    <span className="bg-[#d1f4da] text-[#115e3c] border border-[#b0e8c1] font-bold px-3 py-1 rounded-full text-xs capitalize">
                      {u.status || 'active'}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-pine/50 font-bold">No users found for selected company.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
