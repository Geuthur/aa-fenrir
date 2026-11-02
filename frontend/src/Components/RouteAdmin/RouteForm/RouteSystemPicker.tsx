// React
import { useState } from 'react';

// Third Party
import { Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import type { EveSolarSystem } from '@/types';

export interface RouteSystemPickerProps {
  /** Label of the system select (origin or destination) */
  label: string;
  /** Label of the station input */
  stationLabel: string;
  /** Placeholder of the station input */
  stationPlaceholder: string;
  /** All systems that can be selected */
  systems: EveSolarSystem[];
  /** Currently selected system id */
  selectedId: number;
  /** Callback when a system is selected */
  onSelect: (id: number) => void;
  /** Station / structure name */
  station: string;
  /** Callback when the station name changes */
  onStationChange: (station: string) => void;
}

/** System filter, select and station input for one end of a route. */
export function RouteSystemPicker({
  label,
  stationLabel,
  stationPlaceholder,
  systems,
  selectedId,
  onSelect,
  station,
  onStationChange,
}: RouteSystemPickerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filterSystems = (term: string) =>
    systems.filter(
      (s) =>
        s.name.toLowerCase().includes(term.toLowerCase()) ||
        s.region.toLowerCase().includes(term.toLowerCase())
    );

  const filtered = filterSystems(search);
  const isSelectedInFiltered = filtered.some((s) => s.id === selectedId);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    const matches = filterSystems(value);
    if (matches.length === 1) {
      onSelect(matches[0].id);
    }
  };

  const emptyOption =
    filtered.length === 0
      ? systems.length === 0
        ? t('-- No systems configured in Route Admin --')
        : t('-- No systems found --')
      : t('-- Select a system ({{count}} found) --', { count: filtered.length });

  return (
    <Form.Group className="aa-modal-card h-100">
      <Form.Label>{label}</Form.Label>
      <Form.Control
        type="text"
        placeholder={t('Filter system...')}
        value={search}
        onChange={(e) => handleSearchChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered.length >= 1) {
              onSelect(filtered[0].id);
            }
          }
        }}
      />
      <Form.Select
        className="mt-1"
        value={isSelectedInFiltered ? selectedId : ''}
        onChange={(e) => {
          const id = Number(e.target.value);
          if (id) onSelect(id);
        }}
        onClick={() => {
          if (filtered.length === 1 && selectedId !== filtered[0].id) {
            onSelect(filtered[0].id);
          }
        }}
      >
        {!isSelectedInFiltered && (
          <option value="" disabled>
            {emptyOption}
          </option>
        )}
        {filtered.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.region}) - Sec: {s.security.toFixed(1)}
          </option>
        ))}
      </Form.Select>

      <Form.Label className="mt-3">{stationLabel}</Form.Label>
      <Form.Control
        value={station}
        onChange={(e) => onStationChange(e.target.value)}
        placeholder={stationPlaceholder}
      />
    </Form.Group>
  );
}

export default RouteSystemPicker;
