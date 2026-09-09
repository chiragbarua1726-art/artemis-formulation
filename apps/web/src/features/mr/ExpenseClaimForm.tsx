import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Receipt,
  Car,
  Utensils,
  Hotel,
  Package,
  Camera,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';

export const ExpenseClaimForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [category, setCategory] = useState<'travel' | 'food' | 'lodging' | 'misc'>('travel');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch my expenses
  const { data: expensesData, refetch: refetchExpenses } = useQuery({
    queryKey: ['myExpenses'],
    queryFn: () => apiRequest('/expenses/me'),
  });

  const expenses = expensesData?.data || [];

  const categories = [
    { id: 'travel', label: 'Travel & Fuel', icon: Car, hint: 'Fuel, cab, toll, train allowance' },
    { id: 'food', label: 'Daily Meals', icon: Utensils, hint: 'Lunch & field refreshments' },
    { id: 'lodging', label: 'Hotel & Stay', icon: Hotel, hint: 'Outstation overnight lodging' },
    { id: 'misc', label: 'Miscellaneous', icon: Package, hint: 'Stationery, courier, parking' },
  ];

  const handleSimulateReceipt = () => {
    const receipts = [
      'https://images.unsplash.com/photo-1554415707-9e49017aed81?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=60',
    ];
    const picked = receipts[Math.floor(Math.random() * receipts.length)];
    setReceiptUrl(picked);
    addToast({
      type: 'info',
      title: 'Receipt Attached',
      message: 'Expense bill image added to claim',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      addToast({
        type: 'error',
        title: 'Invalid Amount',
        message: 'Please enter a valid positive expense amount',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category,
          amount: parseFloat(amount),
          description,
          receiptUrl,
        }),
      });

      addToast({
        type: 'success',
        title: 'Claim Submitted Successfully',
        message: `Claim for ${formatCurrency(parseFloat(amount))} submitted for manager approval`,
      });

      setAmount('');
      setDescription('');
      setReceiptUrl(null);

      queryClient.invalidateQueries({ queryKey: ['myExpenses'] });
      refetchExpenses();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Unable to submit expense claim',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Expense Claims</h1>
        <p className="text-xs text-slate-500">Submit field travel, lodging, and meal allowances for reimbursement</p>
      </div>

      {/* SUBMISSION CARD */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-600" />
          File New Reimbursement Claim
        </h3>

        {/* Category Selector Buttons */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Expense Category</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mb-1.5 ${
                      isSelected ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">{cat.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{cat.hint}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount & Description */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Claim Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1250"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Details & Purpose</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Fuel allowance for South Delhi hospital route (85 km)"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Receipt Attachment */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {!receiptUrl ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSimulateReceipt}
                className="text-xs"
              >
                <Camera className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Upload Bill / Fuel Slip
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <img src={receiptUrl} alt="Bill" className="w-10 h-10 object-cover rounded-lg border" />
                <span className="text-xs text-emerald-700 font-semibold">Bill Attached</span>
                <button
                  type="button"
                  onClick={() => setReceiptUrl(null)}
                  className="text-xs text-rose-500 hover:underline ml-1"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold px-5"
          >
            Submit Claim
          </Button>
        </div>
      </form>

      {/* CLAIMS HISTORY LIST */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Submitted Claims History</h3>

        {expenses.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-6">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="text-sm font-semibold text-slate-700">No expense claims filed yet</div>
            <p className="text-xs text-slate-400 mt-1">Submit your first claim using the form above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {expenses.map((exp: any) => {
              const statusVariant =
                exp.status === 'APPROVED' ? 'emerald' : exp.status === 'REJECTED' ? 'rose' : 'amber';

              return (
                <div
                  key={exp.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-subtle space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 font-mono">
                          {formatCurrency(exp.amount)}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-md">
                          {exp.category}
                        </span>
                        <Badge variant={statusVariant} size="sm">
                          {exp.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">{exp.description}</p>
                      <div className="text-[10px] text-slate-400 mt-1">
                        Submitted: {formatDate(exp.createdAt)}
                      </div>
                    </div>

                    {exp.receiptUrl && (
                      <a
                        href={exp.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 group"
                      >
                        <img
                          src={exp.receiptUrl}
                          alt="Receipt"
                          className="w-12 h-12 object-cover rounded-xl border border-slate-200 group-hover:opacity-80 transition-opacity shadow-xs"
                        />
                      </a>
                    )}
                  </div>

                  {/* Review audit trail */}
                  {exp.reviewNote && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-800">
                        Manager Review ({exp.reviewedBy}):{' '}
                      </span>
                      <span className="italic">"{exp.reviewNote}"</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
