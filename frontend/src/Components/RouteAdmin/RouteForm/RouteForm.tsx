// React
import { useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';

// Third Party
import { Shield } from 'lucide-react';
import { Alert, Button, Form, InputGroup } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import type { components } from '@/Api/OpenApi';
import { formatDuration, formatIskExact, formatM3 } from '@/Components/Calculator/calculator';
import { CynoWaypointManager, type CynoWaypointItem } from '@/Components/RouteAdmin/CynoWaypointManager';
import { RouteNumberField } from '@/Components/RouteAdmin/RouteForm/RouteNumberField';
import { RouteSystemPicker } from '@/Components/RouteAdmin/RouteForm/RouteSystemPicker';
import type { EveSolarSystem } from '@/types';

export type RouteFormData = components['schemas']['CreateRoutePresetSchema'];
type ContractHandler = { id: number; name: string };

/** Largest value the model field `collateral_percent` can store. */
const MAX_COLLATERAL_PERCENT = 9.9999;

export interface RouteFormProps {
  /** Current form values */
  formData: RouteFormData;
  /** State setter of the form values */
  setFormData: Dispatch<SetStateAction<RouteFormData>>;
  /** Cyno waypoints of the route */
  waypoints: CynoWaypointItem[];
  /** Callback when the waypoints change */
  onWaypointsChange: (waypoints: CynoWaypointItem[]) => void;
  /** Systems that can be selected as origin, destination or waypoint */
  availableSystems: EveSolarSystem[];
  /** Contract handlers that can be assigned */
  contractHandlers: ContractHandler[];
  /** Validation message shown above the form */
  validationError?: string | null;
  /** Prefix for element ids, so several forms never share ids */
  idPrefix: string;
  /** Step of the collateral percent input */
  collateralStep?: string;
}

/**
 * Shared form fields of the create and edit route preset modals.
 * State lives in the modal so that the footer buttons can submit it.
 */
export function RouteForm({
  formData,
  setFormData,
  waypoints,
  onWaypointsChange,
  availableSystems,
  contractHandlers,
  validationError,
  idPrefix,
  collateralStep = '0.01',
}: RouteFormProps) {
  const { t } = useTranslation();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof RouteFormData>(field: K, value: RouteFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectSystem = (side: 'origin' | 'destination', id: number) => {
    const sys = availableSystems.find((s) => s.id === id);
    setFormData((prev) => ({
      ...prev,
      [`${side}_system_id`]: id,
      [`${side}_system_station`]: sys?.defaultStation || prev[`${side}_system_station`],
    }));
  };

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

    updateField('name', before + symbolToInsert + after);

    setTimeout(() => {
      input.focus();
      const newPos = start + symbolToInsert.length;
      input.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      {validationError && <Alert variant="danger" className="small">{validationError}</Alert>}

      {/* Route Name */}
      <InputGroup className="mb-3">
        <Form.Control
          ref={nameInputRef}
          type="text"
          required
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder={t('e.g. Jita 4-4 ⟷ 1DQ1-A Keepstar (Delve Express)')}
        />
        <Button
          type="button"
          variant="outline-info"
          onClick={handleInsertArrow}
          title={t('Insert "⟷" into route name')}
          className="fw-bold font-monospace"
        >
          ⟷
        </Button>
      </InputGroup>

      {/* Origin & Destination */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-6">
          <RouteSystemPicker
            label={t('Origin Solar System')}
            stationLabel={t('Origin Station / Structure Name')}
            stationPlaceholder={t('e.g. Jita IV - Moon 4 - Caldari Navy Assembly Plant')}
            systems={availableSystems}
            selectedId={formData.origin_system_id}
            onSelect={(id) => selectSystem('origin', id)}
            station={formData.origin_system_station ?? ''}
            onStationChange={(value) => updateField('origin_system_station', value)}
          />
        </div>
        <div className="col-12 col-lg-6">
          <RouteSystemPicker
            label={t('Destination Solar System')}
            stationLabel={t('Destination Station / Structure Name')}
            stationPlaceholder={t('e.g. 1DQ1-A 1 - Imperial Palace Keepstar')}
            systems={availableSystems}
            selectedId={formData.destination_system_id}
            onSelect={(id) => selectSystem('destination', id)}
            station={formData.destination_system_station ?? ''}
            onStationChange={(value) => updateField('destination_system_station', value)}
          />
        </div>
      </div>

      {/* Service & Flags */}
      <div className="aa-modal-card mb-3">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-sm-6 col-lg-3">
            <Form.Label>{t('Service Type')}</Form.Label>
            <Form.Select
              value={formData.service_type}
              onChange={(e) => updateField('service_type', e.target.value as RouteFormData['service_type'])}
            >
              <option value="jumpfreighter">{t('Jump Freighter (JF)')}</option>
              <option value="freighter">{t('Standard Freighter')}</option>
              <option value="deep_space_transport">{t('Deep Space Transport (DST)')}</option>
            </Form.Select>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <Form.Label>{t('Danger Rating')}</Form.Label>
            <Form.Select
              value={formData.danger_level}
              onChange={(e) => updateField('danger_level', e.target.value as RouteFormData['danger_level'])}
            >
              <option value="safe">{t('Safe')}</option>
              <option value="cyno_guarded">{t('Cyno-Guarded')}</option>
            </Form.Select>
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <Form.Check
              type="switch"
              id={`${idPrefix}-is-cyno-route`}
              label={t('Is Cyno Pipeline Route')}
              checked={formData.is_cyno_route}
              onChange={(e) => updateField('is_cyno_route', e.target.checked)}
            />
          </div>
          <div className="col-12 col-sm-6 col-lg-3">
            <Form.Check
              type="switch"
              id={`${idPrefix}-has-alliance-subsidy`}
              label={t('Alliance Subsidy Enabled')}
              checked={formData.has_alliance_subsidy ?? true}
              onChange={(e) => updateField('has_alliance_subsidy', e.target.checked)}
            />
          </div>
        </div>
      </div>

      {/* Cyno Waypoint Manager (if Cyno Route enabled) */}
      {formData.is_cyno_route && (
        <CynoWaypointManager
          waypoints={waypoints}
          onChange={onWaypointsChange}
          availableSystems={availableSystems}
          originSystemName={availableSystems.find((s) => s.id === formData.origin_system_id)?.name}
          destinationSystemName={availableSystems.find((s) => s.id === formData.destination_system_id)?.name}
        />
      )}

      {/* Rates Breakdown */}
      <div className="aa-modal-card mb-3">
        <div className="row g-3">
          <div className="col-6 col-lg-3">
            <RouteNumberField label={t('Max Volume (m³)')} value={formData.max_volume} hint={formatM3(formData.max_volume)} hintClassName="text-info" onChange={(v) => updateField('max_volume', v)} />
          </div>
          <div className="col-6 col-lg-3">
            <RouteNumberField label={t('Max Collateral (ISK)')} value={formData.max_collateral} hint={formatIskExact(formData.max_collateral)} onChange={(v) => updateField('max_collateral', v)} />
          </div>
          <div className="col-6 col-lg-3">
            <RouteNumberField label={t('Base Booking Fee (ISK)')} value={formData.base_fee} hint={formatIskExact(formData.base_fee)} onChange={(v) => updateField('base_fee', v)} />
          </div>
          <div className="col-6 col-lg-3">
            <RouteNumberField label={t('Fee per m³ (ISK)')} value={formData.fee_per_m3} hint={formatIskExact(formData.fee_per_m3)} onChange={(v) => updateField('fee_per_m3', v)} />
          </div>
          <div className="col-6 col-lg-3">
            <RouteNumberField label={t('Fee per Light-Year (ISK)')} value={formData.fee_per_ly} hint={formatIskExact(formData.fee_per_ly)} onChange={(v) => updateField('fee_per_ly', v)} />
          </div>
          <div className="col-6 col-lg-3">
            <RouteNumberField
              label={t('Collateral Insurance (%)')}
              step={collateralStep}
              value={formData.collateral_percent}
              hint={`${formData.collateral_percent}%`}
              hintClassName="text-info"
              max={String(MAX_COLLATERAL_PERCENT)}
              onChange={(v) => updateField('collateral_percent', Math.min(v, MAX_COLLATERAL_PERCENT))}
            />
          </div>
          <div className="col-6 col-lg-3">
            <RouteNumberField label={t('Min Reward (ISK)')} value={formData.min_reward} hint={formatIskExact(formData.min_reward)} onChange={(v) => updateField('min_reward', v)} />
          </div>
          <div className="col-6 col-lg-3">
            <RouteNumberField label={t('Estimated Time (Mins)')} value={formData.estimated_time} hint={formatDuration(formData.estimated_time)} hintClassName="text-info" onChange={(v) => updateField('estimated_time', v)} />
          </div>
        </div>
      </div>

      {/* EVE Contract Assistant Settings */}
      <div className="aa-modal-card aa-modal-card-accent">
        <h3 className="aa-modal-section-title mb-3">
          <Shield size={16} className="text-info" />
          {t('In-Game Contract Assistant Settings')}
        </h3>

        <div className="row g-3">
          <div className="col-12 col-sm-4">
            <Form.Label>{t('Assign To Corporation')}</Form.Label>
            <Form.Select
              value={formData.assign_corp_id || ''}
              onChange={(e) => updateField('assign_corp_id', e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">{t('-- Default / None --')}</option>
              {contractHandlers.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </Form.Select>
          </div>
          <div className="col-12 col-sm-4">
            <RouteNumberField
              label={t('Contract Expiration (Days)')}
              min="1"
              max="28"
              value={formData.expiration_days ?? 7}
              onChange={(v) => updateField('expiration_days', v)}
            />
          </div>
          <div className="col-12 col-sm-4">
            <RouteNumberField
              label={t('Days to Complete')}
              min="1"
              max="14"
              value={formData.days_to_complete ?? 3}
              onChange={(v) => updateField('days_to_complete', v)}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

export default RouteForm;
