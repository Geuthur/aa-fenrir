// React
import { useEffect, useMemo, useState } from 'react';

// Third Party
import { BaseModal } from "aa-geuthur-react";
import { Pencil } from 'lucide-react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import type { components } from '@/Api/OpenApi';
import { ModalTitle } from '@/Components/Base/ModalTitle';
import { collateralFractionToPercent, normalizeDangerLevel } from '@/Components/Calculator/calculator';
import type { CynoWaypointItem } from '@/Components/RouteAdmin/CynoWaypointManager';
import { useRouteFormOptions } from '@/Components/RouteAdmin/Hooks';
import { RouteForm } from '@/Components/RouteAdmin/RouteForm';
import type { FreightCorridor } from '@/types';

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

/** Modal content with the form state for editing an existing route preset. */
function EditRouteModalContent({
  preset,
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: EditRouteModalProps & { preset: FreightCorridor }) {
  const { t } = useTranslation();
  const { availableSystems, contractHandlers } = useRouteFormOptions();
  const [validationError, setValidationError] = useState<string | null>(null);

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
    collateral_percent: collateralFractionToPercent(Number(preset.collateral_percent || 0)),
    min_reward: Number(preset.min_reward || 0),
    estimated_time: Number(
      preset.estimated_time || (preset.estimated_days ? Math.round(preset.estimated_days * 24 * 60) : 0)
    ),
    is_cyno_route: Boolean(preset.is_cyno_route),
    cyno_waypoint_ids: preset.cyno_waypoint_ids || [],
    danger_level: normalizeDangerLevel(preset.danger_level),
    has_alliance_subsidy: preset.has_alliance_subsidy !== false,
    assign_corp_id: preset.assign_corp_id || null,
    expiration_days: preset.expiration_days ?? 7,
    days_to_complete: preset.days_to_complete ?? 3,
  });

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

  const handleSubmit = () => {
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
      // The update endpoint only removes the corporation on 0, null keeps it
      assign_corp_id: formData.assign_corp_id ?? 0,
      cyno_waypoint_ids: formData.is_cyno_route ? waypointSystems.map((w) => w.id) : [],
    });
  };

  return (
    <BaseModal
      show={isOpen}
      onHide={onClose}
      title={
        <ModalTitle
          icon={<Pencil size={20} />}
          title={t('EDIT ROUTE PRESET')}
          subtitle={t('Update freight corridor details, service tariffs, and collateral limits.')}
        />
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="button" variant="success" onClick={handleSubmit} disabled={isPending}>
            {isPending ? t('Saving...') : t('Update Route Preset')}
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
        idPrefix="edit-route"
        collateralStep="0.1"
      />
    </BaseModal>
  );
}

/**
 * Modal dialog for editing an existing freight corridor / route preset.
 * Belongs to the RouteAdmin page (`src/Pages/RouteAdmin.tsx`).
 */
export function EditRouteModal(props: EditRouteModalProps) {
  const { preset } = props;
  // Keep the last preset so the modal content stays during the fade-out animation
  const [lastPreset, setLastPreset] = useState<FreightCorridor | null>(preset);
  if (preset && preset !== lastPreset) {
    setLastPreset(preset);
  }

  if (!lastPreset) {
    return null;
  }

  return <EditRouteModalContent key={String(lastPreset.id)} {...props} preset={lastPreset} />;
}
