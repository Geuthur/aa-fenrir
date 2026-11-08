// Third Party
import { Compass, PlusCircle, Route as RouteIcon } from 'lucide-react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// Styles
import styles from '@/Components/RouteAdmin/RouteAdminHeader.module.css';

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
    <div className={styles.routeAdminHeader + " my-4 fenrir-gradient fenrir-border-500"}>
      <div>
        <div className="d-flex align-items-center gap-2">
          <RouteIcon className={styles.titleIcon} />
          <h1 className={`font-eve fw-bold text-white ${styles.title}`}>
            {t('ROUTE & SYSTEM MANAGEMENT')}
          </h1>
        </div>
        <p className={`mt-1 ${styles.subtitle}`}>
          {t('Configure available solar systems, corridors, and tariffs for courier services.')}
        </p>
      </div>

      <div className={styles.actions}>
        {onAddSystemClick && (
          <Button
            onClick={onAddSystemClick}
            className={`px-3 border shadow ${styles.headerActionBtn}`}
          >
            <Compass className={styles.btnIcon} />
            <span>{t('Add System')}</span>
          </Button>
        )}

        <Button
          onClick={onCreateClick}
          className={`px-3 border shadow ${styles.headerActionBtn}`}
        >
          <PlusCircle className={styles.btnIcon} />
          <span>{t('Create New Route')}</span>
        </Button>
      </div>
    </div>
  );
}
