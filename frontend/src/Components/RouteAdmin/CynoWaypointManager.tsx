// React
import { useEffect, useRef, useState } from 'react';

// Third Party
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Radio,
  Search,
  Trash2,
} from 'lucide-react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import { searchSolarSystems } from '@/Api/ApiCalls';
import type { components } from '@/Api/OpenApi';
import type { EveSolarSystem } from '@/types';

type SolarSystemSearchResult = components['schemas']['SolarSystemSearchSchema'];

export interface CynoWaypointItem {
  id: number;
  name: string;
  security?: number;
  region?: string;
}

export interface CynoWaypointManagerProps {
  waypoints: CynoWaypointItem[];
  onChange: (waypoints: CynoWaypointItem[]) => void;
  availableSystems: EveSolarSystem[];
  originSystemName?: string;
  destinationSystemName?: string;
}

export function CynoWaypointManager({
  waypoints,
  onChange,
  availableSystems,
  originSystemName,
  destinationSystemName,
}: CynoWaypointManagerProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SolarSystemSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for all EVE solar systems
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setIsDropdownOpen(true);
    const timer = setTimeout(async () => {
      try {
        const data = await searchSolarSystems(trimmed);
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const addWaypoint = (sys: { id: number; name: string; security?: number; region?: string }) => {
    if (waypoints.some((w) => w.id === sys.id)) {
      setSearchTerm('');
      setIsDropdownOpen(false);
      return;
    }
    onChange([...waypoints, { id: sys.id, name: sys.name, security: sys.security, region: sys.region }]);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const removeWaypoint = (index: number) => {
    const updated = waypoints.filter((_, i) => i !== index);
    onChange(updated);
  };

  const moveWaypoint = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= waypoints.length) return;
    const updated = [...waypoints];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onChange(updated);
  };

  const getSecBadge = (sec?: number) => {
    if (sec === undefined) return null;
    const color =
      sec >= 0.45
        ? '!text-emerald-400 !bg-emerald-950/60 border-emerald-500/40'
        : sec > 0.0
        ? '!text-amber-400 !bg-amber-950/60 border-amber-500/40'
        : '!text-rose-400 !bg-rose-950/60 border-rose-500/40';
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${color}`}>
        {sec.toFixed(1)}
      </span>
    );
  };

  // Systems from availableSystems not yet added
  const unaddedConfiguredSystems = availableSystems.filter(
    (s) => !waypoints.some((w) => w.id === s.id)
  );

  return (
    <div className="mt-4 p-4 rounded-xl !bg-slate-900/80 border !border-cyan-500/30 space-y-3 shadow-inner">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b !border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 !text-cyan-400 animate-pulse shrink-0" />
          <span className="text-xs font-bold !text-cyan-300 uppercase tracking-wider font-mono">
            {t('Cyno Chain Waypoints')}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full !bg-cyan-950/90 !text-cyan-300 border !border-cyan-500/30 font-mono">
            {waypoints.length} {waypoints.length === 1 ? t('Waypoint') : t('Waypoints')}
          </span>
        </div>
        <span className="text-[11px] !text-slate-400 font-mono">
          {t('Intermediate beacon systems for jump drive transit')}
        </span>
      </div>

      {/* Inputs: Search all EVE systems + Quick-select from Route Admin */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" ref={searchContainerRef}>
        {/* Search Input */}
        <div className="relative">
          <div className="relative">
            <Search className="w-3.5 h-3.5 !text-slate-500 absolute left-3 top-2.5" />
            <Form.Control
              type="text"
              placeholder={t('Search any solar system (e.g. Basgerin)...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (searchTerm.trim().length >= 2) setIsDropdownOpen(true);
              }}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono !bg-[#0c1018] border !border-slate-800 rounded !text-slate-200 focus:outline-none focus:!border-cyan-500"
            />
          </div>

          {/* Search Dropdown Results */}
          {isDropdownOpen && searchTerm.trim().length >= 2 && (
            <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg !bg-slate-900 border !border-slate-700 shadow-2xl divide-y !divide-slate-800 font-mono text-xs">
              {isSearching ? (
                <div className="p-3 text-center !text-slate-500 text-xs">
                  {t('Searching EVE systems...')}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-3 text-center !text-slate-500 text-xs">
                  {t('No solar systems found')}
                </div>
              ) : (
                searchResults.map((sys) => {
                  const isAdded = waypoints.some((w) => w.id === sys.id);
                  return (
                    <button
                      key={sys.id}
                      type="button"
                      disabled={isAdded}
                      onClick={() =>
                        addWaypoint({
                          id: sys.id,
                          name: sys.name,
                          security: sys.security_status,
                          region: sys.region_name,
                        })
                      }
                      className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors ${
                        isAdded
                          ? 'opacity-40 cursor-not-allowed !bg-slate-950/40'
                          : 'hover:!bg-cyan-950/60 !text-slate-200 hover:!text-cyan-300 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{sys.name}</span>
                        {sys.region_name && (
                          <span className="text-[10px] !text-slate-500">({sys.region_name})</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {getSecBadge(sys.security_status)}
                        {isAdded ? (
                          <span className="text-[10px] !text-slate-500">{t('Added')}</span>
                        ) : (
                          <Plus className="w-3.5 h-3.5 !text-cyan-400" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Quick Add from Configured Systems */}
        <div>
          <Form.Select
            value=""
            onChange={(e) => {
              const id = Number(e.target.value);
              if (id) {
                const sys = availableSystems.find((s) => s.id === id);
                if (sys) {
                  addWaypoint({
                    id: sys.id,
                    name: sys.name,
                    security: sys.security,
                    region: sys.region,
                  });
                }
              }
            }}
            className="w-full px-2.5 py-1.5 text-xs font-mono !bg-[#0c1018] border !border-slate-800 rounded !text-slate-300 focus:outline-none focus:!border-cyan-500 cursor-pointer"
          >
            <option value="">{t('-- Quick Add Configured System --')}</option>
            {unaddedConfiguredSystems.map((s) => (
              <option key={s.id} value={s.id}>
                + {s.name} ({s.region}) - Sec: {s.security.toFixed(1)}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>

      {/* Waypoint List */}
      {waypoints.length === 0 ? (
        <div className="p-3 text-center rounded-lg !bg-slate-950/50 border !border-dashed !border-slate-800 text-xs !text-slate-500 font-mono">
          {t('No cyno waypoints added yet. Use the search or quick-select above to add beacon systems in sequence.')}
        </div>
      ) : (
        <div className="space-y-1.5">
          {waypoints.map((wp, index) => (
            <div
              key={wp.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg !bg-[#0b0f17] border !border-slate-800/90 font-mono text-xs hover:!border-slate-700 transition-colors"
            >
              {/* Order & System Details */}
              <div className="flex items-center gap-2.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold !bg-cyan-950/80 !text-cyan-400 border !border-cyan-500/40">
                  #{index + 1}
                </span>
                <span className="font-bold !text-slate-100">{wp.name}</span>
                {wp.region && (
                  <span className="text-[11px] !text-slate-500">({wp.region})</span>
                )}
                {getSecBadge(wp.security)}
              </div>

              {/* Actions: Reorder & Remove */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  disabled={index === 0}
                  onClick={() => moveWaypoint(index, -1)}
                  className="p-1 text-xs !bg-slate-900 border !border-slate-800 hover:!bg-slate-800 !text-slate-300 disabled:opacity-30 cursor-pointer"
                  title={t('Move Up')}
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  disabled={index === waypoints.length - 1}
                  onClick={() => moveWaypoint(index, 1)}
                  className="p-1 text-xs !bg-slate-900 border !border-slate-800 hover:!bg-slate-800 !text-slate-300 disabled:opacity-30 cursor-pointer"
                  title={t('Move Down')}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline-danger"
                  size="sm"
                  onClick={() => removeWaypoint(index)}
                  className="p-1 text-xs !bg-red-950/40 border !border-red-500/40 hover:!bg-red-900/60 !text-red-300 cursor-pointer ml-1"
                  title={t('Remove Waypoint')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}

          {/* Visual Route Pipeline Chain */}
          <div className="pt-2 px-1">
            <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono !text-slate-400">
              <span className="px-2 py-0.5 rounded !bg-slate-800 !text-cyan-300 border !border-slate-700 font-semibold">
                {originSystemName || t('Origin')}
              </span>
              <span>➔</span>
              {waypoints.map((wp) => (
                <div key={wp.id} className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded !bg-cyan-950/60 !text-cyan-400 border !border-cyan-500/40 flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
                    <span>{wp.name}</span>
                  </span>
                  <span>➔</span>
                </div>
              ))}
              <span className="px-2 py-0.5 rounded !bg-slate-800 !text-indigo-300 border !border-slate-700 font-semibold">
                {destinationSystemName || t('Destination')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
