import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { apiRequest } from '../../lib/api';
import { Building2, Stethoscope, CalendarDays, MapPin, ClipboardList, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface Doctor {
  id: string;
  name: string;
  hospitalName: string;
  headquarters?: string | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  onCheckInSuccess: () => void;
}

const VISIT_PURPOSES = [
  'Product Detailing',
  'Sample Distribution',
  'Follow-up Call',
  'Clinical Study Discussion',
  'Feedback Collection',
  'Introductory Visit',
  'Key Account Meeting',
  'CME / Symposium',
  'Other',
];

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  doctor,
  onCheckInSuccess,
}) => {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual form fields
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [visitPurpose, setVisitPurpose] = useState(VISIT_PURPOSES[0]);
  const [locationNote, setLocationNote] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  const resetForm = () => {
    setVisitDate(new Date().toISOString().slice(0, 16));
    setVisitPurpose(VISIT_PURPOSES[0]);
    setLocationNote('');
    setContactPerson('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctor) return;

    setIsSubmitting(true);
    try {
      await apiRequest('/visits/checkin', {
        method: 'POST',
        body: JSON.stringify({
          doctorId: doctor.id,
          // Use doctor's registered coords as location reference; backend requires lat/lng
          lat: doctor.latitude ?? 28.5355,
          lng: doctor.longitude ?? 77.291,
          visitPurpose,
          locationNote: locationNote.trim() || undefined,
          contactPerson: contactPerson.trim() || undefined,
          visitDate,
        }),
      });

      addToast({
        type: 'success',
        title: 'Visit Logged Successfully!',
        message: `DCR form opened for ${doctor.name}`,
      });

      resetForm();
      onCheckInSuccess();
      onClose();
      navigate('/mr/dcr');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Failed to Log Visit',
        message: err.message || 'Unable to record the visit. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!doctor) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Log New Doctor Visit"
      description="Fill in the visit details to start your Daily Call Report"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Doctor Info Card (read-only) */}
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-900 truncate">{doctor.name}</h4>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-600 mt-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{doctor.hospitalName}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 truncate">{doctor.address}</p>
            <p className="text-[11px] text-blue-700 font-semibold mt-0.5">HQ: {doctor.headquarters || 'Not set'}</p>
          </div>
        </div>

        {/* Visit Date & Time */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
            Visit Date & Time
          </label>
          <input
            type="datetime-local"
            required
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Visit Purpose */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
            Purpose of Visit
          </label>
          <select
            required
            value={visitPurpose}
            onChange={(e) => setVisitPurpose(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
          >
            {VISIT_PURPOSES.map((purpose) => (
              <option key={purpose} value={purpose}>
                {purpose}
              </option>
            ))}
          </select>
        </div>

        {/* Contact Person at Clinic */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" />
            Contact Person at Clinic
            <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="e.g. Receptionist name, assistant, or nurse"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Location / Area Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            Location Note
            <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={locationNote}
            onChange={(e) => setLocationNote(e.target.value)}
            placeholder="e.g. OPD Block 2, 3rd floor, Skin Clinic Wing"
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" size="md" type="button" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            isLoading={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Start Visit & Open DCR
          </Button>
        </div>
      </form>
    </Modal>
  );
};
