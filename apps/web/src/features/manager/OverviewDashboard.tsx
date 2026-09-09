import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Users,
  Sparkle,
  Package,
  CheckSquare,
  TrendingUp,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

export const OverviewDashboard: React.FC = () => {
  const navigate = useNavigate();

  const { data: coverageData } = useQuery({
    queryKey: ['doctorCoverageOverview'],
    queryFn: () => apiRequest('/analytics/coverage'),
  });

  const { data: sampleData } = useQuery({
    queryKey: ['sampleDistributionOverview'],
    queryFn: () => apiRequest('/analytics/samples'),
  });

  const { data: performanceData } = useQuery({
    queryKey: ['teamPerformanceOverview'],
    queryFn: () => apiRequest('/analytics/team-performance'),
  });

  const { data: pendingTourPlans } = useQuery({
    queryKey: ['pendingTourPlansCount'],
    queryFn: () => apiRequest('/tour-plans?status=PENDING&limit=1'),
  });

  const { data: pendingExpenses } = useQuery({
    queryKey: ['pendingExpensesCount'],
    queryFn: () => apiRequest('/expenses?status=PENDING&limit=1'),
  });

  const coverage = coverageData?.summary || {
    totalDoctors: 20,
    coveredDoctors: 14,
    coveragePercentage: 70,
  };

  const totalSamples = sampleData?.totalSamples || 45;
  const sampleProducts = (sampleData?.byProduct || []).slice(0, 5);
  const pendingApprovals = (pendingTourPlans?.meta?.total || 0) + (pendingExpenses?.meta?.total || 0);

  const trendData = [
    { day: 'Mon', calls: 14, target: 15 },
    { day: 'Tue', calls: 18, target: 15 },
    { day: 'Wed', calls: 22, target: 15 },
    { day: 'Thu', calls: 19, target: 15 },
    { day: 'Fri', calls: 25, target: 15 },
    { day: 'Sat', calls: 8, target: 10 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dermatology Operations</h1>
          <p className="text-xs text-slate-500">
            Real-time telemetry on dermatologist calls, skin clinic reach, and formulation dispensing
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/manager/approvals')}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Review Approvals</span>
            {pendingApprovals > 0 && (
              <span className="w-5 h-5 rounded-full bg-slate-950 text-white text-[10px] flex items-center justify-center font-bold">
                {pendingApprovals}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Team Visits */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Derma Calls</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {performanceData?.teamActualCalls || 18}
            </span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">vs. last week across aesthetic clinics</div>
        </div>

        {/* Card 2: Doctor Coverage */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Dermatologist Coverage</span>
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <Sparkle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {coverage.coveragePercentage}%
            </span>
            <span className="text-xs text-slate-400">
              ({coverage.coveredDoctors} of {coverage.totalDoctors} skin specialists)
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all"
              style={{ width: `${coverage.coveragePercentage}%` }}
            />
          </div>
        </div>

        {/* Card 3: Samples Distributed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Derma Samples Given</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalSamples}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> formulation units
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">Sunscreen gels, retinoids, ceramides</div>
        </div>

        {/* Card 4: Pending Approvals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Approvals</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{pendingApprovals}</span>
            <span className="text-xs text-amber-600 font-semibold">Requires RSM review</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {pendingTourPlans?.meta?.total || 0} Tour Plans • {pendingExpenses?.meta?.total || 0} Expenses
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calls Trend Chart (2 Columns) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Weekly Clinic Detailing Volume</h3>
              <p className="text-xs text-slate-400">Daily completed doctor calls vs daily targets</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600 font-medium">Actual Calls</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                <span className="text-slate-600 font-medium">Daily Target</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="calls" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#callsGrad)" />
                <Area type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={1.5} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Detailed Dermatology Formulations */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top Detailed Derma Formulations</h3>
            <p className="text-xs text-slate-400">Sample units distributed to dermatologists</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sampleProducts} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 10 }} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="quantity" fill="#10b981" radius={[0, 8, 8, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Team Roster Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Dermatology Team Quotas</h3>
            <p className="text-xs text-slate-400">Field sales reps, weekly quotas, and tour plan submission status</p>
          </div>
          <button
            onClick={() => navigate('/manager/tracker')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            Open Live Map Tracker →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3">Representative</th>
                <th className="pb-3">Territory</th>
                <th className="pb-3">Calls Completed</th>
                <th className="pb-3">Weekly Target</th>
                <th className="pb-3">Expenses Filed</th>
                <th className="pb-3">Tour Plan</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(performanceData?.data || []).map((rep: any) => (
                <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 font-bold text-slate-900">{rep.name}</td>
                  <td className="py-3.5 text-slate-600">{rep.region}</td>
                  <td className="py-3.5">
                    <span className="font-bold text-slate-900">{rep.completedCalls}</span>
                    <span className="text-slate-400 ml-1">calls</span>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-1.5 rounded-full"
                          style={{ width: `${rep.achievementPercentage}%` }}
                        />
                      </div>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {rep.achievementPercentage}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 font-mono text-slate-700">
                    {formatCurrency(rep.totalExpenses)}
                  </td>
                  <td className="py-3.5">
                    <Badge
                      variant={
                        rep.tourPlanStatus === 'APPROVED'
                          ? 'emerald'
                          : rep.tourPlanStatus === 'PENDING'
                          ? 'amber'
                          : 'slate'
                      }
                      size="sm"
                    >
                      {rep.tourPlanStatus}
                    </Badge>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => navigate(`/manager/team/${rep.id}`)}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
                    >
                      View Profile →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
