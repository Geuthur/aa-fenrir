// Third Party
import { Navigation, Pencil, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// Styles
import styles from '@/Components/RouteAdmin/RouteCard.module.css';

import {
  formatIskCompact,
  formatM3,
} from '@/Components/Calculator/calculator';
import { ServiceBadge } from '@/Components/Calculator/ServiceBadge';
import type { FreightCorridor } from '@/types';

export interface RouteCardProps {
  /** The freight route preset data */
  preset: FreightCorridor;
  /** Callback when user clicks the edit button */
  onEditClick: (preset: FreightCorridor) => void;
  /** Callback when user clicks the delete button */
  onDeleteClick: (preset: FreightCorridor) => void;
  /** Whether a deletion request is currently pending */
  isDeletePending: boolean;
}

/**
 * Card displaying an individual route corridor, its tariff breakdown, and edit/delete actions.
 * Belongs to `src/Pages/RouteAdmin.tsx`.
 */
export function RouteCard({
  preset,
  onEditClick,
  onDeleteClick,
  isDeletePending,
}: RouteCardProps) {
  const { t } = useTranslation();

  const isCynoGuarded = Boolean(
    preset.is_cyno_route ||
      (preset.danger_level &&
        ['cyno_guarded', 'cyno guarded', 'cyno-guarded'].includes(
          preset.danger_level.toLowerCase().trim()
        ))
  );

  const isSafe = Boolean(
    preset.danger_level &&
      preset.danger_level.toLowerCase().trim() === 'safe'
  );

  return (
    <div className={`${styles.routeCard} fenrir-gradient fenrir-border-500`}>
      <div>
        <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
          <h3 className={`font-eve fw-bold text-white ${styles.name}`}>{preset.name}</h3>
          <ServiceBadge serviceType={preset.service_type} />
        </div>

        <div className={`mb-3 ${styles.route}`}>
          <span className={styles.origin}>{preset.origin_system}</span>
          <span>➔</span>
          <span className={styles.destination}>{preset.destination_system}</span>
        </div>

        <div className={`gap-2 p-3 border ${styles.stats}`}>
          <div>
            <span className={`text-uppercase d-block ${styles.statLabel}`}>{t('Base Fee')}</span>
            <span className="text-white fw-bold">{formatIskCompact(preset.base_fee)}</span>
          </div>
          <div>
            <span className={`text-uppercase d-block ${styles.statLabel}`}>{t('Volume Rate')}</span>
            <span className={`fw-bold ${styles.valueCyan}`}>{preset.fee_per_m3} ISK/m³</span>
          </div>
          <div>
            <span className={`text-uppercase d-block ${styles.statLabel}`}>{t('Max Volume')}</span>
            <span className={styles.valueSlate}>{formatM3(preset.max_volume)}</span>
          </div>
          <div>
            <span className={`text-uppercase d-block ${styles.statLabel}`}>{t('Insurance')}</span>
            <span className={`fw-bold ${styles.valueAmber}`}>
              {(preset.collateral_percent * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      <div className={`d-flex align-items-center justify-content-between pt-3 ${styles.footer}`}>
        <div className={`d-flex align-items-center ${styles.danger}`}>
          <span className={styles.dangerLabel}>{t('Danger:')}</span>
          {isCynoGuarded ? (
            <span className={`d-flex align-items-center gap-1 fw-semibold ${styles.statusOk}`}>
              <Navigation className={`flex-shrink-0 ${styles.icon}`} />
              <span>{t('Cyno-Guarded')}</span>
            </span>
          ) : isSafe ? (
            <span className={`d-flex align-items-center gap-1 fw-semibold ${styles.statusOk}`}>
              <ShieldCheck className={`flex-shrink-0 ${styles.icon}`} />
              <span>{t('Safe')}</span>
            </span>
          ) : (
            <span className={`d-flex align-items-center gap-1 fw-semibold ${styles.statusWarn}`}>
              <ShieldAlert className={`flex-shrink-0 ${styles.icon}`} />
              <span>{preset.danger_level || t('Low/Null Transit')}</span>
            </span>
          )}
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button
            onClick={() => onEditClick(preset)}
            className={`d-flex align-items-center gap-1 py-1 rounded border ${styles.editButton}`}
          >
            <Pencil className={styles.icon} />
            <span>{t('Edit')}</span>
          </Button>
          <Button
            onClick={() => onDeleteClick(preset)}
            disabled={isDeletePending}
            className={styles.deleteButton}
          >
            <Trash2 className={styles.icon} />
            <span>{t('Delete')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
