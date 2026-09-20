// React
import styles from '@/Components/RouteAdmin/RouteCard.module.css';
// Third Party
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from 'react-bootstrap';

import {
  formatIskCompact,
  formatM3,
  getServiceBadge,
} from '@/Components/Calculator/calculator';
import type { FreightCorridor } from '@/types';

export interface RouteCardProps {
  /** The freight route preset data */
  preset: FreightCorridor;
  /** Callback when user clicks the delete button */
  onDeleteClick: (preset: FreightCorridor) => void;
  /** Whether a deletion request is currently pending */
  isDeletePending: boolean;
}

/**
 * Card displaying an individual route corridor, its tariff breakdown, and delete action.
 * Belongs to `src/Pages/RouteAdmin.tsx`.
 */
export function RouteCard({
  preset,
  onDeleteClick,
  isDeletePending,
}: RouteCardProps) {
  const { t } = useTranslation();
  const badge = getServiceBadge(preset.service_type);

  return (
    <div className={styles.routeCard + " fenrir-gradient fenrir-border-500"}  >
      <div>
        <div className={styles.routeLabel + "  mb-2"}>
          <h3 className="font-eve font-bold text-base !text-white">{preset.name}</h3>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badge.color}`}>
            {badge.label}
          </span>
        </div>

        <div className="text-xs !text-slate-400 flex items-center gap-1.5 mb-3 font-mono">
          <span className="!text-cyan-400">{preset.origin_system}</span>
          <span>➔</span>
          <span className="!text-indigo-400">{preset.destination_system}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono !bg-slate-900/60 p-3 rounded-lg border !border-slate-800/80">
          <div>
            <span className="text-[10px] !text-slate-500 uppercase block">{t('Base Fee')}</span>
            <span className="!text-white font-bold">{formatIskCompact(preset.base_fee)}</span>
          </div>
          <div>
            <span className="text-[10px] !text-slate-500 uppercase block">{t('Volume Rate')}</span>
            <span className="!text-cyan-300 font-bold">{preset.fee_per_m3} ISK/m³</span>
          </div>
          <div>
            <span className="text-[10px] !text-slate-500 uppercase block">{t('Max Volume')}</span>
            <span className="!text-slate-300">{formatM3(preset.max_volume)}</span>
          </div>
          <div>
            <span className="text-[10px] !text-slate-500 uppercase block">{t('Insurance')}</span>
            <span className="!text-amber-300 font-bold">
              {(preset.collateral_percent * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t !border-slate-300/60 text-xs">
        <span className="text-[11px] font-mono !text-slate-400">
          {t('Danger:')} <span className="!text-slate-200">{preset.danger_level}</span>
        </span>
        <Button
          onClick={() => onDeleteClick(preset)}
          disabled={isDeletePending}
          className={styles.deleteButton}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{t('Delete')}</span>
        </Button>
      </div>
    </div>
  );
};
