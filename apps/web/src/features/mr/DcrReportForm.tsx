import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { formatDateTime } from '../../lib/utils';
import {
  CheckCircle2,
  Package,
  FileText,
  Camera,
  Plus,
  Minus,
  Sparkles,
  Building2,
  Sparkle,
  ClipboardList,
  MapPin,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string | null;
}

export const DcrReportForm: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // Active visit query
  const { data: activeData, isLoading: isLoadingActive } = useQuery({
    queryKey: ['activeVisit'],
    queryFn: () => apiRequest('/visits/active'),
  });

  // Recent visits query
  const { data: recentVisitsData, refetch: refetchVisits } = useQuery({
    queryKey: ['myVisitsHistory'],
    queryFn: () => apiRequest('/visits/me?limit=10'),
  });

  // Products catalog
  const { data: productsData } = useQuery({
    queryKey: ['productsList'],
    queryFn: () => apiRequest('/products?limit=50'),
  });

  const activeVisit = activeData?.activeVisit;
  const products: Product[] = productsData?.data || [];
  const pastVisits = recentVisitsData?.data || [];

  // DCR form state
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productNotes, setProductNotes] = useState<Record<string, string>>({});
  const [sampleQuantities, setSampleQuantities] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [nextVisitDate, setNextVisitDate] = useState('');
  const [nextVisitNote, setNextVisitNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productLines, setProductLines] = useState([{ name: '', quantity: 1, value: 0 }]);

  // Reset DCR form when visit changes
  useEffect(() => {
    if (!activeVisit) {
      setSelectedProductIds([]);
      setProductNotes({});
      setSampleQuantities({});
      setFeedback('');
      setNextVisitDate('');
      setNextVisitNote('');
      setPhotoUrl(null);
    }
  }, [activeVisit?.id]);

  const handleToggleProduct = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const updateProductLine = (index: number, field: 'name' | 'quantity' | 'value', value: string) => {
    setProductLines((lines) => lines.map((line, i) => i === index
      ? { ...line, [field]: field === 'name' ? value : Math.max(0, Number(value)) }
      : line));
  };

  const handleSampleQtyChange = (productId: string, delta: number) => {
    setSampleQuantities((prev) => {
      const current = prev[productId] || 0;
      const nextVal = Math.max(0, current + delta);
      if (nextVal === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: nextVal };
    });
  };

  const handleApplyPresetFeedback = (text: string) => {
    setFeedback((prev) => (prev ? `${prev} • ${text}` : text));
  };

  const handleSimulatePhotoUpload = () => {
    const samplePhotos = [
      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1583912267670-6575ad31e133?w=800&auto=format&fit=crop&q=60',
    ];
    const picked = samplePhotos[Math.floor(Math.random() * samplePhotos.length)];
    setPhotoUrl(picked);
    addToast({
      type: 'info',
      title: 'Slip Attached',
      message: 'Clinic detailing acknowledgment captured',
    });
  };

  const handleSubmitDCR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVisit) return;

    const validLines = productLines.filter((line) => line.name.trim() && line.quantity > 0);
    if (selectedProductIds.length === 0 && validLines.length === 0) {
      addToast({
        type: 'error',
        title: 'Formulation Selection Required',
        message: 'Please select at least one formulation detailed during this visit',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const productsDiscussed: Array<Record<string, string | number>> = [
        ...selectedProductIds.map((pid) => ({ productId: pid, notes: productNotes[pid] || '' })),
        ...validLines.map((line) => ({ productName: line.name.trim(), quantity: line.quantity, value: line.value })),
      ];

      const samplesGiven: Array<Record<string, string | number>> = [...validLines.map((line) => {
        const prod = products.find((p) => p.name.toLowerCase() === line.name.trim().toLowerCase());
        return {
          productId: prod?.id || '',
          productName: line.name.trim(),
          quantity: line.quantity,
          value: line.value,
        };
      }), ...Object.entries(sampleQuantities).map(([pid, qty]) => {
        const prod = products.find((p) => p.id === pid);
        return {
          productId: pid,
          productName: prod?.name || 'Derma Formulation',
          quantity: qty,
          value: 0,
        };
      })];

      // Compose full feedback including follow-up details if filled
      let fullFeedback = feedback;
      if (nextVisitDate || nextVisitNote) {
        const followUp = [
          nextVisitDate ? `Next visit planned: ${nextVisitDate}` : '',
          nextVisitNote ? `Follow-up note: ${nextVisitNote}` : '',
        ]
          .filter(Boolean)
          .join(' | ');
        fullFeedback = fullFeedback ? `${fullFeedback} || ${followUp}` : followUp;
      }

      await apiRequest(`/visits/${activeVisit.id}/checkout`, {
        method: 'PATCH',
        body: JSON.stringify({
          productsDiscussed,
          samplesGiven: samplesGiven.length > 0 ? samplesGiven : undefined,
          feedback: fullFeedback || undefined,
          photoUrl,
        }),
      });

      addToast({
        type: 'success',
        title: 'DCR Submitted!',
        message: `Visit report for ${activeVisit.doctor?.name} saved successfully`,
      });

      // Reset form and invalidate queries
      setSelectedProductIds([]);
      setProductNotes({});
      setSampleQuantities({});
      setFeedback('');
      setNextVisitDate('');
      setNextVisitNote('');
      setPhotoUrl(null);
      setProductLines([{ name: '', quantity: 1, value: 0 }]);
      queryClient.invalidateQueries({ queryKey: ['activeVisit'] });
      queryClient.invalidateQueries({ queryKey: ['myVisitsToday'] });
      refetchVisits();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Unable to submit the call report',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingActive) {
    return <div className="py-12 text-center text-xs text-slate-400">Loading visit status...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Daily Call Report (DCR)</h1>
        <p className="text-xs text-slate-500">
          Record formulation detailing, samples distributed, and doctor feedback
        </p>
      </div>

      {/* ── ACTIVE VISIT FORM ── */}
      {activeVisit ? (
        <form onSubmit={handleSubmitDCR} className="space-y-5">

          {/* Visit Summary Banner */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-elevated border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Sparkle className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                      Visit In Progress
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-0.5 truncate">
                    {activeVisit.doctor?.name}
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 truncate">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{activeVisit.doctor?.hospitalName}</span>
                  </div>
                </div>
              </div>

              {/* Visit meta info */}
              <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3 px-4 text-xs text-slate-300 space-y-1 shrink-0">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-400" />
                  <span className="truncate max-w-[160px]">
                    {activeVisit.doctor?.address || 'Address on record'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
                  <span>{activeVisit.visitPurpose || 'Product Detailing'}</span>
                </div>
                {activeVisit.contactPerson && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>{activeVisit.contactPerson}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product entry for the actual field call */}
          <div className="bg-white rounded-2xl border border-blue-200 p-5 shadow-subtle space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Products discussed / ordered</h3>
              <p className="text-xs text-slate-500 mt-0.5">Enter the product name, quantity and value from this doctor visit.</p>
            </div>
            {productLines.map((line, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_110px_130px_auto] gap-2 items-center">
                <input required={index === 0} value={line.name} onChange={(e) => updateProductLine(index, 'name', e.target.value)}
                  placeholder="Product name" className="px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                <input type="number" min="1" value={line.quantity} onChange={(e) => updateProductLine(index, 'quantity', e.target.value)}
                  placeholder="Quantity" className="px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                <input type="number" min="0" step="0.01" value={line.value} onChange={(e) => updateProductLine(index, 'value', e.target.value)}
                  placeholder="Value" className="px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                {productLines.length > 1 && <button type="button" onClick={() => setProductLines((lines) => lines.filter((_, i) => i !== index))}
                  className="text-xs text-rose-600 hover:text-rose-700">Remove</button>}
              </div>
            ))}
            <button type="button" onClick={() => setProductLines((lines) => [...lines, { name: '', quantity: 1, value: 0 }])}
              className="text-xs font-semibold text-blue-700 hover:text-blue-800">+ Add another product</button>
          </div>

          {/* Section 1: Formulations Detailed */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  Formulations Detailed
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select products discussed during this visit
                </p>
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                {selectedProductIds.length} Selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {products.map((prod) => {
                const isSelected = selectedProductIds.includes(prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => handleToggleProduct(prod.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-900">{prod.name}</div>
                      <span className="text-[10px] font-mono text-slate-400">{prod.sku}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{prod.category}</div>

                    {isSelected && (
                      <div
                        className="mt-2.5 pt-2 border-t border-blue-200/60"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          placeholder="Detailing notes (e.g. tolerability, vehicle, clinical evidence)..."
                          value={productNotes[prod.id] || ''}
                          onChange={(e) =>
                            setProductNotes({ ...productNotes, [prod.id]: e.target.value })
                          }
                          className="w-full text-xs p-1.5 bg-white border border-blue-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Samples Given */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                Sample Units Handed Over
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Specify sample tubes, mini-lotions, and strip packs distributed
              </p>
            </div>

            <div className="space-y-2">
              {products.slice(0, 5).map((prod) => {
                const qty = sampleQuantities[prod.id] || 0;
                return (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/60"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{prod.name}</div>
                      <div className="text-[10px] text-slate-500">{prod.sku} • Sample Unit</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSampleQtyChange(prod.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all text-slate-600"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-slate-900">{qty}</span>
                      <button
                        type="button"
                        onClick={() => handleSampleQtyChange(prod.id, 1)}
                        className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Doctor Feedback */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Doctor Response & Feedback
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comments, prescription commitments, or product preferences expressed
              </p>
            </div>

            {/* Quick Preset Chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                'Agreed to switch 15 acne patients to RetiGlow 0.05%',
                'Requested 10 sample tubes of DermaShield SPF 50+ for post-laser patients',
                'Praised non-greasy tolerability of HydraBarrier in atopic eczema',
                'Clinic interested in bulk dispensing MinoxGlow for trichology unit',
                'Requested Phase IV hyperpigmentation clinical study for MelanoFade',
              ].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => handleApplyPresetFeedback(preset)}
                  className="text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-800 text-slate-600 px-2.5 py-1 rounded-lg border border-slate-200/60 transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter doctor's feedback, trial requests, and any follow-up plans..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Section 4: Follow-up Planning */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                Follow-up Plan
                <span className="text-xs font-normal text-slate-400">(optional)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Schedule the next visit and note any pending actions
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600">Next Visit Date</label>
                <input
                  type="date"
                  value={nextVisitDate}
                  onChange={(e) => setNextVisitDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-600">Follow-up Reminder</label>
                <input
                  type="text"
                  value={nextVisitNote}
                  onChange={(e) => setNextVisitNote(e.target.value)}
                  placeholder="e.g. Bring updated IMS data, new brochure"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Photo / Slip Attachment */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Visit Proof
                  <span className="text-xs font-normal text-slate-400">(optional)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clinic board, prescription slip, or sample receipt photo
                </p>
              </div>
              {!photoUrl ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSimulatePhotoUpload}
                  className="text-xs"
                >
                  Attach Photo
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setPhotoUrl(null)}
                  className="text-xs text-rose-600 hover:text-rose-700"
                >
                  Remove
                </Button>
              )}
            </div>

            {photoUrl && (
              <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-48 w-full">
                <img src={photoUrl} alt="Visit Proof" className="w-full h-48 object-cover" />
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                  Clinic Visit Attachment
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-sm font-bold rounded-2xl shadow-md"
            >
              Submit DCR & Complete Visit
            </Button>
          </div>
        </form>
      ) : (
        /* ── NO ACTIVE VISIT ── */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center shadow-subtle">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-slate-900">No Visit In Progress</h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Go to Today's Plan, select a doctor, and log a visit to start filling a DCR.
            </p>
            <div className="mt-5">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/mr/today')}
                className="bg-slate-900 hover:bg-black text-white"
              >
                Go to Today's Plan
              </Button>
            </div>
          </div>

          {/* Recent Completed Visits */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Recent Completed Visits</h3>
            <div className="grid grid-cols-1 gap-3">
              {pastVisits.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
                  No previous visits logged yet.
                </div>
              ) : (
                pastVisits.map((visit: any) => (
                  <div
                    key={visit.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-subtle space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{visit.doctor?.name}</h4>
                          <Badge variant="slate" size="sm">
                            {visit.doctor?.category || 'Tier B'}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {visit.doctor?.hospitalName}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                          Completed
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {formatDateTime(visit.checkInTime)}
                        </div>
                      </div>
                    </div>

                    {visit.productsDiscussed && visit.productsDiscussed.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {visit.productsDiscussed.map((pd: any) => (
                          <span
                            key={pd.id}
                            className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium"
                          >
                            {pd.product?.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {visit.feedback && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                        "{visit.feedback}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
