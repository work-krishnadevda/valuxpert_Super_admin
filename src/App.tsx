import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { TenantManagementView } from './views/TenantManagementView';
import { ArchitectureDoc } from './views/ArchitectureDoc';
import { SubscriptionsView } from './views/SubscriptionsView';
import { FeaturesView } from './views/FeaturesView';
import { SettingsView } from './views/SettingsView';
import { UsersView } from './views/UsersView';
import { AuditView } from './views/AuditView';
import { LoginView } from './views/LoginView';
import { authStore } from './services/superAdminApi';
import { BillingView } from './views/BillingView';
import { ConfirmDialog } from './components/ConfirmDialog';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(authStore.getToken()));
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginView onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'tenants':
        return <TenantManagementView />;
      case 'subscriptions':
        return <SubscriptionsView />;
      case 'billing':
        return <BillingView />;
      case 'features':
        return <FeaturesView />;
      case 'users':
        return <UsersView />;
      case 'audit':
        return <AuditView />;
      case 'settings':
        return <SettingsView />;
      case 'architecture':
        return <ArchitectureDoc />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
            <h2 className="text-3xl font-bold text-pine/30 mb-4 capitalize">{currentView} Module</h2>
            <p className="text-pine/50 font-medium">This module is actively under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-butter text-pine flex w-full relative">
      <Sidebar 
        currentView={currentView} 
        onNavigate={(view) => { setCurrentView(view); setIsSidebarOpen(false); }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={() => setIsLogoutConfirmOpen(true)}
      />
      
      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-butter border-b border-pine/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-pine text-butter h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">
              V
            </div>
            <h1 className="font-bold text-base leading-tight tracking-tight text-pine">Valuxpert Admin</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 -mr-2 text-pine hover:bg-pine/5 rounded-lg cursor-pointer transition-colors"
            aria-label="Open Mobile Menu"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-[1400px] mx-auto w-full p-4 sm:p-6 md:p-10">
            {renderView()}
          </div>
        </div>
      </main>

      {/* Mobile Drawer Overlay Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-pine/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <ConfirmDialog
        open={isLogoutConfirmOpen}
        title="Logout?"
        message="Are you sure you want to logout from Super Admin?"
        confirmLabel="Logout"
        danger
        onCancel={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => {
          authStore.clear();
          setIsAuthenticated(false);
          setIsLogoutConfirmOpen(false);
        }}
      />
    </div>
  );
}
