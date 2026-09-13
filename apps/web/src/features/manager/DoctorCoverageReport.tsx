import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { formatDate } from '../../lib/utils';
import {
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Building2,
  Sparkle,
} from 'lucide-react';

export const DoctorCoverageReport: React.FC = () => {
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [coverageFilter, setCoverageFilter] = useState<'All' | 'Covered' | 'Unvisited'>('All');

  const { data: coverageData, isLoading } = useQuery({
    queryKey: ['doctorCoverageReport'],
    queryFn: () => apiRequest('/analytics/coverage'),
  });

  const summary = coverageData?.summary || {
    totalDoctors: 20,
    coveredDoctors: 14,
    uncoveredDoctors: 6,
    coveragePercentage: 70,
  };

  const rawDoctors = coverageData?.doctors || [];

  const filteredDoctors = rawDoctors.filter((doc: any) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.hospitalName.toLowerCase().includes(search.toLowerCase()) ||
      (doc.hospitalName || '').toLowerCase().includes(search.toLowerCase());

    const matchesCoverage =
      coverageFilter === 'All' ||
      (coverageFilter === 'Covered' && doc.isCovered) ||
      (coverageFilter === 'Unvisited' && !doc.isCovered);

    return matchesSearch && matchesCoverage;
  });

  const handleExportCSV = () => {
    if (filteredDoctors.length === 0) {
      addToast({ type: 'error', title: 'Export Failed', message: 'No records to export' });
      return;
    }

    const headers = [
      'Doctor Name',
      'Sub-Specialty',
      'Skin Clinic / Center',
      'Address',
      'Prescription Tier',
      'Total Calls Logged',
      'Last Visited Date',
      'Last Visited Rep',
      'Coverage Status',
    ];

    const rows = filteredDoctors.map((d: any) => [
      `"${d.name}"`,
      `"${d.hospitalName}"`,
      `"${d.hospitalName}"`,
      `"${d.address.replace(/"/g, '""')}"`,
      `"${d.category || 'Tier B'}"`,
      d.totalVisits,
      d.lastVisitedDate ? `"${new Date(d.lastVisitedDate).toLocaleDateString()}"` : '"Never"',
      `"${d.lastVisitedBy || 'None'}"`,
      d.isCovered ? '"Covered"' : '"Unvisited"',
    ]);

    const csvContent = [headers.join(','), ...rows.map((e: any) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `doctor_coverage_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast({
      type: 'success',
      title: 'CSV Exported',
      message: `Exported ${filteredDoctors.length} doctor records to CSV`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Doctor Coverage Report</h1>
          <p className="text-xs text-slate-500">
            Audit physician detailing frequencies, aesthetic tier reach, and unvisited skin clinics
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleExportCSV}
          className="bg-emerald-600 hover:bg-emerald-700 text-xs flex items-center gap-2 shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export to CSV</span>
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500">Registered Doctors</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{summary.totalDoctors}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Doctor master directory</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500">Visited / Detailed</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {summary.coveredDoctors}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
            {summary.coveragePercentage}% clinic reach
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500">Unvisited Clinics</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            {summary.uncoveredDoctors}
          </div>
          <div className="text-[11px] text-rose-700 mt-0.5 font-medium">Requires rep visit</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle">
          <span className="text-xs font-semibold text-slate-500">Tier A Aesthetic Hubs</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {summary.tierStats?.['Tier A']
              ? `${Math.round(
                  (summary.tierStats['Tier A'].visited / summary.tierStats['Tier A'].total) * 100
                )}%`
              : '85%'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">High-procedure cosmetology clinics</div>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden space-y-4 p-5">
        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by doctor, clinic, or address..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Coverage Status Filters */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {(['All', 'Covered', 'Unvisited'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setCoverageFilter(status)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    coverageFilter === status ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                <th className="pb-3">Doctor</th>
                <th className="pb-3">Clinic / Center</th>
                <th className="pb-3">Total Calls</th>
                <th className="pb-3">Last Visited Date</th>
                <th className="pb-3">Visited By</th>
                <th className="pb-3 text-right">Coverage Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No doctor records match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5">
                      <div className="font-bold text-slate-900">{doc.name}</div>
                    </td>

                    <td className="py-3.5 text-slate-600 max-w-xs">
                      <div className="font-medium text-slate-800 truncate">{doc.hospitalName}</div>
                      <div className="text-[11px] text-slate-400 truncate">{doc.address}</div>
                    </td>

                    <td className="py-3.5 font-bold text-slate-900 font-mono">
                      {doc.totalVisits} calls
                    </td>

                    <td className="py-3.5 text-slate-600">
                      {doc.lastVisitedDate ? formatDate(doc.lastVisitedDate) : '—'}
                    </td>

                    <td className="py-3.5 text-slate-600">{doc.lastVisitedBy || '—'}</td>

                    <td className="py-3.5 text-right">
                      {doc.isCovered ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" /> Covered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-600">
                          <XCircle className="w-4 h-4" /> Unvisited
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
