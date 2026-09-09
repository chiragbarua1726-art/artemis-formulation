import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { useAuthStore } from '../../lib/authStore';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Database,
  Sparkle,
  Package,
  Users,
  Plus,
  Edit2,
  Trash2,
  Search,
  Building2,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export const MasterDataManager: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'doctors' | 'products' | 'users'>('doctors');
  const [search, setSearch] = useState('');

  // Modals state
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Doctor Form State
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('Aesthetic Dermatology & Cosmetology');
  const [docHospital, setDocHospital] = useState('');
  const [docAddress, setDocAddress] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docCategory, setDocCategory] = useState<'Tier A' | 'Tier B' | 'Tier C'>('Tier A');
  const [docLat, setDocLat] = useState('28.5355');
  const [docLng, setDocLng] = useState('77.2910');

  // Product Form State
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodCategory, setProdCategory] = useState('Acne & Photoaging');
  const [prodDescription, setProdDescription] = useState('');
  const [prodPrice, setProdPrice] = useState('450.00');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: doctorsData, refetch: refetchDoctors } = useQuery({
    queryKey: ['masterDoctors', search],
    queryFn: () => apiRequest(`/doctors?search=${encodeURIComponent(search)}&limit=100`),
  });

  const { data: productsData, refetch: refetchProducts } = useQuery({
    queryKey: ['masterProducts', search],
    queryFn: () => apiRequest(`/products?search=${encodeURIComponent(search)}&limit=100`),
  });

  const { data: usersData, refetch: refetchUsers } = useQuery({
    queryKey: ['masterUsers'],
    queryFn: () => apiRequest('/users'),
    enabled: user?.role === 'ADMIN',
  });

  const doctors = doctorsData?.data || [];
  const products = productsData?.data || [];
  const users = usersData?.data || [];

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiRequest('/doctors', {
        method: 'POST',
        body: JSON.stringify({
          name: docName,
          specialty: docSpecialty,
          hospitalName: docHospital,
          address: docAddress,
          phone: docPhone || null,
          category: docCategory,
          latitude: parseFloat(docLat) || null,
          longitude: parseFloat(docLng) || null,
        }),
      });

      addToast({
        type: 'success',
        title: 'Dermatologist Registered',
        message: `${docName} added to master dermatology directory`,
      });

      setIsAddDoctorOpen(false);
      setDocName('');
      setDocHospital('');
      setDocAddress('');
      setDocPhone('');
      queryClient.invalidateQueries({ queryKey: ['masterDoctors'] });
      refetchDoctors();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to add doctor' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: prodName,
          sku: prodSku,
          category: prodCategory,
          description: prodDescription,
          unitPrice: parseFloat(prodPrice) || 0,
        }),
      });

      addToast({
        type: 'success',
        title: 'Formulation Added',
        message: `${prodName} added to dermatology catalog`,
      });

      setIsAddProductOpen(false);
      setProdName('');
      setProdSku('');
      setProdDescription('');
      queryClient.invalidateQueries({ queryKey: ['masterProducts'] });
      refetchProducts();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to add product' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Master Dermatology Data</h1>
          <p className="text-xs text-slate-500">
            Maintain certified dermatologist directories, skincare formulations, and representative territories
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-200/70 p-1 rounded-xl w-fit">
          <button
            onClick={() => {
              setActiveTab('doctors');
              setSearch('');
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'doctors' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Sparkle className="w-3.5 h-3.5" />
            <span>Dermatologists ({doctors.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('products');
              setSearch('');
            }}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'products' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Derma Products ({products.length})</span>
          </button>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => {
                setActiveTab('users');
                setSearch('');
              }}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Team Roster ({users.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: DOCTORS */}
      {activeTab === 'doctors' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dermatologists by name or skin clinic..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {user?.role === 'ADMIN' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddDoctorOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Dermatologist
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3">Dermatologist</th>
                  <th className="pb-3">Sub-Specialty</th>
                  <th className="pb-3">Skin Clinic / Center</th>
                  <th className="pb-3">Tier</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3 text-right">GPS Geofence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 font-bold text-slate-900">{doc.name}</td>
                    <td className="py-3 text-emerald-800 font-semibold">{doc.specialty}</td>
                    <td className="py-3 text-slate-600">{doc.hospitalName}</td>
                    <td className="py-3">
                      <Badge
                        variant={
                          doc.category === 'Tier A'
                            ? 'emerald'
                            : doc.category === 'Tier B'
                            ? 'blue'
                            : 'slate'
                        }
                        size="sm"
                      >
                        {doc.category || 'Tier B'}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-500">{doc.phone || '—'}</td>
                    <td className="py-3 text-right font-mono text-[11px] text-slate-400">
                      {doc.latitude ? `${doc.latitude.toFixed(4)}, ${doc.longitude?.toFixed(4)}` : 'Verified'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search formulations by SKU or name..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            {user?.role === 'ADMIN' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddProductOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Formulation
              </Button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3">Formulation Name</th>
                  <th className="pb-3">SKU</th>
                  <th className="pb-3">Indication Category</th>
                  <th className="pb-3">Unit Price (MRP)</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod: any) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 font-bold text-slate-900">
                      <div>{prod.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{prod.description}</div>
                    </td>
                    <td className="py-3 font-mono text-slate-600">{prod.sku}</td>
                    <td className="py-3 text-slate-700 font-medium">{prod.category || 'Dermatology'}</td>
                    <td className="py-3 font-mono font-bold text-slate-900">
                      {formatCurrency(prod.unitPrice || 0)}
                    </td>
                    <td className="py-3 text-right">
                      <Badge variant={prod.active ? 'emerald' : 'slate'} size="sm">
                        {prod.active ? 'Active Formulary' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USERS & ROLES */}
      {activeTab === 'users' && user?.role === 'ADMIN' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-5 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="pb-3">Employee Name</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Assigned Derma Territory</th>
                  <th className="pb-3">Reporting Manager</th>
                  <th className="pb-3 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 font-bold text-slate-900">{u.name}</td>
                    <td className="py-3 font-mono text-slate-600">{u.email}</td>
                    <td className="py-3">
                      <Badge
                        variant={
                          u.role === 'ADMIN' ? 'rose' : u.role === 'MANAGER' ? 'blue' : 'emerald'
                        }
                        size="sm"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-700">{u.region || 'HQ'}</td>
                    <td className="py-3 text-slate-600">{u.manager?.name || '—'}</td>
                    <td className="py-3 text-right text-slate-400">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Doctor Modal */}
      <Modal
        isOpen={isAddDoctorOpen}
        onClose={() => setIsAddDoctorOpen(false)}
        title="Register New Dermatologist"
        description="Add skin specialist to the verified field directory"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateDoctor} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dermatologist Name</label>
              <input
                type="text"
                required
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Dr. Rajesh Mehra, MD (Derma)"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sub-Specialty</label>
              <select
                value={docSpecialty}
                onChange={(e) => setDocSpecialty(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
              >
                <option value="Aesthetic Dermatology & Cosmetology">Aesthetic Dermatology & Cosmetology</option>
                <option value="Clinical Dermatology & Acne Specialist">Clinical Dermatology & Acne Specialist</option>
                <option value="Laser & Pigmentation Specialist">Laser & Pigmentation Specialist</option>
                <option value="Trichology & Hair Restoration">Trichology & Hair Restoration</option>
                <option value="Psoriasis & Atopic Eczema Care">Psoriasis & Atopic Eczema Care</option>
                <option value="Pediatric Dermatology">Pediatric Dermatology</option>
                <option value="Dermatosurgery & Mohs Surgery">Dermatosurgery & Mohs Surgery</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Skin Clinic / Center</label>
              <input
                type="text"
                required
                value={docHospital}
                onChange={(e) => setDocHospital(e.target.value)}
                placeholder="Kaya Skin Clinic / Oliva Aesthetic"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prescription Tier</label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
              >
                <option value="Tier A">Tier A (High aesthetic procedure volume)</option>
                <option value="Tier B">Tier B (Medium clinical volume)</option>
                <option value="Tier C">Tier C (General dermatology clinic)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic Address</label>
            <input
              type="text"
              required
              value={docAddress}
              onChange={(e) => setDocAddress(e.target.value)}
              placeholder="Galleria Market, DLF Phase 4, Gurugram"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
              <input
                type="text"
                value={docLat}
                onChange={(e) => setDocLat(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
              <input
                type="text"
                value={docLng}
                onChange={(e) => setDocLng(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsAddDoctorOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Save Dermatologist
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        title="Add Dermatology Formulation"
        description="Register medication or cosmetic formula into the active detailing catalog"
        maxWidth="md"
      >
        <form onSubmit={handleCreateProduct} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Formulation Name</label>
            <input
              type="text"
              required
              value={prodName}
              onChange={(e) => setProdName(e.target.value)}
              placeholder="e.g. RetiGlow 0.05% Gel-Cream"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Code</label>
              <input
                type="text"
                required
                value={prodSku}
                onChange={(e) => setProdSku(e.target.value)}
                placeholder="e.g. RG-050"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Unit Price (₹)</label>
              <input
                type="number"
                step="0.1"
                required
                value={prodPrice}
                onChange={(e) => setProdPrice(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Indication Category</label>
            <select
              value={prodCategory}
              onChange={(e) => setProdCategory(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
            >
              <option value="Acne & Photoaging">Acne & Photoaging</option>
              <option value="Photoprotection & Post-Procedure">Photoprotection & Post-Procedure</option>
              <option value="Acne Therapeutics">Acne Therapeutics</option>
              <option value="Eczema & Barrier Repair">Eczema & Barrier Repair</option>
              <option value="Pigmentation & Melasma">Pigmentation & Melasma</option>
              <option value="Antifungal Therapy">Antifungal Therapy</option>
              <option value="Psoriasis & Dermatoses">Psoriasis & Dermatoses</option>
              <option value="Trichology & Hair Disorders">Trichology & Hair Disorders</option>
              <option value="Seborrheic & Exfoliation">Seborrheic & Exfoliation</option>
              <option value="Aesthetic Clinic Dispensing">Aesthetic Clinic Dispensing</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Indication & Description</label>
            <textarea
              rows={2}
              value={prodDescription}
              onChange={(e) => setProdDescription(e.target.value)}
              placeholder="e.g. Microsphere-encapsulated formulation for sensitive acne patients..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setIsAddProductOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Save Formulation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
