
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  ShoppingCart, 
  Briefcase, 
  LogOut,
  ChevronRight,
  User as UserIcon,
  ShieldAlert,
  Wallet,
  Globe,
  CloudCheck
} from 'lucide-react';
import { User } from '../types';
import { SYSTEM_CONFIG } from '../constants';

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/letters', icon: FileText, label: 'Letter Generator' },
    { path: '/po', icon: ShoppingCart, label: 'PO Numbers' },
    { path: '/tugas', icon: Briefcase, label: 'Tugas Requests' },
    { path: '/ppu', icon: Wallet, label: 'PPU Form' },
  ];

  if (user.role === 'admin') {
    navItems.push({ path: '/admin', icon: ShieldAlert, label: 'Admin Panel' });
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight uppercase tracking-tighter">{SYSTEM_CONFIG.PORTAL_NAME}</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">by {SYSTEM_CONFIG.COMPANY_NAME}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
                {isActive && <ChevronRight size={16} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 mt-auto space-y-4">
          <div className="px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Cloud Connected</span>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
              <UserIcon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">M</div>
            <span className="font-bold text-gray-900">{SYSTEM_CONFIG.PORTAL_NAME}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{SYSTEM_CONFIG.FULL_COMPANY_NAME}</p>
              <p className="text-xs text-gray-500">Official Office Portal</p>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
