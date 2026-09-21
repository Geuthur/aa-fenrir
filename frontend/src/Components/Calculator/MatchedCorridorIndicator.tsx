// Third Party
import { CheckCircle2, Compass, Sparkles } from 'lucide-react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// Styles
import styles from '@/Components/Calculator/MatchedCorridorIndicator.module.css';

import {
  formatIskCompact,
  formatM3,
  getServiceBadge,
} from '@/Components/Calculator/calculator';
import type { EveSolarSystem, FreightCorridor } from '@/types';

export interface MatchedCorridorIndicatorProps {
  /** The currently applied freight corridor in the quote calculation */
  selectedCorridor: FreightCorridor | null;
  /** The matching preset found for the selected origin/destination (if any) */
  matchingCorridor: FreightCorridor | null;
  /** Currently selected origin system */
  origin: EveSolarSystem;
  /** Currently selected destination system */
  destination: EveSolarSystem;
  /** Callback to apply the matching corridor's tariffs */
  onApplyCorridor: (corridor: FreightCorridor) => void;
  /** Callback to switch to standard base rates */
  onUseBaseRates: () => void;
}

/**
 * Dedicated component displaying route corridor preset adoption status in the Calculator.
 * Shows whether an alliance corridor preset was automatically adopted and its tariffs applied,
 * or allows switching between preset rates and standard base rates.
 */
export function MatchedCorridorIndicator({
  selectedCorridor,
  matchingCorridor,
  origin,
  destination,
  onApplyCorridor,
  onUseBaseRates,
}: MatchedCorridorIndicatorProps) {
  const { t } = useTranslation();

  // State 1: A corridor is currently applied
  if (selectedCorridor) {
    const badge = getServiceBadge(selectedCorridor.service_type);

    return (
      <div className={`${styles.container} ${styles.activeContainer} mt-4 fenrir-gradient fenrir-border-500`}>
        <div className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <CheckCircle2 className={styles.iconActive} />
            <div>
              <div className="flex items-center gap-2">
                <span className={styles.titleText}>{selectedCorridor.name}</span>
                <span className={styles.badgeActive}>
                  {t('Corridor Tariffs Applied')}
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badge.color}`}>
                  {t(badge.label)}
                </span>
              </div>
              <p className="text-[11px] !text-slate-400 font-mono m-0 mt-0.5">
                {t('Rates automatically adopted from alliance route preset.')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={onUseBaseRates}
              className={`${styles.toggleBtn} !bg-slate-900/80 hover:!bg-slate-800 !text-slate-300 border-slate-700`}
            >
              {t('Use Base Rates')}
            </Button>
          </div>
        </div>

        <div className={styles.ratesGrid}>
          <div className={styles.rateItem}>
            <span className={styles.rateLabel}>{t('Base Fee')}</span>
            <span className={styles.rateValue}>{formatIskCompact(selectedCorridor.base_fee)}</span>
          </div>
          <div className={styles.rateItem}>
            <span className={styles.rateLabel}>{t('Volume Rate')}</span>
            <span className="!text-cyan-300 font-semibold">{selectedCorridor.fee_per_m3} ISK/m³</span>
          </div>
          <div className={styles.rateItem}>
            <span className={styles.rateLabel}>{t('Insurance')}</span>
            <span className="!text-amber-300 font-semibold">
              {(selectedCorridor.collateral_percent * 100).toFixed(2)}%
            </span>
          </div>
          <div className={styles.rateItem}>
            <span className={styles.rateLabel}>{t('Max Volume')}</span>
            <span className={styles.rateValue}>{formatM3(selectedCorridor.max_volume)}</span>
          </div>
          <div className={styles.rateItem}>
            <span className={styles.rateLabel}>{t('Min Reward')}</span>
            <span className={styles.rateValue}>{formatIskCompact(selectedCorridor.min_reward)}</span>
          </div>
        </div>
      </div>
    );
  }

  // State 2: A matching corridor exists, but the user explicitly toggled to base rates
  if (matchingCorridor) {
    return (
      <div className={`${styles.container} ${styles.availableContainer} mt-4 fenrir-gradient fenrir-border-500`}>
        <div className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <Sparkles className={styles.iconAvailable} />
            <div>
              <div className="flex items-center gap-2">
                <span className={styles.titleText}>{matchingCorridor.name}</span>
                <span className={styles.badgeAvailable}>
                  {t('Preset Available')}
                </span>
              </div>
              <p className="text-[11px] !text-slate-400 font-mono m-0 mt-0.5">
                {t('Currently using standard base rates. You can apply the configured route preset tariffs.')}
              </p>
            </div>
          </div>

          <Button
            variant="success"
            size="sm"
            onClick={() => onApplyCorridor(matchingCorridor)}
            className={styles.applyBtn}
          >
            {t('Apply Preset Rates')}
          </Button>
        </div>
      </div>
    );
  }

  // State 3: No corridor matches the selected systems (standard base rates)
  return (
    <div className={`${styles.container} ${styles.standardContainer} mt-4 fenrir-gradient fenrir-border-700`}>
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <Compass className={styles.iconStandard} />
          <div>
            <div className="flex items-center gap-2">
              <span className={styles.titleText}>{t('Standard Base Tariffs')}</span>
              <span className={styles.badgeStandard}>
                {t('Custom Route')}
              </span>
            </div>
            <p className="text-[11px] !text-slate-400 font-mono m-0 mt-0.5">
              {t('No predefined corridor found for {{origin}} ➔ {{destination}}. Standard base rates are applied.', {
                origin: origin.name || t('Origin'),
                destination: destination.name || t('Destination'),
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
