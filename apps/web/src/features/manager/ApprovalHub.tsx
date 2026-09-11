import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/utils';
import {
  CheckSquare,
  Receipt,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Building2,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const ApprovalHub: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'tourPlans' | 'expenses' | 'records' | 'history'>('tourPlans');

  // Inspection Modals state
  const [selectedPlanForReview, setSelectedPlanForReview] = useState<any | null>(null);
  const [selectedExpenseForReview, setSelectedExpenseForReview] = useState<any | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: tourPlansData, refetch: refetchPlans } = useQuery({
    queryKey: ['tourPlansApproval'],
    queryFn: () => apiRequest('/tour-plans?limit=50'),
  });

  const { data: expensesData, refetch: refetchExpenses } = useQuery({
    queryKey: ['expensesApproval'],
    queryFn: () => apiRequest('/expenses?limit=50'),
  });

  const { data: doctorsData, refetch: refetchDoctors } = useQuery({
    queryKey: ['doctorApprovals'],
    queryFn: () => apiRequest('/doctors?status=PENDING&limit=100'),
  });
  const { data: chemistsData, refetch: refetchChemists } = useQuery({
    queryKey: ['chemistApprovals'],
    queryFn: () => apiRequest('/chemists?status=PENDING'),
  });
  const { data: ordersData, refetch: refetchOrders } = useQuery({
    queryKey: ['orderApprovals'],
    queryFn: () => apiRequest('/orders?status=PENDING'),
  });

  const allPlans = tourPlansData?.data || [];
  const pendingPlans = allPlans.filter((p: any) => p.status === 'PENDING');
  const pastPlans = allPlans.filter((p: any) => p.status !== 'PENDING');

  const allExpenses = expensesData?.data || [];
  const pendingExpenses = allExpenses.filter((e: any) => e.status === 'PENDING');
  const pastExpenses = allExpenses.filter((e: any) => e.status !== 'PENDING');
  const pendingRecords = [
    ...(doctorsData?.data || []).map((item: any) => ({ ...item, recordType: 'doctors', label: item.name })),
    ...(chemistsData?.data || []).filter((item: any) => item.status === 'PENDING').map((item: any) => ({ ...item, recordType: 'chemists', label: item.name })),
    ...(ordersData?.data || []).filter((item: any) => item.status === 'PENDING').map((item: any) => ({ ...item, recordType: 'orders', label: `${item.customerName} — ${item.productName}` })),
  ];

  const reviewRecord = async (record: any, action: 'approve' | 'reject') => {
    const endpoint = record.recordType === 'doctors' ? 'doctors' : record.recordType === 'chemists' ? 'chemists' : 'orders';
    try {
      await apiRequest(`/${endpoint}/${record.id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify({ reviewNote: action === 'approve' ? 'Approved for field work.' : 'Please correct and resubmit.' }),
      });
      addToast({ type: 'success', title: `Record ${action}d`, message: record.label });
      await Promise.all([refetchDoctors(), refetchChemists(), refetchOrders()]);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Review failed', message: err.message || 'Unable to update record.' });
    }
  };

  const openReviewModal = (item: any, type: 'plan' | 'expense', action: 'approve' | 'reject') => {
    setReviewAction(action);
    setReviewNote(
      action === 'approve'
        ? type === 'plan'
          ? 'Tour schedule approved for territory coverage.'
          : 'Approved in accordance with travel allowance policy.'
        : ''
    );

    if (type === 'plan') {
      setSelectedPlanForReview(item);
      setSelectedExpenseForReview(null);
    } else {
      setSelectedExpenseForReview(item);
      setSelectedPlanForReview(null);
    }
  };

  const handleConfirmReview = async () => {
    if (!reviewNote.trim()) {
      addToast({ type: 'error', title: 'Review Note Required', message: 'Please provide a feedback note.' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedPlanForReview) {
        const endpoint = `/tour-plans/${selectedPlanForReview.id}/${reviewAction}`;
        await apiRequest(endpoint, {
          method: 'PATCH',
          body: JSON.stringify({ reviewNote }),
        });

        addToast({
          type: 'success',
          title: `Tour Plan ${reviewAction === 'approve' ? 'Approved' : 'Rejected'}`,
          message: `Rep ${selectedPlanForReview.mr?.name} has been notified.`,
        });

        setSelectedPlanForReview(null);
        queryClient.invalidateQueries({ queryKey: ['tourPlansApproval'] });
        refetchPlans();
      } else if (selectedExpenseForReview) {
        const endpoint = `/expenses/${selectedExpenseForReview.id}/${reviewAction}`;
        await apiRequest(endpoint, {
          method: 'PATCH',
          body: JSON.stringify({ reviewNote }),
        });

        addToast({
          type: 'success',
          title: `Expense Claim ${reviewAction === 'approve' ? 'Approved' : 'Rejected'}`,
          message: `Claim of ${formatCurrency(selectedExpenseForReview.amount)} processed.`,
        });

        setSelectedExpenseForReview(null);
        queryClient.invalidateQueries({ queryKey: ['expensesApproval'] });
        refetchExpenses();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Unable to update status',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Manager Approval Hub</h1>
          <p className="text-xs text-slate-500">
            Review and sign off on weekly territory tour plans and field reimbursement claims
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-200/70 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('tourPlans')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'tourPlans' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Tour Plans</span>
            {pendingPlans.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                {pendingPlans.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'records' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Field Records</span>
            {pendingRecords.length > 0 && <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">{pendingRecords.length}</span>}
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'expenses' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Expense Claims</span>
            {pendingExpenses.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                {pendingExpenses.length}
              </span>
            )}

          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Audit History</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PENDING TOUR PLANS */}
      {activeTab === 'tourPlans' && (
        <div className="space-y-4">
          {pendingPlans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-900">All Tour Plans Reviewed</div>
              <p className="text-xs text-slate-400 mt-1">No pending weekly plans requiring RSM approval.</p>
            </div>
          ) : (
            pendingPlans.map((plan: any) => (
              <div
                key={plan.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{plan.mr?.name}</h3>
                      <Badge variant="amber" size="sm">
                        Pending RSM Review
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Territory: {plan.mr?.region} • Week: {formatDate(plan.weekStart)} –{' '}
                      {formatDate(plan.weekEnd)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReviewModal(plan, 'plan', 'reject')}
                      className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openReviewModal(plan, 'plan', 'approve')}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Approve Plan
                    </Button>
                  </div>
                </div>

                {/* Itinerary Schedule Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {Array.isArray(plan.planDetails) &&
                    plan.planDetails.map((dayItem: any) => (
                      <div
                        key={dayItem.date}
                        className="bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 text-xs"
                      >
                        <div className="font-bold text-slate-800">{dayItem.date}</div>
                        <div className="text-[11px] text-slate-600 truncate mt-0.5">
                          {dayItem.area || 'Field Route'}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                          {dayItem.doctorIds?.length || 0} Doctors
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: PENDING EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {pendingExpenses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-900">All Expenses Processed</div>
              <p className="text-xs text-slate-400 mt-1">No pending reimbursement claims found.</p>
            </div>
          ) : (
            pendingExpenses.map((exp: any) => (
              <div
                key={exp.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {exp.receiptUrl ? (
                      <a href={exp.receiptUrl} target="_blank" rel="noreferrer" className="shrink-0">
                        <img
                          src={exp.receiptUrl}
                          alt="Bill"
                          className="w-14 h-14 object-cover rounded-xl border border-slate-200 hover:opacity-80"
                        />
                      </a>
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        <Receipt className="w-6 h-6" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900 font-mono">
                          {formatCurrency(exp.amount)}
                        </span>
                        <span className="text-xs font-semibold capitalize bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          {exp.category}
                        </span>
                        <Badge variant="amber" size="sm">
                          Pending
                        </Badge>
                      </div>
                      <div className="text-xs font-bold text-slate-800 mt-0.5">
                        Rep: {exp.mr?.name} <span className="text-slate-400 font-normal">({exp.mr?.region})</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{exp.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReviewModal(exp, 'expense', 'reject')}
                      className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openReviewModal(exp, 'expense', 'approve')}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Approve Claim
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'records' && (
        <div className="space-y-3">
          {pendingRecords.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
              <div className="text-sm font-bold text-slate-900">All field records reviewed</div>
            </div>
          ) : pendingRecords.map((record: any) => (
            <div key={`${record.recordType}-${record.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div><div className="text-sm font-bold text-slate-900">{record.label}</div><div className="text-xs text-slate-500">{record.address || record.notes || `Quantity: ${record.quantity}`}</div></div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => reviewRecord(record, 'reject')} className="text-rose-600">Reject</Button>
                <Button variant="primary" size="sm" onClick={() => reviewRecord(record, 'approve')} className="bg-emerald-600 hover:bg-emerald-700">Approve</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: AUDIT HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Signed-Off Approval History</h3>

            <div className="divide-y divide-slate-100 text-xs">
              {[...pastPlans, ...pastExpenses].map((item: any) => {
                const isPlan = !!item.weekStart;
                const statusVariant =
                  item.status === 'APPROVED' ? 'emerald' : item.status === 'REJECTED' ? 'rose' : 'slate';

                return (
                  <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {isPlan
                            ? `Tour Plan: ${item.mr?.name || 'Rep'}`
                            : `Expense: ${formatCurrency(item.amount)} (${item.category})`}
                        </span>
                        <Badge variant={statusVariant} size="sm">
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-slate-500 mt-0.5">
                        {isPlan
                          ? `Schedule for ${formatDate(item.weekStart)} – ${formatDate(item.weekEnd)}`
                          : item.description}
                      </p>
                      {item.reviewNote && (
                        <p className="text-slate-700 mt-1 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                          Reviewer note ({item.reviewedBy}): "{item.reviewNote}"
                        </p>
                      )}
                    </div>
                    <div className="text-right text-[11px] text-slate-400 shrink-0">
                      {formatDate(item.reviewedAt || item.updatedAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Review Action Confirmation Modal */}
      <Modal
        isOpen={!!selectedPlanForReview || !!selectedExpenseForReview}
        onClose={() => {
          setSelectedPlanForReview(null);
          setSelectedExpenseForReview(null);
        }}
        title={`${reviewAction === 'approve' ? 'Approve' : 'Reject'} ${
          selectedPlanForReview ? 'Tour Plan' : 'Expense Claim'
        }`}
        description="Provide required feedback and audit comments for the representative."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Reviewer Audit Note / Rationale
            </label>
            <textarea
              rows={3}
              required
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Enter reason for approval or specific corrections required..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setSelectedPlanForReview(null);
                setSelectedExpenseForReview(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'primary' : 'danger'}
              size="md"
              onClick={handleConfirmReview}
              isLoading={isSubmitting}
            >
              Confirm {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
