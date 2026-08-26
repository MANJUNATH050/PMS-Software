import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Target,
  History,
  FileText,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, icon, label, active, onClick }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
        active
          ? 'bg-pms-lightGreen text-pms-darkGreen font-semibold border-l-4 border-pms-green'
          : 'text-slate-600 hover:bg-slate-100 hover:text-pms-gray'
      }`}
    >
      <div className={`${active ? 'text-pms-green' : 'text-slate-400 group-hover:text-pms-gray'}`}>
        {icon}
      </div>
      <span className="text-sm">{label}</span>
    </Link>
  );
};

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'My KPIs', href: '/kpis', icon: <Target size={20} /> },
    { name: 'PMS History', href: '/history', icon: <History size={20} /> },
    { name: 'My Reports', href: '/reports', icon: <FileText size={20} /> },
    { name: 'My Profile', href: '/profile', icon: <User size={20} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-slate-200 shrink-0 sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-white">
          <div className="flex items-center space-x-3">
            {/* Minimal Logo */}
            <div className="w-8 h-8 rounded bg-pms-green flex items-center justify-center text-white font-bold text-lg shadow-sm">
              P
            </div>
            <div>
              <span className="font-bold text-pms-gray text-lg tracking-tight">ASEURO</span>
              <span className="text-xs text-pms-green font-semibold block -mt-1">PMS PORTAL</span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navigation.map((item) => (
            <SidebarItem
              key={item.name}
              to={item.href}
              icon={item.icon}
              label={item.name}
              active={location.pathname === item.href}
            />
          ))}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center space-x-3 p-2 rounded-lg bg-slate-50 mb-3">
            <div className="w-9 h-9 rounded-full bg-pms-green/20 flex items-center justify-center font-bold text-pms-darkGreen uppercase shadow-inner">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-pms-gray truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 truncate capitalize">{user?.role?.replace('ROLE_', '').toLowerCase() || 'Employee'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors duration-200 text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-pms-green flex items-center justify-center text-white font-bold text-lg shadow-sm">
            P
          </div>
          <span className="font-bold text-pms-gray tracking-tight">ASEURO PMS</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-600 focus:outline-none hover:bg-slate-100 rounded-lg"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Sidebar overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
          <aside className="w-72 max-w-[80vw] h-full bg-white flex flex-col shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <div className="h-16 flex items-center px-6 border-b border-slate-100 justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded bg-pms-green flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  P
                </div>
                <span className="font-bold text-pms-gray tracking-tight">ASEURO PMS</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1">
              {navigation.map((item) => (
                <SidebarItem
                  key={item.name}
                  to={item.href}
                  icon={item.icon}
                  label={item.name}
                  active={location.pathname === item.href}
                  onClick={() => setMobileMenuOpen(false)}
                />
              ))}
            </nav>
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-pms-green/20 flex items-center justify-center font-bold text-pms-darkGreen uppercase shadow-inner">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-pms-gray">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-500 uppercase">{user?.role?.replace('ROLE_', '') || 'Employee'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors duration-200 text-sm font-medium"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto h-screen">
        {/* Top bar for desktop */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 shrink-0">
          <div>
            <h1 className="text-slate-500 font-medium text-sm flex items-center space-x-1">
              <span>Employee Portal</span>
              <ChevronRight size={14} className="text-slate-300" />
              <span className="text-slate-800 font-semibold">{navigation.find(n => n.href === location.pathname)?.name || 'Portal'}</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-pms-gray">{user?.name || 'User'}</span>
              <span className="text-xs text-slate-400 capitalize">{user?.role?.replace('ROLE_', '').toLowerCase() || 'Employee'}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-pms-green text-white flex items-center justify-center font-semibold text-md shadow-sm border border-white">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
            </div>
          </div>
        </header>

        {/* Content body */}
        <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto pb-12">
          {children}
        </div>
      </main>
    </div>
  );
};
export default DashboardLayout;
