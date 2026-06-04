import { useState, useRef, useEffect } from 'react';
import { Plus, Search, MoreVertical, Building2, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import type { Tenant } from '../types';
import { cn } from '../utils';

const initialTenants: Tenant[] = [
  { id: '1', tenant_id: 't_sk_1a2b', companyName: 'Acme Corp', adminEmail: 'admin@acme.com', status: 'Active', plan: 'Enterprise', usersCount: 145, employeesCount: 412, monthlyRevenue: 1200, features: ['HRMS', 'Cases', 'Payroll'], createdAt: '2025-01-15' },
  { id: '2', tenant_id: 't_sk_9x8c', companyName: 'Globex Inc', adminEmail: 'it@globex.dev', status: 'Active', plan: 'Business', usersCount: 42, employeesCount: 89, monthlyRevenue: 600, features: ['HRMS', 'Cases'], createdAt: '2025-02-02' },
  { id: '3', tenant_id: 't_sk_4f3q', companyName: 'Initech', adminEmail: 'bill@initech.co', status: 'Suspended', plan: 'Starter', usersCount: 12, employeesCount: 45, monthlyRevenue: 150, features: ['HRMS'], createdAt: '2025-03-22' },
  { id: '4', tenant_id: 't_sk_5d9p', companyName: 'Soylent Corp', adminEmail: 'admin@soylent.co', status: 'Active', plan: 'Enterprise', usersCount: 300, employeesCount: 850, monthlyRevenue: 1200, features: ['All Modules'], createdAt: '2025-04-10' },
];

export function TenantListView() {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredTenants = tenants.filter(t => 
    t.companyName.toLowerCase().includes(search.toLowerCase()) || 
    t.tenant_id.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newCompany: Tenant = {
       id: Date.now().toString(),
       tenant_id: `t_sk_${Math.random().toString(36).substr(2, 4)}`,
       companyName: (form.elements.namedItem('companyName') as HTMLInputElement).value,
       address: (form.elements.namedItem('address') as HTMLInputElement).value,
       gstNumber: (form.elements.namedItem('gstNumber') as HTMLInputElement).value,
       ownerName: (form.elements.namedItem('ownerName') as HTMLInputElement).value,
       contactEmail: (form.elements.namedItem('contactEmail') as HTMLInputElement).value,
       adminEmail: (form.elements.namedItem('adminEmail') as HTMLInputElement).value,
       status: 'Active',
       plan: 'Starter',
       usersCount: 1,
       employeesCount: 1,
       monthlyRevenue: 0,
       features: ['HRMS'],
       createdAt: new Date().toISOString().split('T')[0]
    };
    setTenants([newCompany, ...tenants]);
    setIsCreateModalOpen(false);
  };

  const handleToggleStatus = (tenantId: string) => {
    setTenants(prev => prev.map(t => 
      t.id === tenantId ? { ...t, status: t.status === 'Active' ? 'Suspended' : 'Active' } : t
    ));
    setActiveDropdownId(null);
  };

  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1 md:mb-2 text-pine">Tenants Management</h1>
          <p className="text-pine/70 font-medium text-base md:text-lg">Manage companies, subscriptions, and access.</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-pine text-butter hover:bg-pine/90 transition-colors px-5 md:px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 shadow-sm whitespace-nowrap cursor-pointer"
        >
          <Plus strokeWidth={2.5} size={20} />
          Create Company
        </button>
      </div>

      <div className="bg-butter-light border-2 border-pine/10 rounded-2xl md:rounded-[2rem] flex flex-col items-stretch overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 md:p-6 border-b border-pine/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pine/50" size={20} />
            <input 
              type="text" 
              placeholder="Search companies..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-butter border-2 border-pine/20 rounded-full py-2.5 md:py-3 pl-12 pr-4 text-pine placeholder:text-pine/50 font-medium outline-none focus:border-pine transition-all shadow-sm"
            />
          </div>
          <div className="text-sm font-bold text-pine/60 shrink-0">
            Showing {filteredTenants.length} tenants
          </div>
        </div>

        {/* Scalable Table Wrapper for Scroling */}
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap md:whitespace-normal min-w-[700px]">
            <thead>
              <tr className="border-b border-pine/10 text-pine/60 uppercase text-xs md:text-sm tracking-wider">
                <th className="p-4 md:p-6 font-bold w-1/4">Company</th>
                <th className="p-4 md:p-6 font-bold">Plan</th>
                <th className="p-4 md:p-6 font-bold">Users / Empl.</th>
                <th className="p-4 md:p-6 font-bold">Status</th>
                <th className="p-4 md:p-6 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine/5">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-pine/[0.02] transition-colors group">
                  <td className="p-4 md:p-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 bg-butter border-2 border-pine/10 rounded-xl flex items-center justify-center text-pine font-bold text-lg shadow-sm">
                        {tenant.companyName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-base md:text-lg text-pine leading-tight truncate">{tenant.companyName}</p>
                        <p className="text-xs md:text-sm font-mono opacity-60 truncate mt-0.5">{tenant.tenant_id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 md:p-6">
                    <span className="font-bold border-2 border-pine/10 bg-butter/50 px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm inline-flex">
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="p-4 md:p-6 font-semibold text-pine/80 text-sm md:text-base">
                    {tenant.usersCount} <span className="text-pine/40 font-normal mx-1">/</span> {tenant.employeesCount}
                  </td>
                  <td className="p-4 md:p-6">
                    <span className={cn(
                      "font-bold px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm inline-flex items-center gap-1.5 border-2 shadow-sm",
                      tenant.status === 'Active' 
                        ? "bg-[#d1f4da] text-[#115e3c] border-[#b0e8c1]" 
                        : "bg-[#ffe0e0] text-[#8a2222] border-[#ffc2c2]"
                    )}>
                      {tenant.status === 'Active' ? <CheckCircle2 size={14} /> : <ShieldAlert size={14} />}
                      {tenant.status}
                    </span>
                  </td>
                  <td className="p-4 md:p-6 text-right relative">
                    <button 
                      onClick={() => setActiveDropdownId(activeDropdownId === tenant.id ? null : tenant.id)}
                      className="text-pine/50 hover:text-pine hover:bg-pine/10 transition-colors p-2 rounded-full cursor-pointer"
                    >
                      <MoreVertical size={20} />
                    </button>
                    
                    {/* Action Context Menu Dropdown */}
                    {activeDropdownId === tenant.id && (
                      <div 
                        ref={dropdownRef}
                        className="absolute right-6 top-12 md:top-14 mt-1 w-48 bg-butter border-2 border-pine/10 rounded-xl shadow-lg z-20 py-2 flex flex-col overflow-hidden"
                      >
                        <button 
                          onClick={() => { alert('Edit flow triggered!'); setActiveDropdownId(null); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-pine/10 text-pine font-semibold text-sm cursor-pointer transition-colors"
                        >
                          Edit details
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(tenant.id)}
                          className="w-full text-left px-4 py-2.5 hover:bg-pine/10 text-pine font-semibold text-sm cursor-pointer transition-colors"
                        >
                          {tenant.status === 'Active' ? 'Suspend access' : 'Reactivate access'}
                        </button>
                        <div className="h-px bg-pine/10 my-1 w-full" />
                        <button 
                          onClick={() => { setTenants(prev => prev.filter(t => t.id !== tenant.id)); setActiveDropdownId(null); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-[#ffe0e0] text-[#8a2222] font-semibold text-sm cursor-pointer transition-colors"
                        >
                          Delete company
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 md:p-12 text-center text-pine/50 font-medium">
                    <div className="flex flex-col items-center justify-center">
                       <Building2 size={48} className="opacity-20 mb-4" />
                       <p>No companies found matching "{search}"</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Modal: Create Company */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-pine/50 backdrop-blur-sm cursor-pointer" 
            onClick={() => setIsCreateModalOpen(false)}
          ></div>
          <div className="relative bg-butter-light border-2 border-pine/10 rounded-[2rem] p-6 md:p-8 max-w-2xl w-full shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-pine tracking-tight">Create Company</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-pine/50 hover:bg-pine/10 hover:text-pine rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Company Name</label>
                  <input 
                    name="companyName"
                    required
                    type="text" 
                    placeholder="e.g. Acme Corp" 
                    className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine placeholder:text-pine/40 font-medium outline-none focus:border-pine transition-colors shadow-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Address</label>
                  <input 
                    name="address"
                    required
                    type="text" 
                    placeholder="e.g. 123 Business St, Tech Park" 
                    className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine placeholder:text-pine/40 font-medium outline-none focus:border-pine transition-colors shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">GST Number</label>
                  <input 
                    name="gstNumber"
                    required
                    type="text" 
                    placeholder="e.g. 22AAAAA0000A1Z5" 
                    className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine placeholder:text-pine/40 font-medium outline-none focus:border-pine transition-colors shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Owner Name</label>
                  <input 
                    name="ownerName"
                    required
                    type="text" 
                    placeholder="e.g. John Doe" 
                    className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine placeholder:text-pine/40 font-medium outline-none focus:border-pine transition-colors shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Contact Email</label>
                  <input 
                    name="contactEmail"
                    required
                    type="email" 
                    placeholder="contact@company.com" 
                    className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine placeholder:text-pine/40 font-medium outline-none focus:border-pine transition-colors shadow-sm"
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-pine/10">
                <h3 className="text-lg font-bold text-pine mb-4">Login Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Login Email (Admin)</label>
                    <input 
                      name="adminEmail"
                      required
                      type="email" 
                      placeholder="admin@company.com" 
                      className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine placeholder:text-pine/40 font-medium outline-none focus:border-pine transition-colors shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">Password</label>
                    <input 
                      name="password"
                      required
                      type="password" 
                      placeholder="••••••••" 
                      className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 px-4 text-pine placeholder:text-pine/40 font-medium outline-none focus:border-pine transition-colors shadow-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-3 border-2 border-pine/20 text-pine font-bold rounded-xl hover:bg-pine/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-pine text-butter font-bold rounded-xl hover:bg-pine-light transition-colors shadow-md cursor-pointer"
                >
                  Create & Setup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
