import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/authStore';
import { LayoutDashboard, CheckSquare, Map, FileSpreadsheet, Database, LogOut, Sparkle } from 'lucide-react';
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
  const pendingApprovalsCount = tourPlansData?.meta?.total || 0;

  const navItems = [
    { to: '/manager/overview', label: 'Overview', icon: LayoutDashboard },
    { to: '/manager/approvals', label: 'Approvals', icon: CheckSquare, badge: pendingApprovalsCount || null },
    { to: '/manager/tracker', label: 'Live tracker', icon: Map },
    { to: '/manager/coverage', label: 'Doctor coverage', icon: FileSpreadsheet },
    ...(user?.role === 'ADMIN' ? [{ to: '/manager/master-data', label: 'Manage data', icon: Database }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="relative mx-auto flex max-w-[1500px] flex-wrap items-center gap-4 px-4 py-3 lg:px-7">
          <button onClick={() => navigate('/manager/overview')} className="order-1 mr-2 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/25"><Sparkle className="h-5 w-5" /></span>
            <span className="hidden text-left sm:block"><span className="block text-sm font-extrabold tracking-tight text-slate-900">ARTEMIS</span><span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-blue-600">Admin workspace</span></span>
          </button>
          <nav className="order-3 flex w-full items-center justify-center gap-1 overflow-x-auto pb-0.5 lg:absolute lg:left-1/2 lg:top-1/2 lg:order-2 lg:w-auto lg:-translate-x-1/2 lg:-translate-y-1/2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return <NavLink key={item.to} to={item.to} className={({ isActive }) => cn('relative flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition', isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')}>
                <Icon className="h-4 w-4" />{item.label}
                {item.badge && <span className={cn('ml-1 rounded-full px-1.5 py-0.5 text-[10px]', 'bg-amber-400 text-slate-950')}>{item.badge}</span>}
              </NavLink>;
            })}
          </nav>
          <div className="order-2 ml-auto flex shrink-0 items-center gap-2.5 lg:order-3">
            <div className="text-right">
              <div className="max-w-[140px] truncate text-xs font-bold text-slate-800">{user?.name}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {user?.role === 'ADMIN' ? 'Administrator' : 'Manager'}
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              title="Log out"
              className="rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8"><Outlet /></main>
    </div>
  );
};
