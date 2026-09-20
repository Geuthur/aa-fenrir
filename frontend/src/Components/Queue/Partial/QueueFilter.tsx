// Third Party
import { Filter } from 'lucide-react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

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
    { id: 'pending', label: t('Pending') },
    { id: 'in_progress', label: t('In Progress') },
    { id: 'finished', label: t('Completed') },
    { id: 'failed', label: t('Failed / Canceled') },
  ];

  return (
    <div className="!bg-slate-900/80 fenrir-border-500 rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Status Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        <Filter className="w-4 h-4 !text-slate-400 mr-1 shrink-0" />
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              filterStatus === tab.id
                ? '!bg-cyan-600 !text-white shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                : '!bg-slate-900 !text-slate-400 hover:!text-slate-200 border !border-slate-800'
            }`}
          >
            {tab.label}
          </Button>
        ))}
      </div>
    </div>
  );
}