import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/utils';
import {
  ArrowLeft,
  Users,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Calendar,
  Receipt,
  Stethoscope,
} from 'lucide-react';

export const MrDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['mrDetail', id],
    queryFn: () => apiRequest(`/team/mr/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading representative dossier...</div>;
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-8">
        <div className="text-sm font-bold text-slate-800">Representative record not found</div>
        <Button variant="outline" size="sm" onClick={() => navigate('/manager/overview')} className="mt-3">
          Back to Overview
        </Button>
      </div>
    );
  }

  const { mr, metrics, visits, tourPlans, expenses } = data;

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/manager/overview')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Representative Dossier</h1>
          <p className="text-xs text-slate-500">Field telemetry, itinerary adherence, and claim audits</p>
        </div>
      </div>

      {/* Rep Identity Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {mr.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{mr.name}</h2>
              <Badge variant="emerald" size="sm">
                Active Field MR
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {mr.region}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {mr.phone || '—'}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {mr.email}
              </span>
            </div>
          </div>
        </div>

        {/* Aggregate stats */}
        <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-6">
          <div>
            <div className="text-xs text-slate-400">Completed Calls</div>
            <div className="text-xl font-bold text-slate-900">{metrics.totalVisitsCompleted}</div>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div>
            <div className="text-xs text-slate-400">Reimbursements</div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {formatCurrency(metrics.totalExpensesClaimed)}
            </div>
          </div>
        </div>
      </div>

      {/* History Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Calls Log */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-emerald-600" />
            Recent Field Call Log ({visits.length})
          </h3>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {visits.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No visits logged.</div>
            ) : (
              visits.map((v: any) => (
                <div key={v.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{v.doctor?.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {formatDateTime(v.checkInTime)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {v.doctor?.hospitalName}
                  </div>
                  {v.feedback && (
                    <div className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded-lg mt-1">
                      "{v.feedback}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expenses Log */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            Filed Expense Claims ({expenses.length})
          </h3>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {expenses.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No claims submitted.</div>
            ) : (
              expenses.map((exp: any) => (
                <div key={exp.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 font-mono">
                        {formatCurrency(exp.amount)}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {exp.category}
                      </span>
                    </div>
                    <Badge
                      variant={
                        exp.status === 'APPROVED'
                          ? 'emerald'
                          : exp.status === 'REJECTED'
                          ? 'rose'
                          : 'amber'
                      }
                      size="sm"
                    >
                      {exp.status}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-600">{exp.description}</div>
                  <div className="text-[10px] text-slate-400">{formatDate(exp.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
