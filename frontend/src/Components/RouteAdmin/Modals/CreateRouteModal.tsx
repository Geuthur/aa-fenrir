// React
import { useEffect, useState } from 'react';

// Third Party
import { Sparkles } from 'lucide-react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import type { components } from '@/Api/OpenApi';
import { BaseModal } from '@/Components/Base/BaseModal';
import { ModalTitle } from '@/Components/Base/ModalTitle';
import type { CynoWaypointItem } from '@/Components/RouteAdmin/CynoWaypointManager';
import { useRouteFormOptions } from '@/Components/RouteAdmin/Hooks';
import { RouteForm } from '@/Components/RouteAdmin/RouteForm';

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
  assign_corp_id: null,
  expiration_days: 7,
  days_to_complete: 3,
};

/**
 * Modal content with the form state for creating a route preset.
 * Mounted with a key by `CreateRouteModal`, so the state resets after the modal closed.
 */
function CreateRouteModalContent({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  onExited,
}: CreateRouteModalProps & { onExited: () => void }) {
  const { t } = useTranslation();
  const { availableSystems, contractHandlers } = useRouteFormOptions();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [waypointSystems, setWaypointSystems] = useState<CynoWaypointItem[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

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

  const handleSubmit = () => {
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

  return (
    <BaseModal
      show={isOpen}
      onHide={onClose}
      onExited={onExited}
      size="xl"
      title={
        <ModalTitle
          icon={<Sparkles size={20} />}
          title={t('CREATE NEW ROUTE PRESET')}
          subtitle={t('Configure freight corridor details, service tariffs, and collateral limits.')}
        />
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="button" variant="success" onClick={handleSubmit} disabled={isPending}>
            {isPending ? t('Saving...') : t('Save Route Preset')}
          </Button>
        </>
      }
    >
      <RouteForm
        formData={formData}
        setFormData={setFormData}
        waypoints={waypointSystems}
        onWaypointsChange={setWaypointSystems}
        availableSystems={availableSystems}
        contractHandlers={contractHandlers}
        validationError={validationError}
        idPrefix="create-route"
      />
    </BaseModal>
  );
}

/**
 * Modal dialog for creating a new freight corridor / route preset.
 * Belongs to the RouteAdmin page (`src/Pages/RouteAdmin.tsx`).
 * Uses React key mounting lifecycle to automatically reset form state on exit.
 */
export function CreateRouteModal(props: CreateRouteModalProps) {
  const [formKey, setFormKey] = useState(0);

  return (
    <CreateRouteModalContent key={formKey} {...props} onExited={() => setFormKey((k) => k + 1)} />
  );
}
