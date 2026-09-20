// React
import { useEffect, useMemo, useRef, useState } from 'react';

// Third Party
import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// Styles
import styles from '@/Components/RouteAdmin/Modals/CreateRouteModal.module.css';

import { loadRouteSystems } from '@/Api/ApiCalls';
import type { components } from '@/Api/OpenApi';
import { queryKeys } from '@/Api/query';
import { FenrirModal } from '@/Components/Modals';
import { CynoWaypointManager, type CynoWaypointItem } from '@/Components/RouteAdmin/CynoWaypointManager';
import type { EveSolarSystem, SecurityClass } from '@/types';

export interface CreateRouteModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback to submit the new route preset data */
  onSubmit: (data: components['schemas']['CreateRoutePresetSchema']) => void;
  /** Whether the creation request is currently pending */
  isPending: boolean;
}

const INITIAL_FORM: components['schemas']['CreateRoutePresetSchema'] = {
  name: '',
  origin_system_id: 0,
  origin_system_station: '',
  destination_system_id: 0,
  destination_system_station: '',
  service_type: 'jumpfreighter',
  max_volume: 360000,
  max_collateral: 15000000000,
  base_fee: 30000000,
  fee_per_m3: 850,
  fee_per_ly: 3500000,
  collateral_percent: 1,
  min_reward: 50000000,
  estimated_time: 2880, // 2 days in mins
  is_cyno_route: true,
  cyno_waypoint_ids: [],
  danger_level: 'cyno_guarded',
  has_alliance_subsidy: true,
};

/**
 * Inner form component for creating a route preset.
 * Managed with React key lifecycle to reset automatically on modal close.
 */
function CreateRouteForm({
  onClose,
  onSubmit,
  isPending,
}: {
  onClose: () => void;
  onSubmit: (data: components['schemas']['CreateRoutePresetSchema']) => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [waypointSystems, setWaypointSystems] = useState<CynoWaypointItem[]>([]);
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch configured RouteSystems from backend
  const { data: routeSystems = [] } = useQuery({
    queryKey: queryKeys.RouteSystems,
    queryFn: loadRouteSystems,
    refetchOnWindowFocus: false,
  });

  const availableSystems: EveSolarSystem[] = useMemo(() => {
    return routeSystems.map((rs) => ({
      id: rs.system_id,
      name: rs.name,
      security: rs.security_status,
      securityClass:
        (rs.security_class as SecurityClass) ||
        (rs.security_status >= 0.45 ? 'highsec' : rs.security_status > 0 ? 'lowsec' : 'nullsec'),
      region: rs.region_name || 'Unknown',
      defaultStation: `${rs.name} - Upwell Citadel`,
      x: rs.x,
      y: rs.y,
      z: rs.z,
    }));
  }, [routeSystems]);

  // Ensure default origin & destination exist in availableSystems
  useEffect(() => {
    if (availableSystems.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData((prev) => {
        const hasOrigin = availableSystems.some((s) => s.id === prev.origin_system_id);
        const hasDest = availableSystems.some((s) => s.id === prev.destination_system_id);
        if (!hasOrigin || !hasDest) {
          const originSys = hasOrigin
            ? availableSystems.find((s) => s.id === prev.origin_system_id)!
            : availableSystems[0];
          const destSys = hasDest
            ? availableSystems.find((s) => s.id === prev.destination_system_id)!
            : availableSystems[1] || availableSystems[0];
          return {
            ...prev,
            origin_system_id: originSys.id,
            origin_system_station: originSys.defaultStation || '',
            destination_system_id: destSys.id,
            destination_system_station: destSys.defaultStation || '',
          };
        }
        return prev;
      });
    }
  }, [availableSystems]);

  const updateField = <K extends keyof typeof INITIAL_FORM>(
    field: K,
    value: (typeof INITIAL_FORM)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleInsertArrow = () => {
    const input = nameInputRef.current;
    const currentName = formData.name || '';
    if (!input) {
      updateField('name', currentName ? `${currentName} ⟷ ` : '⟷ ');
      return;
    }
    const start = input.selectionStart ?? currentName.length;
    const end = input.selectionEnd ?? currentName.length;
    const before = currentName.substring(0, start);
    const after = currentName.substring(end);

    const needsPrefixSpace = before.length > 0 && !before.endsWith(' ');
    const needsSuffixSpace = !after.startsWith(' ');
    const symbolToInsert = `${needsPrefixSpace ? ' ' : ''}⟷${needsSuffixSpace ? ' ' : ''}`;

    const newName = before + symbolToInsert + after;
    updateField('name', newName);

    setTimeout(() => {
      input.focus();
      const newPos = start + symbolToInsert.length;
      input.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!formData.name.trim()) {
      setValidationError(t('Route name is required.'));
      return;
    }
    if (!formData.origin_system_id || !formData.destination_system_id) {
      setValidationError(t('Origin and destination systems are required. Please configure available systems in Route Admin first.'));
      return;
    }
    setValidationError(null);
    onSubmit({
      ...formData,
      name: formData.name.trim(),
      cyno_waypoint_ids: formData.is_cyno_route ? waypointSystems.map((w) => w.id) : [],
    });
  };

  const selectOrigin = (id: number) => {
    const sys = availableSystems.find((s) => s.id === id);
    setFormData((prev) => ({
      ...prev,
      origin_system_id: id,
      origin_system_station: sys?.defaultStation || prev.origin_system_station,
    }));
  };

  const selectDestination = (id: number) => {
    const sys = availableSystems.find((s) => s.id === id);
    setFormData((prev) => ({
      ...prev,
      destination_system_id: id,
      destination_system_station: sys?.defaultStation || prev.destination_system_station,
    }));
  };

  const handleOriginSearchChange = (val: string) => {
    setOriginSearch(val);
    const matches = availableSystems.filter(
      (s) =>
        s.name.toLowerCase().includes(val.toLowerCase()) ||
        s.region.toLowerCase().includes(val.toLowerCase())
    );
    if (matches.length === 1) {
      selectOrigin(matches[0].id);
    }
  };

  const handleDestSearchChange = (val: string) => {
    setDestSearch(val);
    const matches = availableSystems.filter(
      (s) =>
        s.name.toLowerCase().includes(val.toLowerCase()) ||
        s.region.toLowerCase().includes(val.toLowerCase())
    );
    if (matches.length === 1) {
      selectDestination(matches[0].id);
    }
  };

  const filteredOrigins = availableSystems.filter(
    (s) =>
      s.name.toLowerCase().includes(originSearch.toLowerCase()) ||
      s.region.toLowerCase().includes(originSearch.toLowerCase())
  );

  const filteredDests = availableSystems.filter(
    (s) =>
      s.name.toLowerCase().includes(destSearch.toLowerCase()) ||
      s.region.toLowerCase().includes(destSearch.toLowerCase())
  );

  const isOriginSelectedInFiltered = filteredOrigins.some(
    (s) => s.id === formData.origin_system_id
  );

  const isDestSelectedInFiltered = filteredDests.some(
    (s) => s.id === formData.destination_system_id
  );

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <FenrirModal.Body>
        {validationError && (
          <div className={styles.validationError}>
            {validationError}
          </div>
        )}

        <div className="mt-4">
          {/* Route Name */}
          <div>
            <div className="flex gap-2 items-center">
              <Form.Control
                ref={nameInputRef}
                type="text"
                required
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder={t('e.g. Jita 4-4 ⟷ 1DQ1-A Keepstar (Delve Express)')}
                className="w-full px-3 py-2 text-xs !bg-slate-900 border !border-slate-700 rounded-lg !text-slate-200 focus:outline-none focus:!border-cyan-500 font-medium"
              />
              <Button
                type="button"
                variant="outline-info"
                onClick={handleInsertArrow}
                title={t('Insert "⟷" into route name')}
                className="px-3 py-2 text-xs font-bold font-mono !bg-slate-900 hover:!bg-cyan-950/60 !text-cyan-400 border !border-slate-700 hover:!border-cyan-500 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                ⟷
              </Button>
            </div>
          </div>

          {/* Origin & Destination Grid */}
          <div className={`mt-4 grid grid-cols-1 md:grid-cols-2 gap-5`}>
            {/* Origin System */}
            <div className={`${styles.modalBody}`}>
              <Form.Label className={styles.routeLabel}>
                {t('Origin Solar System')}
              </Form.Label>
              <Form.Control
                type="text"
                placeholder={t('Filter system...')}
                value={originSearch}
                onChange={(e) => handleOriginSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredOrigins.length >= 1) {
                      selectOrigin(filteredOrigins[0].id);
                    }
                  }
                }}
                className={styles.ratesInput}
              />
              <Form.Select
                value={isOriginSelectedInFiltered ? formData.origin_system_id : ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  if (id) selectOrigin(id);
                }}
                onClick={() => {
                  if (filteredOrigins.length === 1 && formData.origin_system_id !== filteredOrigins[0].id) {
                    selectOrigin(filteredOrigins[0].id);
                  }
                }}
                className={"mt-1 " + styles.ratesSelect}
              >
                {!isOriginSelectedInFiltered && (
                  <option value="" disabled>
                    {filteredOrigins.length === 0
                      ? availableSystems.length === 0
                        ? t('-- No systems configured in Route Admin --')
                        : t('-- No systems found --')
                      : t('-- Select a system ({{count}} found) --', { count: filteredOrigins.length })}
                  </option>
                )}
                {filteredOrigins.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.region}) - Sec: {s.security.toFixed(1)}
                  </option>
                ))}
              </Form.Select>

              <div>
                <Form.Label className={"mt-3 " + styles.routeLabel}>
                  {t('Origin Station / Structure Name')}
                </Form.Label>
                <Form.Control
                  value={formData.origin_system_station}
                  onChange={(e) => updateField('origin_system_station', e.target.value)}
                  placeholder={t('e.g. Jita IV - Moon 4 - Caldari Navy Assembly Plant')}
                  className={styles.ratesInput}
                />
              </div>
            </div>

            {/* Destination System */}
            <div className={`${styles.modalBody}`}>
              <Form.Label className={styles.routeLabel}>
                {t('Destination Solar System')}
              </Form.Label>
              <Form.Control
                type="text"
                placeholder={t('Filter system...')}
                value={destSearch}
                onChange={(e) => handleDestSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredDests.length >= 1) {
                      selectDestination(filteredDests[0].id);
                    }
                  }
                }}
                className={styles.ratesInput}
              />
              <Form.Select
                value={isDestSelectedInFiltered ? formData.destination_system_id : ''}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  if (id) selectDestination(id);
                }}
                onClick={() => {
                  if (filteredDests.length === 1 && formData.destination_system_id !== filteredDests[0].id) {
                    selectDestination(filteredDests[0].id);
                  }
                }}
                className={"mt-1 " + styles.ratesSelect}
              >
                {!isDestSelectedInFiltered && (
                  <option value="" disabled>
                    {filteredDests.length === 0
                      ? availableSystems.length === 0
                        ? t('-- No systems configured in Route Admin --')
                        : t('-- No systems found --')
                      : t('-- Select a system ({{count}} found) --', { count: filteredDests.length })}
                  </option>
                )}
                {filteredDests.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.region}) - Sec: {s.security.toFixed(1)}
                  </option>
                ))}
              </Form.Select>

              <div>
                <Form.Label className={"mt-3 " + styles.routeLabel}>
                  {t('Destination Station / Structure Name')}
                </Form.Label>
                <Form.Control
                  value={formData.destination_system_station}
                  onChange={(e) => updateField('destination_system_station', e.target.value)}
                  placeholder={t('e.g. 1DQ1-A 1 - Imperial Palace Keepstar')}
                  className={styles.ratesInput}
                />
              </div>
            </div>
          </div>

          {/* Service & Tariffs Grid */}
          <div className={styles.modalBody + " mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end"}>
            <div>
              <Form.Label className={styles.routeLabel}>
                {t('Service Type')}
              </Form.Label>
              <Form.Select
                value={formData.service_type}
                onChange={(e) => updateField('service_type', e.target.value)}
                className={"mt-1 " + styles.ratesSelect}
              >
                <option value="jumpfreighter">{t('Jump Freighter (JF)')}</option>
                <option value="freighter">{t('Standard Freighter')}</option>
                <option value="deep_space_transport">{t('Deep Space Transport (DST)')}</option>
              </Form.Select>
            </div>

            <div>
              <Form.Label className={styles.routeLabel}>
                {t('Danger Rating')}
              </Form.Label>
              <Form.Select
                value={formData.danger_level}
                onChange={(e) => updateField('danger_level', e.target.value)}
                className={"mt-1 " + styles.ratesSelect}
              >
                <option value="safe">{t('Safe')}</option>
                <option value="cyno_guarded">{t('Cyno-Guarded')}</option>
              </Form.Select>
            </div>

            <div className="flex items-center pb-2">
              <label
                htmlFor="is-cyno-route-modal-chk"
                className="flex items-center gap-2 cursor-pointer m-0 select-none"
              >
                <input
                  type="checkbox"
                  id="is-cyno-route-modal-chk"
                  checked={formData.is_cyno_route}
                  onChange={(e) => updateField('is_cyno_route', e.target.checked)}
                  className="w-4 h-4 rounded !bg-slate-900 !border-slate-700 accent-cyan-500 cursor-pointer m-0"
                />
                <span className="text-xs !text-slate-300 font-medium leading-none">
                  {t('Is Cyno Pipeline Route')}
                </span>
              </label>
            </div>

            <div className="flex items-center pb-2">
              <label
                htmlFor="has-alliance-subsidy-modal-chk"
                className="flex items-center gap-2 cursor-pointer m-0 select-none"
              >
                <input
                  type="checkbox"
                  id="has-alliance-subsidy-modal-chk"
                  checked={formData.has_alliance_subsidy ?? true}
                  onChange={(e) => updateField('has_alliance_subsidy', e.target.checked)}
                  className="w-4 h-4 rounded !bg-slate-900 !border-slate-700 accent-emerald-500 cursor-pointer m-0"
                />
                <span className="text-xs !text-slate-300 font-medium leading-none">
                  {t('Alliance Subsidy Enabled')}
                </span>
              </label>
            </div>
          </div>

          {/* Cyno Waypoint Manager (if Cyno Route enabled) */}
          {formData.is_cyno_route && (
            <CynoWaypointManager
              waypoints={waypointSystems}
              onChange={setWaypointSystems}
              availableSystems={availableSystems}
              originSystemName={availableSystems.find((s) => s.id === formData.origin_system_id)?.name}
              destinationSystemName={availableSystems.find((s) => s.id === formData.destination_system_id)?.name}
            />
          )}

          {/* Rates Breakdown */}
          <div className={`${styles.modalBody} mt-4 grid grid-cols-2 gap-2`} >
            <div>
              <Form.Label className={styles.ratesBreakdownLabel}>
                {t('Max Volume (m³)')}
              </Form.Label>
              <Form.Control
                type="number"
                value={formData.max_volume}
                onChange={(e) => updateField('max_volume', Number(e.target.value))}
                className={styles.ratesInput}
              />
            </div>

            <div>
              <Form.Label className={styles.ratesBreakdownLabel}>
                {t('Max Collateral (ISK)')}
              </Form.Label>
              <Form.Control
                type="number"
                value={formData.max_collateral}
                onChange={(e) => updateField('max_collateral', Number(e.target.value))}
                className={styles.ratesInput}
              />
            </div>

            <div>
              <Form.Label className={styles.ratesBreakdownLabel}>
                {t('Base Booking Fee (ISK)')}
              </Form.Label>
              <Form.Control
                type="number"
                value={formData.base_fee}
                onChange={(e) => updateField('base_fee', Number(e.target.value))}
                className={styles.ratesInput}
              />
            </div>

            <div>
              <Form.Label className={styles.ratesBreakdownLabel}>
                {t('Fee per m³ (ISK)')}
              </Form.Label>
              <Form.Control
                type="number"
                value={formData.fee_per_m3}
                onChange={(e) => updateField('fee_per_m3', Number(e.target.value))}
                className={styles.ratesInput}
              />
            </div>

            <div>
              <Form.Label className={styles.ratesBreakdownLabel}>
                {t('Fee per Light-Year (ISK)')}
              </Form.Label>
              <Form.Control
                type="number"
                value={formData.fee_per_ly}
                onChange={(e) => updateField('fee_per_ly', Number(e.target.value))}
                className={styles.ratesInput}
              />
            </div>

            <div>
              <Form.Label className={styles.ratesBreakdownLabel}>
                {t('Collateral Insurance (%)')}
              </Form.Label>
              <Form.Control
                type="number"
                step="0.1"
                value={formData.collateral_percent}
                onChange={(e) => updateField('collateral_percent', Number(e.target.value))}
                className={styles.ratesInput}
              />
            </div>

            <div>
              <Form.Label className={styles.ratesBreakdownLabel}>
                {t('Min Reward (ISK)')}
              </Form.Label>
              <Form.Control
                type="number"
                value={formData.min_reward}
                onChange={(e) => updateField('min_reward', Number(e.target.value))}
                className={styles.ratesInput}
              />
            </div>

            <div>
              <Form.Label className={styles.ratesBreakdownLabel}>
                {t('Estimated Time (Mins)')}
              </Form.Label>
              <Form.Control
                type="number"
                value={formData.estimated_time}
                onChange={(e) => updateField('estimated_time', Number(e.target.value))}
                className={styles.ratesInput}
              />
            </div>
          </div>
        </div>
      </FenrirModal.Body>

      <FenrirModal.Footer>
        <div className="flex justify-end gap-3 w-full">
          <Button
            variant="primary"
            onClick={onClose}
            className="text-xs font-semibold"
          >
            {t('Cancel')}
          </Button>
          <Button
            type="button"
            onClick={() => handleSubmit()}
            variant="success"
            disabled={isPending}
            className="text-xs font-semibold"
          >
            {isPending ? t('Saving...') : t('Save Route Preset')}
          </Button>
        </div>
      </FenrirModal.Footer>
    </form>
  );
}

/**
 * Modal dialog for creating a new freight corridor / route preset.
 * Belongs to the RouteAdmin page (`src/Pages/RouteAdmin.tsx`).
 * Uses React key mounting lifecycle to automatically reset form state on exit.
 */
export function CreateRouteModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: CreateRouteModalProps) {
  const { t } = useTranslation();
  const [formKey, setFormKey] = useState(0);

  return (
    <FenrirModal
      isOpen={isOpen}
      onClose={onClose}
      onExited={() => setFormKey((k) => k + 1)}
      size="xl"
    >
      <FenrirModal.Header>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg !bg-cyan-950/60 border !border-cyan-500/40 !text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <FenrirModal.Title>{t('CREATE NEW ROUTE PRESET')}</FenrirModal.Title>
            <p className="text-[11px] !text-slate-400 font-mono m-0">
              {t('Configure freight corridor details, service tariffs, and collateral limits.')}
            </p>
          </div>
        </div>
      </FenrirModal.Header>

      <CreateRouteForm
        key={formKey}
        onClose={onClose}
        onSubmit={onSubmit}
        isPending={isPending}
      />
    </FenrirModal>
  );
}

