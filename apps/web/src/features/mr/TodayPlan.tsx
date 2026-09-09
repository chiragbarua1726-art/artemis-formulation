import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CheckInModal, Doctor } from './CheckInModal';
import { useToast } from '../../components/ui/Toast';
import {
  Search,
  MapPin,
  Building2,
  Sparkle,
  CalendarCheck,
  TrendingUp,
  Clock,
  CheckCircle2,
  ClipboardList,
} from 'lucide-react';

export const TodayPlan: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedDoctorForCheckin, setSelectedDoctorForCheckin] = useState<Doctor | null>(null);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ name: '', hospitalName: '', headquarters: '', specialty: 'Dermatology', address: '' });
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);

  // Fetch MR Dashboard metrics
  const { data: dashboardData, refetch: refetchDashboard } = useQuery({
    queryKey: ['mrDashboard'],
    queryFn: () => apiRequest('/analytics/me'),
  });

  // Fetch Doctors directory for territory
  const { data: doctorsData, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ['doctors', search, selectedSpecialty],
    queryFn: () => {
      let url = `/doctors?search=${encodeURIComponent(search)}`;
      if (selectedSpecialty !== 'All') {
        url += `&specialty=${encodeURIComponent(selectedSpecialty)}`;
      }
      return apiRequest(url);
    },
  });

  // Fetch Today's Visits for this MR
  const { data: myVisitsData, refetch: refetchVisits } = useQuery({
    queryKey: ['myVisitsToday'],
    queryFn: () => apiRequest('/visits/me?limit=50'),
  });

  const doctors: Doctor[] = doctorsData?.data || [];
  const completedVisits = myVisitsData?.data || [];
  const visitedDoctorIds = new Set(
    completedVisits.filter((v: any) => v.checkOutTime !== null).map((v: any) => v.doctorId)
  );

  const specialties = [
    'All',
    'Aesthetic Dermatology & Cosmetology',
    'Clinical Dermatology & Acne Specialist',
    'Laser & Pigmentation Specialist',
    'Trichology & Hair Restoration',
    'Psoriasis & Atopic Eczema Care',
    'Pediatric Dermatology',
    'Dermatosurgery & Mohs Surgery',
  ];

  const kpis = dashboardData?.kpis || {
    visitsThisWeek: 3,
    weeklyTarget: 25,
    targetAchievedPercent: 12,
    pendingTourPlans: 1,
    pendingExpenses: 1,
  };

  const handleRefresh = () => {
    refetchDashboard();
    refetchVisits();
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingDoctor(true);
    try {
      await apiRequest('/doctors', { method: 'POST', body: JSON.stringify(newDoctor) });
      addToast({ type: 'success', title: 'Doctor added', message: `${newDoctor.name} is ready for a visit.` });
      setNewDoctor({ name: '', hospitalName: '', headquarters: '', specialty: 'Dermatology', address: '' });
      setShowAddDoctor(false);
      refetchVisits();
      // The query key includes the search/filter, so invalidate all doctor lists.
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Could not add doctor', message: err.message || 'Please check the details.' });
    } finally {
      setIsAddingDoctor(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Today's Derma Detailing Plan</h1>
          <p className="text-xs text-slate-500">
            {user?.region} • Artemis Formulations Scheduled Clinics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="blue" size="md">
            Target: 6 Derma Calls Today
          </Badge>
        </div>
      </div>

      {/* KPI Cards (Blue accents) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Weekly Calls</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">{kpis.visitsThisWeek}</span>
            <span className="text-xs text-slate-400">/ {kpis.weeklyTarget} goal</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${kpis.targetAchievedPercent}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Done Today</span>
            <span className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
              <CalendarCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900">
              {completedVisits.filter((v: any) => {
                const todayStr = new Date().toDateString();
                return new Date(v.checkInTime).toDateString() === todayStr;
              }).length}
            </span>
            <span className="text-xs text-slate-400">completed</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-700 font-medium">On track for daily quota</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Actions</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {kpis.pendingTourPlans + kpis.pendingExpenses}
            </span>
            <span className="text-xs text-slate-400">under review</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 truncate">
            {kpis.pendingExpenses} Expense • {kpis.pendingTourPlans} Tour Plan
          </div>
        </div>
      </div>

      {/* Doctor Directory & Call Launcher */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Doctors & Clinics</span>
            <span className="text-xs font-normal text-slate-400">({doctors.length} in area)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Choose a doctor or add the doctor you visited today.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowAddDoctor(!showAddDoctor)}>
            + Add doctor
          </Button>
        </div>

        {showAddDoctor && (
          <form onSubmit={handleAddDoctor} className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-900">Add doctor visited today</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                ['name', 'Doctor name', 'Dr. Anil Sharma'],
                ['hospitalName', 'Clinic / hospital', 'Skin Care Clinic'],
                ['headquarters', 'Headquarters / territory', 'North Delhi'],
                ['specialty', 'Specialty', 'Dermatology'],
                ['address', 'Clinic address', 'Sector, street, city'],
              ].map(([key, label, placeholder]) => (
                <input key={key} required value={newDoctor[key as keyof typeof newDoctor]}
                  onChange={(e) => setNewDoctor({ ...newDoctor, [key]: e.target.value })}
                  placeholder={placeholder} aria-label={label}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddDoctor(false)}>Cancel</Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isAddingDoctor}>Save doctor</Button>
            </div>
          </form>
        )}

        {/* Search & Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dermatologists, skin clinic, or sub-specialty..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all"
            />
          </div>

          {/* Specialty Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {specialties.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialty(spec)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedSpecialty === spec
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Cards List */}
        {isLoadingDoctors ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading dermatologist directory...
          </div>
        ) : doctors.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-6">
            <Sparkle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-700">No dermatologists match your filter</div>
            <p className="text-xs text-slate-400 mt-1">Try searching for a different clinic or sub-specialty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {doctors.map((doc) => {
              const isVisited = visitedDoctorIds.has(doc.id);

              return (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-subtle hover:border-blue-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0 border border-blue-200/60">
                        <Sparkle className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 truncate">{doc.name}</h3>
                          <Badge
                            variant={
                              doc.category === 'Tier A'
                                ? 'blue'
                                : doc.category === 'Tier B'
                                ? 'slate'
                                : 'slate'
                            }
                            size="sm"
                          >
                            {doc.category || 'Tier B'}
                          </Badge>
                        </div>
                        <p className="text-xs font-semibold text-blue-800 mt-0.5">
                          {doc.specialty}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{doc.hospitalName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{doc.address}</span>
                        </div>
                        <div className="text-[11px] text-blue-700 font-semibold mt-1">
                          HQ: {doc.headquarters || 'Territory not set'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      {isVisited ? (
                        <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
                          <CheckCircle2 className="w-4 h-4" /> Visited Recently
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Due for detailing</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedDoctorForCheckin(doc)}
                        className="bg-blue-600 hover:bg-blue-700 text-xs px-3"
                      >
                        <ClipboardList className="w-3.5 h-3.5 mr-1" />
                        Log Visit
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Check In Confirmation Modal */}
      <CheckInModal
        isOpen={!!selectedDoctorForCheckin}
        onClose={() => setSelectedDoctorForCheckin(null)}
        doctor={selectedDoctorForCheckin}
        onCheckInSuccess={handleRefresh}
      />
    </div>
  );
};
