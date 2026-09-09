import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatDateTime } from '../../lib/utils';
import {
  MapPin,
  Stethoscope,
  Phone,
  Navigation,
  Clock,
  RefreshCw,
  Building2,
  Activity,
  Users,
} from 'lucide-react';

// Custom Leaflet DivIcons
const createRepMarkerIcon = (isInCall: boolean) => {
  return L.divIcon({
    className: 'custom-rep-pin',
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: ${isInCall ? '#059669' : '#0f172a'};
        border: 3px solid #ffffff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-weight: bold;
        font-size: 14px;
      ">
        ${isInCall ? '🩺' : '🚗'}
        ${
          isInCall
            ? `<span style="
                position: absolute;
                top: -2px;
                right: -2px;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background-color: #10b981;
                border: 2px solid white;
              "></span>`
            : ''
        }
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
};

function ChangeMapView({ coords }: { coords: [number, number] }) {
  const map = useMap();
  map.setView(coords, 12);
  return null;
}

export const TeamTrackerMap: React.FC = () => {
  const [pollInterval, setPollInterval] = useState<number>(30000);
  const [selectedRep, setSelectedRep] = useState<any | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.5355, 77.291]);

  const { data: teamData, refetch, isFetching } = useQuery({
    queryKey: ['teamTrackerData'],
    queryFn: () => apiRequest('/team'),
    refetchInterval: pollInterval,
  });

  const team = teamData?.data || [];

  const handleSelectRep = (rep: any) => {
    setSelectedRep(rep);
    if (rep.latestVisit && rep.latestVisit.latitude && rep.latestVisit.longitude) {
      setMapCenter([rep.latestVisit.latitude, rep.latestVisit.longitude]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Team Live GPS Tracker</h1>
          <p className="text-xs text-slate-500">
            Real-time field locations, active clinic check-ins, and territory coverage map
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Polling: 30s</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs"
            isLoading={isFetching}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Container: Split Map & Rep List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-[580px]">
        {/* Left Pane: Rep Roster & Live Status */}
        <div className="space-y-3 lg:col-span-1 overflow-y-auto max-h-[620px]">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Active Field Sales Reps ({team.length})
          </div>

          <div className="space-y-2.5">
            {team.map((mr: any) => {
              const isSelected = selectedRep?.id === mr.id;
              const hasCheckin = !!mr.latestVisit;

              return (
                <div
                  key={mr.id}
                  onClick={() => handleSelectRep(mr)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white ${
                    isSelected
                      ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/20'
                      : 'border-slate-200/80 hover:border-slate-300 shadow-subtle'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{mr.name}</h4>
                        {mr.isCurrentlyInCall ? (
                          <Badge variant="emerald" size="sm">
                            In Call
                          </Badge>
                        ) : (
                          <Badge variant="slate" size="sm">
                            Available
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{mr.region}</p>
                    </div>

                    <a
                      href={`tel:${mr.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      title="Call Rep"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Latest Visit Details */}
                  {hasCheckin ? (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-800 font-semibold truncate">
                        <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{mr.latestVisit.hospitalName}</span>
                      </div>
                      <div className="text-slate-500 text-[11px] truncate">
                        Dr: {mr.latestVisit.doctorName}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>Check-in: {formatDateTime(mr.latestVisit.checkInTime)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 italic">
                      No visits recorded today yet.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Interactive Map */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-card relative flex flex-col">
          <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs px-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-semibold">OpenStreetMap Real-Time Telemetry</span>
            </div>
            <div className="text-slate-400 font-mono text-[11px]">
              Active GPS Nodes: {team.filter((m: any) => m.latestVisit?.latitude).length}
            </div>
          </div>

          <div className="flex-1 w-full h-[540px] relative">
            <MapContainer
              center={mapCenter}
              zoom={11}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%', minHeight: '520px' }}
            >
              <ChangeMapView coords={mapCenter} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {team.map((mr: any) => {
                if (!mr.latestVisit?.latitude || !mr.latestVisit?.longitude) return null;

                const position: [number, number] = [
                  mr.latestVisit.latitude,
                  mr.latestVisit.longitude,
                ];

                return (
                  <Marker
                    key={mr.id}
                    position={position}
                    icon={createRepMarkerIcon(mr.isCurrentlyInCall)}
                  >
                    <Popup>
                      <div className="p-1 text-xs space-y-1 max-w-xs font-sans">
                        <div className="font-bold text-slate-900 text-sm">{mr.name}</div>
                        <div className="text-emerald-700 font-semibold">
                          {mr.isCurrentlyInCall ? '● In Active Call' : 'Completed Call'}
                        </div>
                        <div className="text-slate-700 font-medium">{mr.latestVisit.doctorName}</div>
                        <div className="text-slate-500 text-[11px]">{mr.latestVisit.hospitalName}</div>
                        <div className="text-slate-400 text-[10px]">
                          Time: {formatDateTime(mr.latestVisit.checkInTime)}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
