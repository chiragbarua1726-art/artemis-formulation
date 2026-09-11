import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';

type RecordType = 'doctors' | 'chemists' | 'orders';

const labels: Record<RecordType, string> = {
  doctors: 'Doctors',
  chemists: 'Chemists',
  orders: 'POV orders',
};

export const FieldRecords: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RecordType>('doctors');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importPreview, setImportPreview] = useState<any | null>(null);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['fieldRecords', activeTab],
    queryFn: () => apiRequest(`/${activeTab}`),
  });
  const records = data?.data || [];

  const reset = () => {
    setName('');
    setLocation('');
    setNotes('');
    setQuantity('1');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const body =
        activeTab === 'orders'
          ? { customerName: name, productName: location, quantity: Number(quantity), notes }
          : { name, address: location, notes };
      await apiRequest(`/${activeTab}`, { method: 'POST', body: JSON.stringify(body) });
      addToast({
        type: 'success',
        title: `${labels[activeTab].slice(0, -1)} submitted`,
        message: 'The record is pending manager approval.',
      });
      reset();
      queryClient.invalidateQueries({ queryKey: ['fieldRecords', activeTab] });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Could not submit record', message: error.message || 'Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
      const endpoint = activeTab === 'doctors' ? 'doctors' : activeTab === 'chemists' ? 'chemists' : 'orders';
      const preview = await apiRequest(`/${endpoint}/import/preview`, { method: 'POST', body: JSON.stringify({ rows }) });
      setImportPreview({ ...preview, endpoint, rows });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Import could not be read', message: error.message || 'Use an .xlsx or .csv file.' });
    } finally {
      event.target.value = '';
    }
  };

  const confirmImport = async () => {
    if (!importPreview) return;
    try {
      await apiRequest(`/${importPreview.endpoint}/import/confirm`, { method: 'POST', body: JSON.stringify({ rows: importPreview.rows, confirm: true }) });
      addToast({ type: 'success', title: 'Import confirmed', message: `${importPreview.validCount} rows submitted for approval.` });
      setImportPreview(null);
      queryClient.invalidateQueries({ queryKey: ['fieldRecords', activeTab] });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Import failed', message: error.message || 'Please correct the file and retry.' });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Field records</h1>
        <p className="text-xs text-slate-500">Add customers and record personal orders for manager approval.</p>
      </div>

      <div className="flex gap-1 rounded-xl bg-slate-200/70 p-1 w-fit">
        {(Object.keys(labels) as RecordType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            {labels[tab]}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-dashed border-slate-300 bg-white p-4">
        <div><div className="text-sm font-bold text-slate-900">Bulk import {labels[activeTab].toLowerCase()}</div><div className="text-xs text-slate-500">Upload .xlsx or .csv, review row-level errors, then confirm.</div></div>
        <label className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Choose file<input type="file" accept=".xlsx,.xls,.csv" onChange={previewImport} className="hidden" /></label>
      </div>

      {importPreview && <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-xs">
        <div className="font-bold text-slate-900">Preview: {importPreview.validCount} valid, {importPreview.invalidCount} invalid of {importPreview.totalRows} rows</div>
        {importPreview.errors?.length > 0 && <div className="mt-2 space-y-1 text-rose-700">{importPreview.errors.slice(0, 8).map((error: any) => <div key={`${error.row}-${error.field}`}>Row {error.row}{error.field ? ` (${error.field})` : ''}: {error.message}</div>)}</div>}
        <div className="mt-3 flex gap-2"><Button size="sm" onClick={confirmImport} disabled={importPreview.validCount === 0}>Confirm valid rows</Button><Button size="sm" variant="ghost" onClick={() => setImportPreview(null)}>Cancel</Button></div>
      </div>}

      <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-sm font-bold text-slate-900">Submit {labels[activeTab].slice(0, -1)}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input required value={name} onChange={(e) => setName(e.target.value)} placeholder={activeTab === 'orders' ? 'Customer name' : 'Name'} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
          <input required value={location} onChange={(e) => setLocation(e.target.value)} placeholder={activeTab === 'orders' ? 'Product name or SKU' : 'Address / territory'} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
          {activeTab === 'orders' && <input required min="1" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />}
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes or follow-up details (optional)" rows={3} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
        <div className="flex items-center justify-between gap-3">
          <Badge variant="amber" size="sm">Manager approval required</Badge>
          <Button type="submit" size="sm" isLoading={isSubmitting}>Submit record</Button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="mb-3 text-sm font-bold text-slate-900">Submitted {labels[activeTab]}</h2>
        {isLoading ? <p className="text-xs text-slate-400">Loading records...</p> : records.length === 0 ? <p className="text-xs text-slate-400">No records submitted yet.</p> : (
          <div className="divide-y divide-slate-100">
            {records.map((record: any) => (
              <div key={record.id} className="flex items-center justify-between gap-3 py-3 text-xs">
                <div><div className="font-semibold text-slate-900">{record.name || record.customerName}</div><div className="text-slate-500">{record.address || record.productName}</div></div>
                <Badge variant={record.status === 'APPROVED' ? 'emerald' : record.status === 'REJECTED' ? 'rose' : 'amber'} size="sm">{record.status || 'PENDING'}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
