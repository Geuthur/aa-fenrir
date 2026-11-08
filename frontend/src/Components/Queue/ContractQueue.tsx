// React
import { useMemo, useState } from 'react';

// Third Party
import { type BaseColumnDef, BaseTable, createBaseColumnHelper } from "aa-geuthur-react";
import { CheckCircle, Clock, Search, Truck, XCircle } from 'lucide-react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// Styles
import styles from '@/Components/Queue/ContractQueue.module.css';

// AA Fenrir
import { formatIskCompact, formatM3 } from '@/Components/Calculator/calculator';
import QueueFilter from '@/Components/Queue/Partial/QueueFilter';
import { QueueMetrics } from '@/Components/Queue/Partial/QueueMetrics';
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
          (c.status === 'failed' || c.status === 'cancelled' || c.status === 'rejected'));

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
    .filter((c) => c.status === 'outstanding' || c.status === 'in_progress')
    .reduce((sum, c) => sum + (c.volume || 0), 0);

  const totalRewards = contracts
    .filter((c) => c.status === 'outstanding' || c.status === 'in_progress')
    .reduce((sum, c) => sum + (c.reward || 0), 0);

  const pendingCount = contracts.filter((c) => c.status === 'outstanding').length;

  const columns = useMemo<BaseColumnDef<ContractItem, unknown>[]>(() => {
    const columnHelper = createBaseColumnHelper<ContractItem>();

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
              <div className={styles.contractId}>
                <span>#{c.contract_id}</span>
              </div>
              {c.title && (
                <div className={styles.contractTitle}>
                  {c.title}
                </div>
              )}
              <div className={styles.contractDate}>{dateStr}</div>
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
              <div className={styles.issuerName}>{c.issuer_name || '—'}</div>
              {c.issuer_corporation_ticker ? (
                <div className={styles.issuerCorp}>[{c.issuer_corporation_ticker}]</div>
              ) : c.issuer_corporation_name ? (
                <div className={styles.issuerCorp}>{c.issuer_corporation_name}</div>
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
                <div className={styles.routeMain}>
                  {c.start_location_solar_system || c.start_location_name} ➔{' '}
                  {c.end_location_solar_system || c.end_location_name}
                </div>
                <div className={styles.routeSub}>
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
          <span className={styles.volume}>{formatM3(Number(getValue()) || 0)}</span>
        ),
      }),

      columnHelper.accessor('collateral', {
        header: t('Collateral'),
        cell: ({ getValue }) => (
          <span className={styles.collateral}>{formatIskCompact(Number(getValue()) || 0)}</span>
        ),
      }),

      columnHelper.accessor('reward', {
        header: t('Reward'),
        cell: ({ getValue }) => (
          <span className={styles.reward}>{formatIskCompact(Number(getValue()) || 0)}</span>
        ),
      }),

      columnHelper.accessor('status', {
        header: t('Status'),
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div>
              {c.status === 'outstanding' && (
                <span className={`px-2 gap-1 border ${styles.statusBadge} ${styles.statusPending}`}>
                  <Clock className={styles.statusIcon} /> {t('Pending')}
                </span>
              )}
              {c.status === 'in_progress' && (
                <span className={`px-2 gap-1 border ${styles.statusBadge} ${styles.statusProgress}`}>
                  <Truck className={`${styles.statusIcon} ${styles.statusIconPulse}`} /> {t('In Progress')}
                  {c.acceptor_name ? ` (${c.acceptor_name})` : ''}
                </span>
              )}
              {(c.status === 'finished' ||
                c.status === 'finished_issuer' ||
                c.status === 'finished_contractor') && (
                <span className={`px-2 gap-1 border ${styles.statusBadge} ${styles.statusFinished}`}>
                  <CheckCircle className={styles.statusIcon} /> {t('Finished')}
                </span>
              )}
              {(c.status === 'failed' || c.status === 'cancelled' || c.status === 'rejected') && (
                <span className={`px-2 gap-1 border ${styles.statusBadge} ${styles.statusFailed}`}>
                  <XCircle className={styles.statusIcon} /> {c.status_display || t('Failed')}
                </span>
              )}
              {c.status !== 'outstanding' &&
                c.status !== 'in_progress' &&
                c.status !== 'finished' &&
                c.status !== 'finished_issuer' &&
                c.status !== 'finished_contractor' &&
                c.status !== 'failed' &&
                c.status !== 'cancelled' &&
                c.status !== 'rejected' && (
                  <span className={`px-2 gap-1 border ${styles.statusBadge} ${styles.statusOther}`}>
                    {c.status_display || c.status}
                  </span>
                )}
            </div>
          );
        },
      }),
    ] as BaseColumnDef<ContractItem, unknown>[];
  }, [t]);

  return (
    <div>
      {/* Top Metrics Cards */}
      <QueueMetrics pendingCount={pendingCount} totalVolume={totalVolume} totalRewards={totalRewards} />

      {/* Filter and Search Bar */}
      <div className={`fenrir-gradient fenrir-border-500 fenrir-border-700 mt-4 p-4 shadow-lg gap-4 ${styles.toolbar}`}>
        {/* Status Filter Pills */}
        <QueueFilter
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
        />
        {/* Search input & New Contract button */}
        <div className={`gap-3 ${styles.toolbarActions}`}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <Form.Control
              type="text"
              placeholder={t('Search reference, pilot, route...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`border ${styles.searchInput}`}
            />
          </div>

          <Button
            onClick={onNewQuoteClick}
            className={`shadow ${styles.newQuoteButton}`}
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

