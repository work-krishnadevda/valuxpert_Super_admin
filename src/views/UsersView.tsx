import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Users as UsersIcon, X } from 'lucide-react';
import type { ApiCompany } from '../types';
import { superAdminApi } from '../services/superAdminApi';
import { TableSkeleton } from '../components/SkeletonLoaders';

type EmployeeRole = {
  _id: string;
  tenant_id?: string;
  name: string;
  display_name?: string;
  color?: string;
};

type EmployeeBranch = {
  _id: string;
  tenant_id?: string;
  name: string;
};

type EmployeeRecord = {
  _id: string;
  tenant_id?: string;
  employee_id?: string;
  designation?: string;
  department?: string;
  employment_status?: string;
  ra_branch?: string | string[];
  ra_location?: {
    value?: string;
    label?: string;
  };
  user?: {
    _id: string;
    name?: string;
    email?: string;
    mobile?: string;
    status?: string;
  };
  roles?: EmployeeRole[];
  branches?: EmployeeBranch[];
};

export function UsersView() {
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [users, setUsers] = useState<EmployeeRecord[]>([]);
  const [roles, setRoles] = useState<EmployeeRole[]>([]);
  const [branches, setBranches] = useState<EmployeeBranch[]>([]);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null);

  useEffect(() => {
    superAdminApi.companies().then((companyList) => {
      setCompanies(companyList || []);
    });
  }, []);

  useEffect(() => {
    loadUsers();
  }, [selectedCompanyId, selectedRoleId, selectedBranchId, selectedStatus, page, count]);

  const selectedCompany = companies.find((company) => company._id === selectedCompanyId);
  const selectedRole = roles.find((role) => role._id === selectedRoleId);
  const selectedBranch = branches.find((branch) => branch._id === selectedBranchId);
  const roleOptions = selectedCompanyId ? roles : [];
  const branchOptions = selectedCompanyId ? branches : [];
  const companyByTenantId = useMemo(
    () => new Map(companies.map((company) => [company.tenant_id, company])),
    [companies],
  );

  const resultSentence = useMemo(() => {
    const companyLabel = selectedCompany ? selectedCompany.display_name || selectedCompany.name : 'All companies';
    const roleLabel = selectedRole ? selectedRole.display_name || selectedRole.name : 'all roles';
    const branchLabel = selectedBranch ? `${selectedBranch.name} branch` : 'all branches';
    const statusLabel = selectedStatus ? `${selectedStatus} ` : '';
    return `There are only ${summary.totalUsers} ${statusLabel} staff members in the ${roleLabel} role at ${companyLabel} ${branchLabel}.`;
  }, [selectedBranch, selectedCompany, selectedRole, selectedStatus, summary.totalUsers]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        count,
        role: selectedRoleId,
        branch: selectedBranchId,
        status: selectedStatus,
      };
      const data = selectedCompanyId
        ? await superAdminApi.companyUsers(selectedCompanyId, params)
        : await superAdminApi.tenantUsers(params);
      setUsers(data?.users || []);
      setRoles(data?.roles || []);
      setBranches(data?.branches || []);
      setSummary({
        totalUsers: data?.totalUsers || 0,
        activeUsers: data?.activeUsers || 0,
        inactiveUsers: data?.inactiveUsers || 0,
        totalPages: data?.totalPages || 1,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setSelectedRoleId('');
    setSelectedBranchId('');
    setSelectedStatus('');
    setPage(1);
  };

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    setPage(1);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setPage(1);
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    setPage(1);
  };

  const handleCountChange = (value: string) => {
    setCount(Number(value));
    setPage(1);
  };

  const getCompanyName = (employee: EmployeeRecord) =>
    employee.tenant_id
      ? companyByTenantId.get(employee.tenant_id)?.display_name || companyByTenantId.get(employee.tenant_id)?.name || '-'
      : '-';

  const getBranchName = (employee: EmployeeRecord) => {
    if (employee.branches?.length) return employee.branches.map((branch) => branch.name).join(', ');
    if (Array.isArray(employee.ra_branch)) return employee.ra_branch.join(', ') || '-';
    return employee.ra_branch || '-';
  };

  const getRaLocationName = (employee: EmployeeRecord) => employee.ra_location?.label || '-';

  const getRoleLabel = (role?: EmployeeRole) => role?.display_name || role?.name || '-';

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

      <div className="mb-5 bg-butter-light border-2 border-pine/10 rounded-[2rem] p-5 space-y-4">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Company Name</label>
            <select value={selectedCompanyId} onChange={(event) => handleCompanyChange(event.target.value)} className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-bold outline-none focus:border-pine">
              <option value="">All Companies</option>
              {companies.map((company) => <option key={company._id} value={company._id}>{company.display_name || company.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Role</label>
            <select
              value={selectedRoleId}
              disabled={!selectedCompanyId}
              onChange={(event) => handleRoleChange(event.target.value)}
              className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-bold outline-none focus:border-pine disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!selectedCompanyId ? (
                <option value="">Select company first</option>
              ) : (
                <option value="">All Roles</option>
              )}
              {roleOptions.map((role) => <option key={role._id} value={role._id}>{role.display_name || role.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Branch</label>
            <select
              value={selectedBranchId}
              disabled={!selectedCompanyId}
              onChange={(event) => handleBranchChange(event.target.value)}
              className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-bold outline-none focus:border-pine disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!selectedCompanyId ? (
                <option value="">Select company first</option>
              ) : (
                <option value="">All Branches</option>
              )}
              {branchOptions.map((branch) => <option key={branch._id} value={branch._id}>{branch.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Active / Inactive</label>
            <select value={selectedStatus} onChange={(event) => handleStatusChange(event.target.value)} className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine font-bold outline-none focus:border-pine">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        {/* {!selectedCompanyId && (
          <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            Abhi <span className="underline">All Companies</span> mode chal raha hai — isliye Karmyug aur doosri companies ka staff bhi dikh sakta hai.
            Sirf Bohra Associates dekhne ke liye upar se company select karein.
          </div>
        )} */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-pine/[0.04] rounded-2xl px-4 py-3">
          <p className="text-pine font-extrabold">{resultSentence}</p>
          <div className="text-sm font-bold text-pine/60">
            Active: {summary.activeUsers} / Inactive: {summary.inactiveUsers}
          </div>
        </div>
      </div>

      <div className="bg-butter-light border-2 border-pine/10 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-pine/10 text-pine/60 uppercase text-xs tracking-wider">
                <th className="p-6 font-bold">Employee</th>
                <th className="p-6 font-bold">Company</th>
                <th className="p-6 font-bold">Role</th>
                <th className="p-6 font-bold">Branch</th>
                <th className="p-6 font-bold">Department</th>
                <th className="p-6 font-bold">Status</th>
                <th className="p-6 font-bold">Action</th>
              </tr>
            </thead>
            {loading ? (
              <TableSkeleton columns={7} />
            ) : (
            <tbody className="divide-y divide-pine/5">
              {!loading && users.map((u) => (
                <tr key={u._id || u.user?._id} className="hover:bg-pine/[0.02] transition-colors">
                  <td className="p-6">
                    <div className="font-bold text-lg text-pine">{u.user?.name || '-'}</div>
                    <div className="text-sm font-medium text-pine/60">{u.user?.email || '-'}</div>
                    <div className="text-xs font-bold text-pine/40 mt-1">{u.employee_id || 'No employee ID'}</div>
                  </td>
                  <td className="p-6 font-bold text-pine/80">
                    {getCompanyName(u)}
                  </td>
                  <td className="p-6">
                    <span className="bg-pine/10 text-pine font-bold px-3 py-1 rounded-full text-xs">
                      {getRoleLabel(u.roles?.[0])}
                    </span>
                  </td>
                  <td className="p-6 font-bold text-pine/80">
                    <div>{getBranchName(u)}</div>
                    <div className="text-xs text-pine/50 mt-1">{getRaLocationName(u)}</div>
                  </td>
                  <td className="p-6 font-bold text-pine/80">
                    <div>{u.department || '-'}</div>
                    <div className="text-xs text-pine/50 mt-1">{u.designation || '-'}</div>
                  </td>
                  <td className="p-6">
                    <span className={`${u.user?.status === 'inactive' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-[#d1f4da] text-[#115e3c] border-[#b0e8c1]'} border font-bold px-3 py-1 rounded-full text-xs capitalize`}>
                      {u.user?.status || 'active'}
                    </span>
                  </td>
                  <td className="p-6">
                    <button
                      onClick={() => setSelectedEmployee(u)}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-pine text-butter px-4 py-2 text-xs font-extrabold hover:bg-pine/90 transition-colors"
                    >
                      <Eye size={14} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-pine/50 font-bold">No employees found for selected filters.</td>
                </tr>
              )}
            </tbody>
            )}
          </table>
        </div>
        <div className="border-t border-pine/10 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-pine/70">
            <span>Rows per page</span>
            <select value={count} onChange={(event) => handleCountChange(event.target.value)} className="bg-butter border border-pine/20 rounded-lg px-2 py-1 outline-none">
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-pine/70">Page {page} of {summary.totalPages}</span>
            <button disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(current - 1, 1))} className="p-2 rounded-full bg-pine/10 text-pine disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft size={18} />
            </button>
            <button disabled={page >= summary.totalPages || loading} onClick={() => setPage((current) => Math.min(current + 1, summary.totalPages))} className="p-2 rounded-full bg-pine/10 text-pine disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pine/40 px-4 py-6">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-butter-light border-2 border-pine/10 shadow-2xl">
            <div className="sticky top-0 bg-butter-light border-b border-pine/10 p-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-pine/50">Employee Details</p>
                <h2 className="text-2xl font-extrabold text-pine mt-1">
                  {selectedEmployee.user?.name || '-'}
                </h2>
                <p className="text-sm font-bold text-pine/60">{selectedEmployee.user?.email || '-'}</p>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="rounded-full bg-pine/10 p-2 text-pine hover:bg-pine/20 transition-colors"
                aria-label="Close employee details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-pine/[0.04] p-4">
                  <p className="text-xs font-extrabold uppercase text-pine/50">Company</p>
                  <p className="mt-1 font-extrabold text-pine">{getCompanyName(selectedEmployee)}</p>
                </div>
                <div className="rounded-2xl bg-pine/[0.04] p-4">
                  <p className="text-xs font-extrabold uppercase text-pine/50">Branch</p>
                  <p className="mt-1 font-extrabold text-pine">{getBranchName(selectedEmployee)}</p>
                  <p className="mt-1 text-xs font-bold text-pine/50">Location: {getRaLocationName(selectedEmployee)}</p>
                </div>
                <div className="rounded-2xl bg-pine/[0.04] p-4">
                  <p className="text-xs font-extrabold uppercase text-pine/50">Status</p>
                  <p className="mt-1 font-extrabold capitalize text-pine">{selectedEmployee.user?.status || 'active'}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase text-pine/50">Employee ID</p>
                  <p className="mt-1 font-bold text-pine">{selectedEmployee.employee_id || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase text-pine/50">Mobile</p>
                  <p className="mt-1 font-bold text-pine">{selectedEmployee.user?.mobile || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase text-pine/50">Department</p>
                  <p className="mt-1 font-bold text-pine">{selectedEmployee.department || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase text-pine/50">Designation</p>
                  <p className="mt-1 font-bold text-pine">{selectedEmployee.designation || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase text-pine/50">Employment Status</p>
                  <p className="mt-1 font-bold text-pine">{selectedEmployee.employment_status || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase text-pine/50">Login Email</p>
                  <p className="mt-1 font-bold text-pine">{selectedEmployee.user?.email || '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase text-pine/50 mb-3">All Roles</p>
                <div className="flex flex-wrap gap-2">
                  {selectedEmployee.roles?.length ? (
                    selectedEmployee.roles.map((role) => (
                      <span key={role._id} className="bg-pine/10 text-pine font-bold px-3 py-1 rounded-full text-xs">
                        {getRoleLabel(role)}
                      </span>
                    ))
                  ) : (
                    <span className="font-bold text-pine/50">No roles assigned</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
