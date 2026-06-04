export type SubscriptionPlan = 'Starter' | 'Business' | 'Enterprise';
export type TenantStatus = 'Active' | 'Suspended' | 'Deleted';

export interface Tenant {
  id: string;
  tenant_id: string;
  companyName: string;
  address?: string;
  gstNumber?: string;
  ownerName?: string;
  contactEmail?: string;
  adminEmail: string;
  status: TenantStatus;
  plan: SubscriptionPlan;
  usersCount: number;
  employeesCount: number;
  monthlyRevenue: number;
  features: string[];
  createdAt: string;
}

export interface DashboardStats {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  totalEmployees: number;
  totalActiveUsers: number;
  monthlyRevenue: number;
}

export interface ApiCompany {
  _id: string;
  tenant_id: string;
  name: string;
  display_name?: string;
  description?: string;
  status: 'active' | 'suspended' | 'deleted';
  admin_contact?: {
    name?: string;
    email?: string;
    personal_email?: string;
    mobile?: string;
    login_url?: string;
    user_id?: string;
  };
  features?: string[];
  subscription?: {
    plan_key?: string;
    plan_name?: string;
    status?: string;
    start_date?: string;
    renewal_date?: string;
    payment_status?: string;
  };
  limits?: {
    max_users?: number;
    max_employees?: number;
    storage_mb?: number;
    api_calls_per_month?: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface ApiPlan {
  _id?: string;
  key: string;
  name: string;
  description?: string;
  allowed_modules: string[];
  limits: {
    max_employees?: number;
    max_users?: number;
    storage_mb?: number;
    api_calls_per_month?: number;
  };
  feature_access?: Record<string, boolean>;
  monthly_price?: number;
  is_active?: boolean;
}

export interface ApiFeature {
  key: string;
  name: string;
  description: string;
}

export interface ApiAuditLog {
  _id: string;
  tenant_id?: string;
  company_name?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  actor_email?: string;
  description?: string;
  created_at?: string;
}
