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
import { Badge, Button, Form, InputGroup, ListGroup } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import { searchSolarSystems } from '@/Api/ApiCalls';
import type { components } from '@/Api/OpenApi';
import { getSecurityVariant } from '@/Components/Calculator/calculator';
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
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setIsDropdownOpen(true);
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
      setSearchResults([]);
      setIsSearching(false);
      setIsDropdownOpen(false);
      return;
    }
    onChange([...waypoints, { id: sys.id, name: sys.name, security: sys.security, region: sys.region }]);
    setSearchTerm('');
    setSearchResults([]);
    setIsSearching(false);
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
    return <Badge bg={getSecurityVariant(sec)}>{sec.toFixed(1)}</Badge>;
  };

  // Systems from availableSystems not yet added
  const unaddedConfiguredSystems = availableSystems.filter(
    (s) => !waypoints.some((w) => w.id === s.id)
  );

  return (
    <div className="aa-modal-card aa-modal-card-accent mb-3">
      {/* Header */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-1 border-bottom pb-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <h3 className="aa-modal-section-title text-info">
            <Radio size={16} className="flex-shrink-0" />
            {t('Cyno Chain Waypoints')}
          </h3>
          <Badge pill bg="info" className="font-monospace">
            {waypoints.length} {waypoints.length === 1 ? t('Waypoint') : t('Waypoints')}
          </Badge>
        </div>
        <span className="small font-monospace text-body-secondary">
          {t('Intermediate beacon systems for jump drive transit')}
        </span>
      </div>

      {/* Inputs: Search all EVE systems + Quick-select from Route Admin */}
      <div className="row g-2 mb-2" ref={searchContainerRef}>
        {/* Search Input */}
        <div className="col-12 col-sm-6">
          <div className="position-relative">
            <InputGroup>
              <InputGroup.Text>
                <Search size={14} />
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder={t('Search any solar system (e.g. Basgerin)...')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value.trim().length < 2) {
                    setSearchResults([]);
                    setIsSearching(false);
                  }
                }}
                onFocus={() => {
                  if (searchTerm.trim().length >= 2) setIsDropdownOpen(true);
                }}
                className="font-monospace"
              />
            </InputGroup>

            {/* Search Dropdown Results */}
            {isDropdownOpen && searchTerm.trim().length >= 2 && (
              <ListGroup className="aa-modal-dropdown font-monospace small shadow">
                {isSearching ? (
                  <ListGroup.Item className="text-center text-body-secondary">
                    {t('Searching EVE systems...')}
                  </ListGroup.Item>
                ) : searchResults.length === 0 ? (
                  <ListGroup.Item className="text-center text-body-secondary">
                    {t('No solar systems found')}
                  </ListGroup.Item>
                ) : (
                  searchResults.map((sys) => {
                    const isAdded = waypoints.some((w) => w.id === sys.id);
                    return (
                      <ListGroup.Item
                        key={sys.id}
                        action
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
                        className="d-flex align-items-center justify-content-between gap-2"
                      >
                        <div className="d-flex flex-wrap align-items-center gap-2">
                          <span className="fw-semibold">{sys.name}</span>
                          {sys.region_name && (
                            <span className="text-body-secondary">({sys.region_name})</span>
                          )}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          {getSecBadge(sys.security_status)}
                          {isAdded ? (
                            <span className="text-body-secondary">{t('Added')}</span>
                          ) : (
                            <Plus size={14} className="text-info" />
                          )}
                        </div>
                      </ListGroup.Item>
                    );
                  })
                )}
              </ListGroup>
            )}
          </div>
        </div>

        {/* Quick Add from Configured Systems */}
        <div className="col-12 col-sm-6">
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
            className="font-monospace"
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
        <div className="aa-modal-empty small font-monospace">
          {t('No cyno waypoints added yet. Use the search or quick-select above to add beacon systems in sequence.')}
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {waypoints.map((wp, index) => (
            <div
              key={wp.id}
              className="aa-modal-row d-flex flex-wrap align-items-center justify-content-between gap-2 small font-monospace"
            >
              {/* Order & System Details */}
              <div className="d-flex flex-wrap align-items-center gap-2">
                <Badge bg="info">#{index + 1}</Badge>
                <span className="fw-bold">{wp.name}</span>
                {wp.region && <span className="text-body-secondary">({wp.region})</span>}
                {getSecBadge(wp.security)}
              </div>

              {/* Actions: Reorder & Remove */}
              <div className="d-flex align-items-center gap-1">
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  disabled={index === 0}
                  onClick={() => moveWaypoint(index, -1)}
                  title={t('Move Up')}
                >
                  <ChevronUp size={14} />
                </Button>
                <Button
                  type="button"
                  variant="outline-secondary"
                  size="sm"
                  disabled={index === waypoints.length - 1}
                  onClick={() => moveWaypoint(index, 1)}
                  title={t('Move Down')}
                >
                  <ChevronDown size={14} />
                </Button>
                <Button
                  type="button"
                  variant="outline-danger"
                  size="sm"
                  onClick={() => removeWaypoint(index)}
                  title={t('Remove Waypoint')}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}

          {/* Visual Route Pipeline Chain */}
          <div className="d-flex flex-wrap align-items-center gap-2 pt-1 small font-monospace text-body-secondary">
            <Badge bg="secondary">{originSystemName || t('Origin')}</Badge>
            <span>➔</span>
            {waypoints.map((wp) => (
              <div key={wp.id} className="d-flex align-items-center gap-2">
                <Badge bg="info" className="d-inline-flex align-items-center gap-1">
                  <Radio size={12} />
                  {wp.name}
                </Badge>
                <span>➔</span>
              </div>
            ))}
            <Badge bg="secondary">{destinationSystemName || t('Destination')}</Badge>
          </div>
        </div>
      )}
    </div>
  );
}
