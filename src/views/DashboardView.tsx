import { useEffect, useState } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { Building, Users, Activity, CreditCard, Building2, UserCircle, Filter, Calendar } from 'lucide-react';
import type { ApiCompany, ApiPlan, DashboardStats } from '../types';
import { superAdminApi } from '../services/superAdminApi';

const fallbackStats: DashboardStats = {
  totalCompanies: 0,
  activeCompanies: 0,
  suspendedCompanies: 0,
  totalEmployees: 0,
  totalActiveUsers: 0,
  monthlyRevenue: 0,
};

export function DashboardView({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [dateFilter, setDateFilter] = useState('Last 30 Days');
  const [companyFilter, setCompanyFilter] = useState('All Companies');
  const [stats, setStats] = useState<DashboardStats>(fallbackStats);
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([superAdminApi.dashboard(), superAdminApi.companies(), superAdminApi.plans()])
      .then(([dashboard, companyList, planList]) => {
        setStats({ ...fallbackStats, ...dashboard });
        setCompanies(companyList || []);
        setPlans(planList || []);
      })
      .catch((err) => setError(err?.message || 'Unable to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  const filteredCompanies = companies.filter((company) => {
    if (companyFilter === 'Active Only') return company.status === 'active';
    if (companyFilter === 'Suspended Only') return company.status === 'suspended';
    return true;
  });

  const revenueData = [
    { name: 'Companies', revenue: stats.monthlyRevenue, activeTenants: stats.activeCompanies },
    ...filteredCompanies.slice(0, 5).map((company) => ({
      name: company.display_name || company.name,
      revenue: Number(company.subscription?.payment_status === 'paid' ? company.limits?.max_users || 0 : 0),
      activeTenants: company.status === 'active' ? 1 : 0,
    })),
  ];

  const planDistributionData = plans.map((plan, index) => ({
    name: plan.name,
    value: companies.filter((company) => company.subscription?.plan_key === plan.key).length,
    color: ['#8ab097', '#186851', '#114c3a', '#013e37'][index % 4],
  })).filter((item) => item.value > 0);

  const statCards = [
    { label: "Total Companies", value: stats.totalCompanies, icon: Building2, trend: `${companies.length} total`, target: 'tenants' },
    { label: "Active Companies", value: stats.activeCompanies, icon: Activity, trend: "live", target: 'tenants' },
    { label: "Total Employees", value: stats.totalEmployees, icon: Users, trend: "tenant scoped", target: 'users' },
    { label: "Tenant Admin Accounts", value: stats.totalActiveUsers, icon: UserCircle, trend: "per active company", target: 'users' },
    { label: "Monthly Revenue", value: `₹${Number(stats.monthlyRevenue || 0).toLocaleString('en-IN')}`, icon: CreditCard, trend: "this month", target: 'billing' },
    { label: "Suspended", value: stats.suspendedCompanies, icon: Building, trend: "review", target: 'tenants-suspended' },
  ];

  return (
    <div className="w-full pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1 md:mb-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-pine">Platform Analytics Overview</h1>
            <span className="relative flex h-3 w-3 mt-1.5 md:mt-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#186851] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#114c3a]"></span>
            </span>
          </div>
          <p className="text-pine/70 font-medium text-base md:text-lg">Real-time system metrics, revenue, and usage statistics</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 self-start lg:self-auto">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-pine/50" size={18} />
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-butter border-2 border-pine/10 rounded-full py-2.5 pl-10 pr-8 text-pine font-bold text-sm appearance-none outline-none focus:border-pine/30 cursor-pointer shadow-sm hover:border-pine/30 transition-colors"
            >
              <option>Last 30 Days</option>
              <option>Last 3 Months</option>
              <option>This Year</option>
              <option>All Time</option>
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-pine/50" size={18} />
            <select 
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="bg-butter border-2 border-pine/10 rounded-full py-2.5 pl-10 pr-8 text-pine font-bold text-sm appearance-none outline-none focus:border-pine/30 cursor-pointer shadow-sm hover:border-pine/30 transition-colors"
            >
              <option>All Companies</option>
              <option>Active Only</option>
              <option>Suspended Only</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4 text-red-700 font-bold">
          {error}
        </div>
      )}

      {loading && (
        <div className="mb-6 rounded-2xl border-2 border-pine/10 bg-butter-light px-5 py-4 text-pine/70 font-bold">
          Loading live dashboard data...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {statCards.map((stat, i) => (
          <button 
            key={i} 
            onClick={() => onNavigate?.(stat.target)}
            title={`Open ${stat.label}`}
            className="bg-butter-light border-2 border-pine/10 p-5 md:p-6 rounded-2xl md:rounded-3xl flex items-center justify-between text-left transition-all hover:-translate-y-1 hover:shadow-lg hover:border-pine/20 cursor-pointer w-full group"
          >
            <div>
              <p className="text-xs md:text-sm font-bold text-pine/60 uppercase tracking-wider mb-1.5 group-hover:text-pine/80 transition-colors">{stat.label}</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl md:text-4xl font-extrabold tracking-tight text-pine">{stat.value}</p>
                {stat.trend && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full border bg-[#d1f4da] text-[#115e3c] border-[#b0e8c1]">
                    {stat.trend}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-pine text-butter h-12 w-12 md:h-14 md:w-14 rounded-full flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
              <stat.icon size={24} strokeWidth={2.5}/>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-butter-light border-2 border-pine/10 p-5 md:p-8 rounded-2xl md:rounded-[2rem] w-full shadow-sm hover:border-pine/20 transition-all">
          <h2 className="text-lg md:text-xl font-bold tracking-tight mb-6">Revenue & Tenant Growth Trends</h2>
          <div className="h-64 md:h-80 w-full relative -ml-4 md:ml-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#114c3a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#114c3a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#114c3a" opacity={0.6} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis yAxisId="left" stroke="#114c3a" opacity={0.6} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} fontSize={12} width={50} />
                <YAxis yAxisId="right" orientation="right" stroke="#8ab097" opacity={0.6} tickLine={false} axisLine={false} fontSize={12} width={40} />
                <Tooltip 
                  cursor={{ stroke: 'rgba(17, 76, 58, 0.2)', strokeWidth: 2, strokeDasharray: '5 5' }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#114c3a', color: '#ffefb3', fontWeight: 'bold' }}
                  itemStyle={{ color: '#ffefb3' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#114c3a' }} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" name="Monthly Revenue" stroke="#114c3a" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                <Line yAxisId="right" type="monotone" dataKey="activeTenants" name="Active Tenants" stroke="#8ab097" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-butter-light border-2 border-pine/10 p-5 md:p-8 rounded-2xl md:rounded-[2rem] w-full shadow-sm hover:border-pine/20 transition-all">
          <h2 className="text-lg md:text-xl font-bold tracking-tight mb-6">Plan Distribution</h2>
          <div className="h-64 md:h-80 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {(planDistributionData.length ? planDistributionData : [{ name: 'No Data', value: 1, color: '#8ab097' }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#114c3a', color: '#ffefb3', fontWeight: 'bold' }}
                  itemStyle={{ color: '#ffefb3' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#114c3a' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
