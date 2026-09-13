import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Award, Target, TrendingUp, CheckCircle2, Stethoscope, Package, Clock } from 'lucide-react';

export const PerformanceView: React.FC = () => {
  const { user } = useAuthStore();
  const [historyFilter, setHistoryFilter] = useState<'week' | 'month' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: dashboardData } = useQuery({
    queryKey: ['mrDashboard'],
    queryFn: () => apiRequest('/analytics/me'),
  });

  const { data: myVisitsData } = useQuery({
    queryKey: ['myVisitsHistory', historyFilter, selectedDay],
    queryFn: () => {
      const now = new Date();
      let from: Date;
      let to: Date;

      if (historyFilter === 'day') {
        from = new Date(`${selectedDay}T00:00:00`);
        to = new Date(`${selectedDay}T23:59:59.999`);
      } else if (historyFilter === 'month') {
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      } else {
        const day = now.getDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;
        from = new Date(now);
        from.setDate(now.getDate() + mondayOffset);
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setDate(from.getDate() + 6);
        to.setHours(23, 59, 59, 999);
      }

      return apiRequest(`/visits/me?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}&limit=100`);
    },
  });

  const kpis = dashboardData?.kpis || {
    visitsThisWeek: 3,
    weeklyTarget: 25,
    targetAchievedPercent: 12,
  };

  const visits = myVisitsData?.data || [];
  const completedCalls = visits.filter((v: any) => v.checkOutTime !== null);

  // Total samples given
  let totalSamplesGiven = 0;
  completedCalls.forEach((v: any) => {
    if (Array.isArray(v.samplesGiven)) {
      v.samplesGiven.forEach((s: any) => {
        totalSamplesGiven += Number(s.quantity) || 0;
      });
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Performance & KPIs</h1>
        <p className="text-xs text-slate-500">Track field call quota, target achievement, and sample delivery</p>
      </div>

      {/* Target Achievement Card */}
      <div className="bg-emerald-950 text-white rounded-3xl p-6 shadow-elevated border border-emerald-900 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Weekly Target Quota
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{kpis.visitsThisWeek}</span>
              <span className="text-lg text-emerald-300/80 font-medium">/ {kpis.weeklyTarget} calls</span>
            </div>
            <p className="text-xs text-emerald-200/70 mt-1">
              You have completed {kpis.targetAchievedPercent}% of your weekly target.
            </p>
          </div>

          <div className="bg-emerald-900/60 border border-emerald-800 rounded-2xl p-4 text-center shrink-0">
            <div className="text-2xl font-black text-emerald-400">{kpis.targetAchievedPercent}%</div>
            <div className="text-[10px] uppercase font-semibold text-emerald-300 tracking-wider mt-0.5">
              Quota Met
            </div>
          </div>
        </div>

        <div className="mt-5 w-full bg-emerald-900/80 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, kpis.targetAchievedPercent)}%` }}
          />
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Completed Calls</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{completedCalls.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Logged calls with DCR</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Samples Provided</span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{totalSamplesGiven}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Formulation sample units</div>
        </div>
      </div>

      {/* Field Activity Log */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-bold text-slate-900">Visit History</h3>
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1">
            {([
              ['week', 'This week'],
              ['month', 'This month'],
              ['day', 'Particular day'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setHistoryFilter(value)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
                  historyFilter === value ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
            {historyFilter === 'day' && (
              <input
                type="date"
                value={selectedDay}
                onChange={(event) => setSelectedDay(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700"
              />
            )}
          </div>
        </div>
        {completedCalls.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No visits found for this period.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {completedCalls.map((v: any) => (
              <div key={v.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">{v.doctor?.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {v.doctor?.hospitalName}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="emerald" size="sm">
                    Verified
                  </Badge>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {new Date(v.checkInTime).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
