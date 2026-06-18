import { useState } from 'react';
import { Building2, LayoutDashboard, Users, CreditCard, Shield, Settings, FileText, Blocks, LogOut, X, ChevronDown } from 'lucide-react';
import { cn } from '../utils';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function Sidebar({ currentView, onNavigate, isOpen, onClose, onLogout }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    tenants:
      currentView.startsWith('tenants') ||
      currentView.startsWith('tenant-detail:') ||
      currentView.startsWith('tenant-payment:') ||
      currentView.startsWith('tenant-edit:') ||
      currentView === 'tenant-create',
  });

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'tenants',
      label: 'Tenants',
      icon: Building2,
      children: [
        { id: 'tenants', label: 'All Tenants' },
        { id: 'tenants-suspended', label: 'Suspended' },
        { id: 'tenants-trash', label: 'Trash' },
      ],
    },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'features', label: 'Feature Flags', icon: Blocks },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'audit', label: 'Audit Logs', icon: Shield },
    { id: 'settings', label: 'Super Settings', icon: Settings },
    // { id: 'architecture', label: 'Architecture Plan', icon: FileText },
  ];

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 transform bg-white border-r border-[#8ab097]/40 w-[280px] p-6 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 h-full flex flex-col pt-6 md:pt-10 shrink-0",
      isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
    )}>
      <div className="flex items-center justify-between mb-8 md:mb-10 px-2">
        <div className="flex items-center gap-3">
          {/* <div className="bg-pine text-butter h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-sm">
            V
          </div> */}
          <img src="/logo.png" alt="Valuxpert Logo" className="h-10 w-10  " />
          <div>
            <h1 className="font-bold text-lg fs-20px leading-tight tracking-tight">Valuxpert</h1> 
          </div>
        </div>
        <button 
          onClick={onClose}
          className="md:hidden p-2 text-pine hover:bg-pine/10 rounded-full cursor-pointer transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar -mr-2">
        {navItems.map((item) => {
          const isTenantSection = item.id === 'tenants';
          const isActive = isTenantSection
            ? currentView.startsWith('tenants') ||
              currentView.startsWith('tenant-detail:') ||
              currentView.startsWith('tenant-payment:') ||
              currentView.startsWith('tenant-edit:') ||
              currentView === 'tenant-create'
            : currentView === item.id;
          const isExpanded = item.children ? expandedItems[item.id] || isActive : false;
          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.children) {
                    setExpandedItems((current) => ({ ...current, [item.id]: !isExpanded }));
                    return;
                  }
                  onNavigate(item.id);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-bold transition-all duration-200 border-2 cursor-pointer",
                  isActive
                    ? "bg-pine text-butter border-pine" 
                    : "text-pine hover:bg-pine/5 border-transparent hover:border-pine/10"
                )}
              >
                <item.icon size={18} className={cn("transition-colors", isActive ? "text-butter" : "text-pine")} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.children && (
                  <ChevronDown
                    size={16}
                    className={cn("transition-transform", isExpanded ? "rotate-180" : "rotate-0")}
                  />
                )}
              </button>
              {item.children && isExpanded && (
                <div className="ml-7 mt-2 space-y-1 border-l-2 border-pine/10 pl-3">
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => onNavigate(child.id)}
                      className={cn(
                        "block w-full rounded-full px-3 py-2 text-left text-xs font-black transition-colors cursor-pointer",
                        currentView === child.id
                          ? "bg-pine/10 text-pine"
                          : "text-pine/60 hover:bg-pine/5 hover:text-pine",
                      )}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="pt-4 mt-auto">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-bold text-pine hover:bg-pine/5 transition-colors border-2 border-transparent hover:border-pine/10 cursor-pointer"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
