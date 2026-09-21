// React
import { useEffect, useMemo, useRef, useState } from 'react';

// Third Party
import { useQuery } from '@tanstack/react-query';
import { Pencil, Shield } from 'lucide-react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// Styles
import styles from '@/Components/RouteAdmin/Modals/CreateRouteModal.module.css';

import { loadContractHandlers, loadRouteSystems } from '@/Api/ApiCalls';
import type { components } from '@/Api/OpenApi';
import { queryKeys } from '@/Api/query';
import { FenrirModal } from '@/Components/Modals';
import { CynoWaypointManager, type CynoWaypointItem } from '@/Components/RouteAdmin/CynoWaypointManager';
import type { EveSolarSystem, FreightCorridor, SecurityClass } from '@/types';

export interface EditRouteModalProps {
  /** The preset to edit, or null if modal is closed */
  preset: FreightCorridor | null;
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback to submit the updated route preset data */
  onSubmit: (data: components['schemas']['CreateRoutePresetSchema']) => void;
  /** Whether the update request is currently pending */
  isPending: boolean;
}

/**
 * Inner form component for editing an existing route preset.
 */
function EditRouteForm({
  preset,
  onClose,
  onSubmit,
  isPending,
}: {
  preset: FreightCorridor;
  onClose: () => void;
  onSubmit: (data: components['schemas']['CreateRoutePresetSchema']) => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();

  const normalizedServiceType = (preset.service_type === 'jump_freighter'
    ? 'jumpfreighter'
    : preset.service_type === 'standard_freighter'
    ? 'freighter'
    : preset.service_type) as components['schemas']['CreateRoutePresetSchema']['service_type'];

  const [formData, setFormData] = useState<components['schemas']['CreateRoutePresetSchema']>({
    name: preset.name || '',
    origin_system_id: Number(preset.origin_system_id || 0),
    origin_system_station: preset.origin_station || '',
    destination_system_id: Number(preset.destination_system_id || 0),
    destination_system_station: preset.destination_station || '',
    service_type: normalizedServiceType,
    max_volume: Number(preset.max_volume || 0),
    max_collateral: Number(preset.max_collateral || 0),
    base_fee: Number(preset.base_fee || 0),
    fee_per_m3: Number(preset.fee_per_m3 || 0),
    fee_per_ly: Number(preset.fee_per_ly || 0),
    collateral_percent:
      preset.collateral_percent < 1
        ? preset.collateral_percent * 100
        : Number(preset.collateral_percent || 0),
    min_reward: Number(preset.min_reward || 0),
    estimated_time: Number(
      preset.estimated_time || (preset.estimated_days ? Math.round(preset.estimated_days * 24 * 60) : 0)
    ),
    is_cyno_route: Boolean(preset.is_cyno_route),
    cyno_waypoint_ids: preset.cyno_waypoint_ids || [],
    danger_level: preset.danger_level || 'safe',
    has_alliance_subsidy: preset.has_alliance_subsidy !== false,
    assign_corp_id: preset.assign_corp_id || null,
    expiration_days: preset.expiration_days ?? 7,
    days_to_complete: preset.days_to_complete ?? 3,
  });

  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch configured RouteSystems from backend
  const { data: routeSystems = [] } = useQuery({
    queryKey: queryKeys.RouteSystems,
    queryFn: loadRouteSystems,
    refetchOnWindowFocus: false,
  });

  // Fetch available ContractHandlers from backend
  const { data: contractHandlers = [] } = useQuery({
    queryKey: queryKeys.ContractHandlers,
    queryFn: loadContractHandlers,
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

  const initialWaypoints: CynoWaypointItem[] = useMemo(() => {
    if (!preset.cyno_waypoint_ids || preset.cyno_waypoint_ids.length === 0) {
      return [];
    }
    return preset.cyno_waypoint_ids.map((id, index) => {
      const fromAvailable = availableSystems.find((s) => s.id === id);
      if (fromAvailable) {
        return {
          id: fromAvailable.id,
          name: fromAvailable.name,
          security: fromAvailable.security,
          region: fromAvailable.region,
        };
      }
      const name = preset.cyno_waypoints?.[index] || `System #${id}`;
      return {
        id,
        name,
      };
    });
  }, [preset.cyno_waypoint_ids, preset.cyno_waypoints, availableSystems]);

  const [waypointSystems, setWaypointSystems] = useState<CynoWaypointItem[]>(initialWaypoints);

  // Enhance waypoint items when availableSystems loads
  useEffect(() => {
    if (availableSystems.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWaypointSystems((prev) =>
        prev.map((wp) => {
          if (wp.security !== undefined && wp.region !== undefined) return wp;
          const match = availableSystems.find((s) => s.id === wp.id);
          if (match) {
            return {
              ...wp,
              name: match.name || wp.name,
              security: match.security,
              region: match.region,
            };
          }
          return wp;
        })
      );
    }
  }, [availableSystems]);

  // If origin/destination IDs are missing in preset but names exist, resolve them from availableSystems
  useEffect(() => {
    if (availableSystems.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData((prev) => {
        let updated = false;
        let oId = prev.origin_system_id;
        let dId = prev.destination_system_id;

        if (!oId && preset.origin_system) {
          const match = availableSystems.find(
            (s) => s.name.toLowerCase() === preset.origin_system.toLowerCase()
          );
          if (match) {
            oId = match.id;
            updated = true;
          }
        }
        if (!dId && preset.destination_system) {
          const match = availableSystems.find(
            (s) => s.name.toLowerCase() === preset.destination_system.toLowerCase()
          );
          if (match) {
            dId = match.id;
            updated = true;
          }
        }

        if (updated) {
          return {
            ...prev,
            origin_system_id: oId,
            destination_system_id: dId,
          };
        }
        return prev;
      });
    }
  }, [availableSystems, preset.origin_system, preset.destination_system]);

  const updateField = <K extends keyof components['schemas']['CreateRoutePresetSchema']>(
    field: K,
    value: components['schemas']['CreateRoutePresetSchema'][K]
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
      setValidationError(t('Origin and destination systems are required.'));
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
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Origin System */}
            <div className={styles.modalBody}>
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
            <div className={styles.modalBody}>
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
                htmlFor="is-cyno-route-edit-chk"
                className="flex items-center gap-2 cursor-pointer m-0 select-none"
              >
                <input
                  type="checkbox"
                  id="is-cyno-route-edit-chk"
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
                htmlFor="has-alliance-subsidy-edit-chk"
                className="flex items-center gap-2 cursor-pointer m-0 select-none"
              >
                <input
                  type="checkbox"
                  id="has-alliance-subsidy-edit-chk"
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
          <div className={`${styles.modalBody} mt-4 grid grid-cols-2 gap-2`}>
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

          {/* EVE Contract Assistant Settings */}
          <div className="mt-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider m-0">
                {t('In-Game Contract Assistant Settings')}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Form.Label className={styles.ratesBreakdownLabel}>
                  {t('Assign To Corporation')}
                </Form.Label>
                <Form.Select
                  value={formData.assign_corp_id || ''}
                  onChange={(e) =>
                    updateField(
                      'assign_corp_id',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className={styles.ratesInput}
                >
                  <option value="">{t('-- Default / None --')}</option>
                  {contractHandlers.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div>
                <Form.Label className={styles.ratesBreakdownLabel}>
                  {t('Contract Expiration (Days)')}
                </Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="28"
                  value={formData.expiration_days ?? 7}
                  onChange={(e) =>
                    updateField('expiration_days', Number(e.target.value))
                  }
                  className={styles.ratesInput}
                />
              </div>

              <div>
                <Form.Label className={styles.ratesBreakdownLabel}>
                  {t('Days to Complete')}
                </Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  max="14"
                  value={formData.days_to_complete ?? 3}
                  onChange={(e) =>
                    updateField('days_to_complete', Number(e.target.value))
                  }
                  className={styles.ratesInput}
                />
              </div>
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
            {isPending ? t('Saving...') : t('Update Route Preset')}
          </Button>
        </div>
      </FenrirModal.Footer>
    </form>
  );
}

/**
 * Modal dialog for editing an existing freight corridor / route preset.
 * Belongs to the RouteAdmin page (`src/Pages/RouteAdmin.tsx`).
 */
export function EditRouteModal({
  preset,
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: EditRouteModalProps) {
  const { t } = useTranslation();

  return (
    <FenrirModal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      <FenrirModal.Header>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg !bg-cyan-950/60 border !border-cyan-500/40 !text-cyan-400">
            <Pencil className="w-5 h-5" />
          </div>
          <div>
            <FenrirModal.Title>{t('EDIT ROUTE PRESET')}</FenrirModal.Title>
            <p className="text-[11px] !text-slate-400 font-mono m-0">
              {t('Update freight corridor details, service tariffs, and collateral limits.')}
            </p>
          </div>
        </div>
      </FenrirModal.Header>

      {preset && (
        <EditRouteForm
          key={String(preset.id)}
          preset={preset}
          onClose={onClose}
          onSubmit={onSubmit}
          isPending={isPending}
        />
      )}
    </FenrirModal>
  );
}
