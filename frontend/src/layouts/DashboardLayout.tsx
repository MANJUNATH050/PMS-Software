import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Target,
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
      className={`flex items-center space-x-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
        active
          ? 'bg-pms-lightGreen text-pms-darkGreen font-bold border-l-4 border-pms-green shadow-xs'
          : 'text-slate-600 hover:bg-slate-100/90 hover:text-pms-gray font-medium'
      }`}
    >
      <div className={`shrink-0 transition-colors ${active ? 'text-pms-green' : 'text-slate-400 group-hover:text-pms-gray'}`}>
        {icon}
      </div>
      <span className="text-[15px] tracking-tight">{label}</span>
    </Link>
  );
};

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={22} /> },
    { name: 'My KPIs', href: '/kpis', icon: <Target size={22} /> },
    { name: 'My Reports', href: '/reports', icon: <FileText size={22} /> },
    { name: 'My Profile', href: '/profile', icon: <User size={22} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-72 flex-col bg-white border-r border-slate-200 shrink-0 sticky top-0 h-screen">
        {/* Brand Header */}
        <div className="h-18 md:h-20 flex items-center px-6 border-b border-slate-100 bg-white">
          <div className="flex items-center space-x-3.5">
            {/* Minimal Logo */}
            <div className="w-10 h-10 rounded-xl bg-pms-green flex items-center justify-center text-white font-bold text-xl shadow-sm">
              P
            </div>
            <div>
              <span className="font-bold text-pms-gray text-xl tracking-tight">ASEURO</span>
              <span className="text-xs text-pms-green font-bold block -mt-1 tracking-wider uppercase">PMS Portal</span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-6 space-y-2">
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
          <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 mb-3">
            <div className="w-10 h-10 rounded-full bg-pms-green/20 flex items-center justify-center font-bold text-pms-darkGreen uppercase shadow-inner text-sm shrink-0">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-pms-gray truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{user?.role?.replace('ROLE_', '').toLowerCase() || 'Employee'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors duration-200 text-sm font-semibold"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-pms-green flex items-center justify-center text-white font-bold text-lg shadow-sm">
            P
          </div>
          <div>
            <span className="font-bold text-pms-gray tracking-tight">ASEURO</span>
            <span className="text-[10px] text-pms-green font-bold ml-1.5 uppercase">PMS Portal</span>
          </div>
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
          <aside className="w-72 max-w-[85vw] h-full bg-white flex flex-col shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <div className="h-18 flex items-center px-6 border-b border-slate-100 justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-lg bg-pms-green flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  P
                </div>
                <div>
                  <span className="font-bold text-pms-gray text-lg tracking-tight">ASEURO</span>
                  <span className="text-xs text-pms-green font-bold block -mt-1 uppercase">PMS Portal</span>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
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
              <div className="flex items-center space-x-3.5 mb-3 p-2 rounded-lg bg-white border border-slate-150">
                <div className="w-10 h-10 rounded-full bg-pms-green/20 flex items-center justify-center font-bold text-pms-darkGreen uppercase shadow-inner text-sm shrink-0">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-pms-gray truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-slate-500 uppercase truncate">{user?.role?.replace('ROLE_', '') || 'Employee'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors duration-200 text-sm font-semibold"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto h-screen">
        {/* Top bar for desktop */}
        <header className="hidden md:flex h-18 md:h-20 bg-white border-b border-slate-200 items-center justify-between px-6 lg:px-10 shrink-0">
          <div>
            <h1 className="text-slate-500 font-medium text-sm flex items-center space-x-1.5">
              <span>Employee Portal</span>
              <ChevronRight size={14} className="text-slate-300" />
              <span className="text-slate-800 font-semibold">{navigation.find(n => n.href === location.pathname)?.name || 'Portal'}</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col text-right">
              <span className="text-sm font-bold text-pms-gray">{user?.name || 'User'}</span>
              <span className="text-xs text-slate-400 capitalize font-medium">{user?.role?.replace('ROLE_', '').toLowerCase() || 'Employee'}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-pms-green text-white flex items-center justify-center font-bold text-sm shadow-sm border-2 border-white">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
            </div>
          </div>
        </header>

        {/* Content body */}
        <div className="flex-1 p-6 md:p-8 lg:p-10 w-full max-w-[1750px] mx-auto pb-14">
          {children}
        </div>
      </main>
    </div>
  );
};
export default DashboardLayout;
