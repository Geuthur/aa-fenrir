// React
import styles from '@/Components/RouteAdmin/RouteAdminHeader.module.css';

// Third Party
import { Compass, PlusCircle, Route as RouteIcon } from 'lucide-react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

export interface RouteAdminHeaderProps {
  /** Callback triggered when clicking the "Create New Route" button */
  onCreateClick: () => void;
  /** Callback triggered when clicking the "Add System" button */
  onAddSystemClick?: () => void;
}

/**
 * Top banner header for the RouteAdmin management view.
 * Belongs to `src/Pages/RouteAdmin.tsx`.
 */
export function RouteAdminHeader({ onCreateClick, onAddSystemClick }: RouteAdminHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className={styles.routeAdminHeader + " fenrir-gradient fenrir-border-500"}>
      <div>
        <div className="flex items-center gap-2">
          <RouteIcon className="w-6 h-6 !text-cyan-400" />
          <h1 className="font-eve font-bold text-2xl !text-white tracking-wide">
            {t('ROUTE & SYSTEM MANAGEMENT')}
          </h1>
        </div>
        <p className="text-xs !text-slate-400 mt-1">
          {t('Configure available solar systems, corridors, and tariffs for courier services.')}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        {onAddSystemClick && (
          <Button
            onClick={onAddSystemClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg !bg-slate-900 border !border-slate-700 hover:!bg-slate-800 hover:!border-cyan-500/50 !text-cyan-300 text-xs font-semibold transition-all cursor-pointer shadow"
          >
            <Compass className="w-4 h-4" />
            <span>{t('Add System')}</span>
          </Button>
        )}

        <Button
          onClick={onCreateClick}
          className={styles.createNewRoute}
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('Create New Route')}</span>
        </Button>
      </div>
    </div>
  );
}
