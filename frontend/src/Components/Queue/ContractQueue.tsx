// React
import { useMemo, useState } from 'react';

// Third Party
import type { ColumnDef } from '@tanstack/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { CheckCircle, Clock, Search, Truck, XCircle } from 'lucide-react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// AA Fenrir
import { formatIskCompact, formatM3 } from '@/Components/Calculator/calculator';
import QueueFilter from '@/Components/Queue/Partial/QueueFilter';
import { QueueMetrics } from '@/Components/Queue/Partial/QueueMetrics';
import BaseTable from '@/Components/Tables/BaseTable/BaseTable';
import type { ContractItem } from '@/types';

export interface ContractQueueProps {
  contracts: ContractItem[];
  onNewQuoteClick: () => void;
}

export function ContractQueue({ contracts, onNewQuoteClick }: ContractQueueProps) {
  const { t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchesStatus =
        filterStatus === 'all' ||
        c.status === filterStatus ||
        (filterStatus === 'finished' &&
          (c.status === 'finished' ||
            c.status === 'finished_issuer' ||
            c.status === 'finished_contractor')) ||
        (filterStatus === 'failed' &&
          (c.status === 'failed' || c.status === 'canceled' || c.status === 'rejected'));

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        c.contract_id.toString().includes(searchTerm) ||
        (c.title ? c.title.toLowerCase().includes(searchLower) : false) ||
        c.issuer_name.toLowerCase().includes(searchLower) ||
        (c.issuer_corporation_ticker ? c.issuer_corporation_ticker.toLowerCase().includes(searchLower) : false) ||
        c.start_location_solar_system.toLowerCase().includes(searchLower) ||
        c.end_location_solar_system.toLowerCase().includes(searchLower) ||
        c.end_location_name.toLowerCase().includes(searchLower) ||
        (c.acceptor_name ? c.acceptor_name.toLowerCase().includes(searchLower) : false);

      return matchesStatus && matchesSearch;
    });
  }, [contracts, filterStatus, searchTerm]);

  const totalVolume = contracts
    .filter((c) => c.status === 'pending' || c.status === 'in_progress')
    .reduce((sum, c) => sum + (c.volume || 0), 0);

  const totalRewards = contracts
    .filter((c) => c.status === 'pending' || c.status === 'in_progress')
    .reduce((sum, c) => sum + (c.reward || 0), 0);

  const pendingCount = contracts.filter((c) => c.status === 'pending').length;

  const columns = useMemo<ColumnDef<ContractItem, unknown>[]>(() => {
    const columnHelper = createColumnHelper<ContractItem>();

    return [
      columnHelper.accessor('contract_id', {
        header: t('Contract'),
        cell: ({ row }) => {
          const c = row.original;
          const dateStr = c.date_issued
            ? new Date(c.date_issued).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '';

          return (
            <div>
              <div className="flex items-center gap-1.5 font-bold !text-cyan-300">
                <span>#{c.contract_id}</span>
              </div>
              {c.title && (
                <div className="text-[11px] !text-slate-300 font-normal truncate max-w-xs">
                  {c.title}
                </div>
              )}
              <div className="text-[10px] !text-slate-500 font-normal">{dateStr}</div>
            </div>
          );
        },
      }),

      columnHelper.accessor('issuer_name', {
        header: t('Issuer'),
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div>
              <div className="!text-white font-semibold">{c.issuer_name || '—'}</div>
              {c.issuer_corporation_ticker ? (
                <div className="text-[10px] !text-slate-400">[{c.issuer_corporation_ticker}]</div>
              ) : c.issuer_corporation_name ? (
                <div className="text-[10px] !text-slate-400">{c.issuer_corporation_name}</div>
              ) : null}
            </div>
          );
        },
      }),

      columnHelper.accessor(
        (row) => row.start_location_solar_system || row.start_location_name || '',
        {
          id: 'route',
          header: t('Route & Structure'),
          cell: ({ row }) => {
            const c = row.original;
            return (
              <div>
                <div className="!text-slate-200 font-medium">
                  {c.start_location_solar_system || c.start_location_name} ➔{' '}
                  {c.end_location_solar_system || c.end_location_name}
                </div>
                <div className="text-[10px] !text-slate-500 truncate max-w-xs">
                  {c.end_location_name}
                </div>
              </div>
            );
          },
        }
      ),

      columnHelper.accessor('volume', {
        header: t('Volume'),
        cell: ({ getValue }) => (
          <span className="!text-slate-300">{formatM3(Number(getValue()) || 0)}</span>
        ),
      }),

      columnHelper.accessor('collateral', {
        header: t('Collateral'),
        cell: ({ getValue }) => (
          <span className="!text-amber-300">{formatIskCompact(Number(getValue()) || 0)}</span>
        ),
      }),

      columnHelper.accessor('reward', {
        header: t('Reward'),
        cell: ({ getValue }) => (
          <span className="font-bold !text-cyan-300">{formatIskCompact(Number(getValue()) || 0)}</span>
        ),
      }),

      columnHelper.accessor('status', {
        header: t('Status'),
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div>
              {c.status === 'pending' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] !bg-amber-500/15 !text-amber-300 border !border-amber-500/30 flex items-center gap-1 w-max">
                  <Clock className="w-3 h-3" /> {t('Pending')}
                </span>
              )}
              {c.status === 'in_progress' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] !bg-purple-500/15 !text-purple-300 border !border-purple-500/30 flex items-center gap-1 w-max">
                  <Truck className="w-3 h-3 animate-pulse" /> {t('In Progress')}
                  {c.acceptor_name ? ` (${c.acceptor_name})` : ''}
                </span>
              )}
              {(c.status === 'finished' ||
                c.status === 'finished_issuer' ||
                c.status === 'finished_contractor') && (
                <span className="px-2 py-0.5 rounded-full text-[10px] !bg-emerald-500/15 !text-emerald-300 border !border-emerald-500/30 flex items-center gap-1 w-max">
                  <CheckCircle className="w-3 h-3" /> {t('Finished')}
                </span>
              )}
              {(c.status === 'failed' || c.status === 'canceled' || c.status === 'rejected') && (
                <span className="px-2 py-0.5 rounded-full text-[10px] !bg-rose-500/15 !text-rose-300 border !border-rose-500/30 flex items-center gap-1 w-max">
                  <XCircle className="w-3 h-3" /> {c.status_display || t('Failed')}
                </span>
              )}
              {c.status !== 'pending' &&
                c.status !== 'in_progress' &&
                c.status !== 'finished' &&
                c.status !== 'finished_issuer' &&
                c.status !== 'finished_contractor' &&
                c.status !== 'failed' &&
                c.status !== 'canceled' &&
                c.status !== 'rejected' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] !bg-slate-500/15 !text-slate-300 border !border-slate-500/30 flex items-center gap-1 w-max">
                    {c.status_display || c.status}
                  </span>
                )}
            </div>
          );
        },
      }),
    ] as ColumnDef<ContractItem, unknown>[];
  }, [t]);

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <QueueMetrics pendingCount={pendingCount} totalVolume={totalVolume} totalRewards={totalRewards} />

      {/* Filter and Search Bar */}
      <div className="!bg-slate-800/80 fenrir-gradient fenrir-border-500 mt-4 fenrir-border-700 rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Pills */}
        <QueueFilter
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />
        {/* Search input & New Contract button */}
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 !text-slate-500 absolute left-3 top-2.5" />
            <Form.Control
              type="text"
              placeholder={t('Search reference, pilot, route...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-xs font-mono !bg-slate-900 border !border-slate-700 rounded-lg !text-slate-200 focus:outline-none focus:!border-cyan-500"
            />
          </div>

          <Button
            onClick={onNewQuoteClick}
            className="px-3.5 py-1.5 rounded-lg !bg-cyan-600 hover:!bg-cyan-500 !text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors shadow"
          >
            + {t('New Quote')}
          </Button>
        </div>
      </div>

      {/* Contracts BaseTable */}
      <div className="mt-4">
        <BaseTable
          data={filteredContracts}
          columns={columns}
          variant="fenrir"
          initialState={{
            pagination: { pageSize: 10 },
            sorting: [{ id: 'contract_id', desc: true }],
          }}
          emptyText={t('No courier contracts match your filter criteria.')}
        />
      </div>
    </div>
  );
}

