import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/authStore';
import {
  LayoutDashboard,
  CheckSquare,
  Map,
  FileSpreadsheet,
  Database,
  LogOut,
  Sparkle,
  ChevronRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { cn } from '../../lib/utils';

export const ManagerLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: tourPlansData } = useQuery({
    queryKey: ['pendingTourPlansCount'],
    queryFn: () => apiRequest('/tour-plans?status=PENDING&limit=1'),
  });

  const { data: expensesData } = useQuery({
    queryKey: ['pendingExpensesCount'],
    queryFn: () => apiRequest('/expenses?status=PENDING&limit=1'),
  });

  const pendingApprovalsCount =
    (tourPlansData?.meta?.total || 0) + (expensesData?.meta?.total || 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/manager/overview', label: 'Derma Overview', icon: LayoutDashboard },
    {
      to: '/manager/approvals',
      label: 'Approval Hub',
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
    },
    { to: '/manager/tracker', label: 'Live GPS Tracker', icon: Map },
    { to: '/manager/coverage', label: 'Dermatologist Coverage', icon: FileSpreadsheet },
    { to: '/manager/master-data', label: 'Master Derma Data', icon: Database, adminOnly: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Sleek Deep Navy Sidebar */}
      <aside className="w-64 bg-[#090f1d] text-slate-300 flex flex-col shrink-0 border-r border-[#15223a] hidden md:flex">
        {/* Brand Header */}
        <div className="p-6 border-b border-[#15223a] flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold shadow-sm shadow-blue-600/30">
            <Sparkle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-wide">ARTEMIS FORMULATION</div>
            <div className="text-[10px] text-blue-400 uppercase tracking-widest font-mono">
              Dermatology Intelligence
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Sales Force Management
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group',
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-[#121c32]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          'w-4 h-4 transition-colors',
                          isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== null && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-950">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-[#15223a] bg-[#060a14]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-700/50 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  {user?.role === 'ADMIN' ? 'Head of Derma' : 'RSM Derma'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Log Out"
              className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-[#121c32] transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop Top Bar */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Territory:</span>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
              {user?.region || 'All Derma Territories'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline">
              {new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }).format(new Date())}
            </span>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <button
              onClick={() => navigate('/mr/today')}
              className="text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>Field Rep View</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
