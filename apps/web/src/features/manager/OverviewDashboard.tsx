import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import { ArrowRight, CheckSquare, Database, Map, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OverviewDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: teamData } = useQuery({
    queryKey: ['teamPerformanceOverview'],
    queryFn: () => apiRequest('/analytics/team-performance'),
  });
  const { data: pendingPlans } = useQuery({
    queryKey: ['pendingTourPlansCount'],
    queryFn: () => apiRequest('/tour-plans?status=PENDING&limit=1'),
  });
  const reps = teamData?.data || [];

  const actions = [
    { title: 'Manage MR team', text: 'Review representatives, regions, and account assignments.', icon: Users, to: '/manager/master-data', adminOnly: true },
    { title: 'Review approvals', text: 'Approve or reject submitted tour plans from your team.', icon: CheckSquare, to: '/manager/approvals', badge: pendingPlans?.meta?.total || 0 },
    { title: 'Open live tracker', text: 'See active field visits and current rep locations.', icon: Map, to: '/manager/tracker' },
    { title: 'Manage doctor data', text: 'Add and maintain the doctor and product directory.', icon: Database, to: '/manager/master-data', adminOnly: true },
  ];

  return <div className="space-y-8">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Admin workspace</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Welcome, {user?.name}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Manage your medical representative team, field activity, doctor records, and approvals from one focused workspace.</p>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {actions.filter((action) => !action.adminOnly || user?.role === 'ADMIN').map((action) => {
        const Icon = action.icon;
        return <button key={action.title} onClick={() => navigate(action.to)} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/40">
          <div className="flex items-start justify-between"><span className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><Icon className="h-5 w-5" /></span>{action.badge ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">{action.badge} pending</span> : null}</div>
          <h2 className="mt-5 text-sm font-bold text-slate-900">{action.title}</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">{action.text}</p>
          <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-blue-600">Open <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
        </button>;
      })}
    </div>

    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-sm font-bold text-slate-900">Team at a glance</h2><p className="mt-1 text-xs text-slate-500">Representatives currently connected to your workspace.</p></div>
        <button onClick={() => navigate('/manager/master-data')} className="text-xs font-bold text-blue-600 hover:text-blue-700">View team <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></button>
      </div>
      <div className="mt-5 flex items-end gap-3"><span className="text-4xl font-extrabold text-slate-900">{reps.length}</span><span className="pb-1 text-xs text-slate-500">representatives in reporting</span></div>
    </section>
  </div>;
};
