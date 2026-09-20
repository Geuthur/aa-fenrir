// Third Party
import { Clock, FileText, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="!bg-slate-800/80 fenrir-gradient fenrir-border-500 rounded-xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono !text-slate-400 uppercase tracking-wider">
            {t('Pending Courier Queue')}
          </span>
          <div className="text-2xl font-eve font-bold !text-white mt-1">
            {pendingCount} {t('Contracts')}
          </div>
          <div className="text-[11px] font-mono !text-cyan-400 mt-0.5">
            {t('Ready for hauler acceptance')}
          </div>
        </div>
        <div className="p-3 rounded-xl !bg-cyan-950/40 border !border-cyan-500/30 !text-cyan-400">
          <Clock className="w-6 h-6" />
        </div>
      </div>

      <div className="!bg-slate-800/80 fenrir-gradient fenrir-border-500 rounded-xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono !text-slate-400 uppercase tracking-wider">
            {t('Active In-Transit Cargo')}
          </span>
          <div className="text-2xl font-eve font-bold !text-cyan-300 mt-1">
            {formatM3(totalVolume)}
          </div>
          <div className="text-[11px] font-mono !text-slate-400 mt-0.5">
            {t('Across Jump Freighter lines')}
          </div>
        </div>
        <div className="p-3 rounded-xl !bg-blue-950/40 border !border-blue-500/30 !text-blue-400">
          <Truck className="w-6 h-6" />
        </div>
      </div>

      <div className="!bg-slate-800/80 fenrir-gradient fenrir-border-500 rounded-xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono !text-slate-400 uppercase tracking-wider">
            {t('Outstanding Rewards Pool')}
          </span>
          <div className="text-2xl font-eve font-bold !text-amber-300 mt-1">
            {formatIskCompact(totalRewards)}
          </div>
          <div className="text-[11px] font-mono !text-slate-400 mt-0.5">
            {t('Pending hauler payouts')}
          </div>
        </div>
        <div className="p-3 rounded-xl !bg-amber-950/40 border !border-amber-500/30 !text-amber-400">
          <FileText className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
