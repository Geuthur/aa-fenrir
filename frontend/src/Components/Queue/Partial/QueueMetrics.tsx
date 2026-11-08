// Third Party
import { Clock, FileText, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Styles
import styles from '@/Components/Queue/Partial/QueueMetrics.module.css';

// AA Fenrir
import { formatIskCompact, formatM3 } from '@/Components/Calculator/calculator';

export function QueueMetrics({
  pendingCount,
  totalVolume,
  totalRewards,
}: {
  pendingCount: number;
  totalVolume: number;
  totalRewards: number;
}) {
  const { t } = useTranslation();

  return (
    <div className={`gap-4 ${styles.grid}`}>
      <div className={`fenrir-gradient fenrir-border-500 p-4 shadow-lg ${styles.card}`}>
        <div>
          <span className={styles.label}>
            {t('Pending Courier Queue')}
          </span>
          <div className={`mt-1 ${styles.value} ${styles.valueWhite}`}>
            {pendingCount} {t('Contracts')}
          </div>
          <div className={`${styles.hint} ${styles.hintCyan}`}>
            {t('Ready for hauler acceptance')}
          </div>
        </div>
        <div className={`p-3 border ${styles.iconBox} ${styles.iconCyan}`}>
          <Clock className={`d-block ${styles.icon}`} />
        </div>
      </div>

      <div className={`fenrir-gradient fenrir-border-500 p-4 shadow-lg ${styles.card}`}>
        <div>
          <span className={styles.label}>
            {t('Active In-Transit Cargo')}
          </span>
          <div className={`mt-1 ${styles.value} ${styles.valueCyan}`}>
            {formatM3(totalVolume)}
          </div>
          <div className={`${styles.hint} ${styles.hintSlate}`}>
            {t('Across Jump Freighter lines')}
          </div>
        </div>
        <div className={`p-3 border ${styles.iconBox} ${styles.iconBlue}`}>
          <Truck className={`d-block ${styles.icon}`} />
        </div>
      </div>

      <div className={`fenrir-gradient fenrir-border-500 p-4 shadow-lg ${styles.card}`}>
        <div>
          <span className={styles.label}>
            {t('Outstanding Rewards Pool')}
          </span>
          <div className={`mt-1 ${styles.value} ${styles.valueAmber}`}>
            {formatIskCompact(totalRewards)}
          </div>
          <div className={`${styles.hint} ${styles.hintSlate}`}>
            {t('Pending hauler payouts')}
          </div>
        </div>
        <div className={`p-3 border ${styles.iconBox} ${styles.iconAmber}`}>
          <FileText className={`d-block ${styles.icon}`} />
        </div>
      </div>
    </div>
  );
}
