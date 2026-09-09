import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../lib/utils';
import {
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

export const TourPlanBuilder: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Doctors for selection
  const { data: doctorsData } = useQuery({
    queryKey: ['doctorsTourPlan'],
    queryFn: () => apiRequest('/doctors?limit=50'),
  });

  // Tour plans history
  const { data: myPlansData, refetch: refetchPlans } = useQuery({
    queryKey: ['myTourPlans'],
    queryFn: () => apiRequest('/tour-plans/me'),
  });

  const doctors = doctorsData?.data || [];
  const plans = myPlansData?.data || [];

  // Default next week Monday to Saturday
  const nextMonday = new Date();
  nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
  nextMonday.setHours(0, 0, 0, 0);

  const nextSunday = new Date(nextMonday);
  nextSunday.setDate(nextSunday.getDate() + 6);
  nextSunday.setHours(23, 59, 59, 999);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const [schedule, setSchedule] = useState(
    daysOfWeek.map((day) => ({
      date: day,
      area:
        day === 'Monday'
          ? 'GK-1 & South Extension Skin Clinics'
          : day === 'Tuesday'
          ? 'Saket & Malviya Nagar Derma Centers'
          : day === 'Wednesday'
          ? 'Okhla & Sukhdev Vihar Laser Units'
          : day === 'Thursday'
          ? 'Hauz Khas Enclave Trichology Hub'
          : day === 'Friday'
          ? 'Gurgaon Galleria & Sector 51 Aesthetics'
          : 'Cosmetic Pharmacies & Derma Stockists',
      doctorIds: [] as string[],
      targetCalls: 5,
      notes: '',
    }))
  );

  const handleToggleDoctorInDay = (dayIndex: number, doctorId: string) => {
    setSchedule((prev) => {
      const copy = [...prev];
      const dayItem = { ...copy[dayIndex] };
      if (dayItem.doctorIds.includes(doctorId)) {
        dayItem.doctorIds = dayItem.doctorIds.filter((id) => id !== doctorId);
      } else {
        dayItem.doctorIds = [...dayItem.doctorIds, doctorId];
      }
      copy[dayIndex] = dayItem;
      return copy;
    });
  };

  const handleUpdateArea = (dayIndex: number, area: string) => {
    setSchedule((prev) => {
      const copy = [...prev];
      copy[dayIndex] = { ...copy[dayIndex], area };
      return copy;
    });
  };

  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest('/tour-plans', {
        method: 'POST',
        body: JSON.stringify({
          weekStart: nextMonday.toISOString(),
          weekEnd: nextSunday.toISOString(),
          planDetails: schedule,
        }),
      });

      addToast({
        type: 'success',
        title: 'Dermatology Tour Plan Submitted',
        message: 'Your weekly skin clinic schedule has been sent for manager approval',
      });

      queryClient.invalidateQueries({ queryKey: ['myTourPlans'] });
      setActiveTab('history');
      refetchPlans();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Unable to submit tour plan',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dermatology Tour Plan Builder</h1>
          <p className="text-xs text-slate-500">Plan and schedule weekly dermatologist itineraries for manager approval</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'create' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Create New Plan
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            Past Submissions
            {plans.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-slate-100 text-[10px] flex items-center justify-center font-bold">
                {plans.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <form onSubmit={handleSubmitPlan} className="space-y-5">
          {/* Week Info Banner */}
          <div className="bg-emerald-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center text-emerald-200">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
                  Upcoming Derma Plan Week
                </div>
                <div className="text-sm font-bold text-white">
                  {formatDate(nextMonday)} – {formatDate(nextSunday)}
                </div>
              </div>
            </div>
            <Badge variant="emerald" size="md" className="bg-emerald-800 text-emerald-100 border-emerald-700">
              6 Days Scheduled
            </Badge>
          </div>

          {/* Daily Schedule Cards */}
          <div className="space-y-3">
            {schedule.map((dayItem, index) => (
              <div
                key={dayItem.date}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-subtle space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center">
                      {dayItem.date.substring(0, 3)}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{dayItem.date}</div>
                      <div className="text-[10px] text-slate-400">Quota: {dayItem.targetCalls} calls</div>
                    </div>
                  </div>

                  <div className="w-full sm:w-72">
                    <input
                      type="text"
                      value={dayItem.area}
                      onChange={(e) => handleUpdateArea(index, e.target.value)}
                      placeholder="Target skin clinic cluster..."
                      className="w-full text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Doctor Selection for this Day */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                    <span>Select Priority Dermatologists to Visit:</span>
                    <span className="text-emerald-700 font-bold">
                      {dayItem.doctorIds.length} doctors selected
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
                    {doctors.slice(0, 10).map((doc: any) => {
                      const isSelected = dayItem.doctorIds.includes(doc.id);
                      return (
                        <button
                          type="button"
                          key={doc.id}
                          onClick={() => handleToggleDoctorInDay(index, doc.id)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all select-none text-left ${
                            isSelected
                              ? 'bg-emerald-600 text-white font-semibold border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {doc.name} <span className="text-[10px] opacity-75">({doc.specialty})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-2xl text-sm font-bold shadow-md"
          >
            Submit Weekly Dermatology Tour Plan for Approval
          </Button>
        </form>
      ) : (
        /* PAST SUBMISSIONS TAB */
        <div className="space-y-4">
          {plans.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-6">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">No Tour Plans submitted yet</div>
              <p className="text-xs text-slate-400 mt-1">Use the Create tab above to schedule next week</p>
            </div>
          ) : (
            plans.map((plan: any) => {
              const statusVariant =
                plan.status === 'APPROVED' ? 'emerald' : plan.status === 'REJECTED' ? 'rose' : 'amber';

              return (
                <div
                  key={plan.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {formatDate(plan.weekStart)} – {formatDate(plan.weekEnd)}
                        </h3>
                        <Badge variant={statusVariant} size="sm">
                          {plan.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Submitted on {formatDate(plan.createdAt)}
                      </p>
                    </div>
                  </div>

                  {plan.reviewNote && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                      <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <span>Reviewed by {plan.reviewedBy}</span>
                        <span className="text-[10px] text-slate-400">
                          ({formatDate(plan.reviewedAt)})
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1 italic">"{plan.reviewNote}"</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                    {Array.isArray(plan.planDetails) &&
                      plan.planDetails.slice(0, 6).map((d: any) => (
                        <div key={d.date} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                          <div className="font-bold text-slate-800">{d.date}</div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">{d.area}</div>
                          <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                            {d.doctorIds?.length || 0} Doctors planned
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
