import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/authStore';
import {
  Calendar,
  ClipboardList,
  MapPin,
  Award,
  LogOut,
  Sparkle,
  ChevronRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { cn } from '../../lib/utils';

export const MrLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Poll for active visit
  const { data: activeVisitData } = useQuery({
    queryKey: ['activeVisit'],
    queryFn: () => apiRequest('/visits/active'),
    refetchInterval: 10000,
  });

  const activeVisit = activeVisitData?.activeVisit;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/mr/today', label: "Today's Plan", icon: Calendar },
    { to: '/mr/dcr', label: 'DCR', icon: ClipboardList, badge: activeVisit ? 'Active' : null },
    { to: '/mr/tour-plan', label: 'Tour Plan', icon: MapPin },
    { to: '/mr/performance', label: 'My Stats', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">

      {/* ── Top Navigation Header ── */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">

        {/* Brand row + logout */}
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-600/20">
              <Sparkle className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                {user?.name}
                <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-1.5 py-0.5 rounded-full">
                  Artemis MR
                </span>
              </div>
              <div className="text-[10px] text-slate-500">{user?.region || 'Artemis Formulations'}</div>
            </div>
          </div>

          {/* Nav links — centered */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20 font-semibold'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden sm:inline">{item.label}</span>
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500 animate-pulse border border-white" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Logout"
            className="shrink-0 text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Active Visit Alert Banner */}
        {activeVisit && (
          <div className="max-w-5xl mx-auto px-4 pb-2">
            <div
              onClick={() => navigate('/mr/dcr')}
              className="bg-blue-600 text-white rounded-xl p-2 px-3.5 flex items-center justify-between shadow-sm cursor-pointer hover:bg-blue-700 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-300"></span>
                </span>
                <div className="truncate text-xs">
                  <span className="font-semibold">Active Visit: </span>
                  <span className="underline decoration-blue-300 underline-offset-2">
                    {activeVisit.doctor?.name} ({activeVisit.doctor?.hospitalName})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold shrink-0 ml-2">
                Fill DCR <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6">
        <Outlet />
      </main>
    </div>
  );
};
