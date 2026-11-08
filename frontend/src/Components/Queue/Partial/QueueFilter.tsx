// Third Party
import { Filter } from 'lucide-react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// Styles
import styles from '@/Components/Queue/Partial/QueueFilter.module.css';

export default function QueueFilter({
  filterStatus,
  setFilterStatus,
}: {
  filterStatus: string;
  setFilterStatus: (status: string) => void;
}) {
  const { t } = useTranslation();

  const tabs = [
    { id: 'all', label: t('All Contracts') },
    { id: 'outstanding', label: t('Pending') },
    { id: 'in_progress', label: t('In Progress') },
    { id: 'finished', label: t('Completed') },
    { id: 'failed', label: t('Failed / Canceled') },
  ];

  return (
    <div className={`fenrir-border-500 p-4 shadow-lg gap-4 ${styles.container}`}>
      {/* Status Filter Pills */}
      <div className={`scrollbar-none pb-1 ${styles.pills}`}>
        <Filter className={styles.filterIcon} />
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 ${styles.pill} ${filterStatus === tab.id ? styles.pillActive : `border ${styles.pillInactive}`}`}
          >
            {tab.label}
          </Button>
        ))}
      </div>
    </div>
  );
}