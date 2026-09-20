// React
import { useState } from 'react';

// Third Party
import {
  AlertTriangle,
  Calculator,
  Check,
  Clock,
  Copy,
  Fuel,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// Styles
import styles from '@/Components/Calculator/QuoteBreakdown.module.css';

import { formatIsk, formatIskCompact, formatM3 } from '@/Components/Calculator/calculator';
import type { QuoteCalculation } from '@/types';

interface QuoteBreakdownProps {
  quote: QuoteCalculation;
  onOpenContractModal: () => void;
}

export function QuoteBreakdown({
  quote,
  onOpenContractModal,
}: QuoteBreakdownProps) {
  const { t } = useTranslation();
  const [rewardCopied, setRewardCopied] = useState(false);

  const copyReward = () => {
    navigator.clipboard.writeText(quote.totalReward.toString());
    setRewardCopied(true);
    setTimeout(() => setRewardCopied(false), 1500);
  };

  return (
    <div className={`${styles.container} fenrir-gradient fenrir-border-700`}>
      {/* Decorative gradient corner */}
      <div className={styles.cornerGradient} />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitleGroup}>
          <Calculator className={styles.headerIcon} />
          <h2 className={styles.headerTitle}>
            {t('TRANSPORT QUOTE BREAKDOWN')}
          </h2>
        </div>
        <div className={styles.deliveryEstimate}>
          <Clock className={styles.deliveryIcon} />
          <span>{t('Estimated Delivery:')}</span>
          <span className={styles.deliveryHours}>{t('{{hours}} Hours', { hours: quote.estimatedDeliveryHours })}</span>
        </div>
      </div>

      {/* Warning Banners */}
      {quote.warnings.length > 0 && (
        <div className={styles.warningsList}>
          {quote.warnings.map((warn, i) => (
            <div
              key={i}
              className={styles.warningBanner}
            >
              <AlertTriangle className={styles.warningIcon} />
              <span>{warn}</span>
            </div>
          ))}
        </div>
      )}

      {/* Primary Reward Hero Banner */}
      <div className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <div>
            <span className={styles.heroLabel}>
              {t('Total Recommended Courier Contract Reward')}
            </span>
            <div className={styles.heroAmountRow}>
              <span className={styles.heroAmount}>
                {quote.totalReward.toLocaleString()}
              </span>
              <span className={styles.heroIskUnit}>ISK</span>
              <span className={styles.heroCompactBadge}>
                ({formatIskCompact(quote.totalReward)})
              </span>
            </div>
            <div className={styles.heroFormula}>
              {t('Alliance formula: Base + Volume + Distance + Collateral Risk - Subsidies')}
            </div>
          </div>

          <div className={styles.heroActions}>
            <Button
              id="copy-reward-btn"
              onClick={copyReward}
              className={styles.copyRewardBtn}
              title={t('Copy raw reward figure to clipboard')}
            >
              {rewardCopied ? (
                <>
                  <Check className={styles.copyCheckIcon} />
                  <span className={styles.copyTextCopied}>{t('Copied!')}</span>
                </>
              ) : (
                <>
                  <Copy className={styles.copyIcon} />
                  <span>{t('Copy ISK')}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
              
      {/* Itemized Fee Breakdown Table */}
      <div className={styles.tariffCard}>
        <h3 className={styles.tariffTitle}>
          <ShieldCheck className={styles.tariffIcon} />
          {t('Itemized Tariff Calculation')}
        </h3>

        <div className={styles.tariffList}>
          <div className={styles.tariffRow}>
            <span className={styles.tariffLabel}>{t('Base Booking Fee:')}</span>
            <span className={styles.tariffValue}>{formatIsk(quote.baseFee)}</span>
          </div>

          <div className={styles.tariffRow}>
            <div className={styles.tariffDetailGroup}>
              <span className={styles.tariffLabel}>{t('Volume Tariff:')}</span>
              <span className={styles.tariffDetailSub}>
                ({formatM3(quote.volumeM3)} × {quote.corridor?.fee_per_m3 || 750} ISK/m³)
              </span>
            </div>
            <span className={styles.tariffValue}>{formatIsk(quote.volumeFee)}</span>
          </div>

          <div className={styles.tariffRow}>
            <div className={styles.tariffDetailGroup}>
              <span className={styles.tariffLabel}>{t('Jump Distance / Waypoints:')}</span>
              <span className={styles.tariffDetailSub}>
                ({t('{{ly}} LY transit', { ly: quote.distanceLy.toFixed(3) })})
              </span>
            </div>
            <span className={styles.tariffValue}>{formatIsk(quote.distanceFee)}</span>
          </div>

          <div className={styles.tariffRow}>
            <div className={styles.tariffDetailGroup}>
              <span className={styles.tariffLabel}>{t('Collateral Surcharge / Insurance:')}</span>
              <span className={styles.tariffDetailSub}>
                ({t('{{percent}}% of {{collateral}}', { percent: ((quote.corridor?.collateral_percent || 0.01) * 100).toFixed(1), collateral: formatIskCompact(quote.collateralIsk) })})
              </span>
            </div>
            <span className={styles.tariffValue}>{formatIsk(quote.collateralFee)}</span>
          </div>

          {quote.isRush && (
            <div className={styles.tariffRowRush}>
              <span>{t('RUSH Priority Surcharge (+35%):')}</span>
              <span className={styles.tariffValueRush}>+{formatIsk(quote.rushSurcharge)}</span>
            </div>
          )}

          {quote.corridor?.has_alliance_subsidy === false ? (
            <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded bg-slate-900/60 border border-slate-800/80 text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                {t('Alliance Member Subsidy:')}
              </span>
              <span className="text-[11px] font-mono text-rose-400/90 italic">
                {t('Not available on this corridor')}
              </span>
            </div>
          ) : quote.isCorpSubsidized ? (
            <div className={styles.tariffRowSubsidized}>
              <span>{t('Alliance Member Subsidy Discount (-12%):')}</span>
              <span className={styles.tariffValueSubsidized}>-{formatIsk(quote.subsidizedDiscount)}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Fuel Consumption & Waypoint Chain */}
      <div className={styles.transitGrid}>
        {/* Fuel & Isotopes */}
        <div className={styles.transitCard}>
          <div className={styles.transitHeader}>
            <Fuel className={styles.transitIcon} />
            <span>{t('JF Fuel Bay Consumption')}</span>
          </div>
          <div className={styles.fuelList}>
            <div className={styles.fuelRow}>
              <span className={styles.tariffLabel}>{t('Required Isotopes:')}</span>
              <span className={styles.fuelValueCyan}>
                {quote.fuelIsotopesNeeded.toLocaleString()} {quote.fuelIsotopeName}
              </span>
            </div>
            <div className={styles.fuelRow}>
              <span className={styles.tariffLabel}>{t('Estimated Fuel Cost:')}</span>
              <span className={styles.fuelValueSlate}>~{formatIskCompact(quote.fuelCostEstimate)}</span>
            </div>
            <div className={styles.fatigueRow}>
              <span className={styles.fatigueLabel}>{t('Jump Fatigue Estimate:')}</span>
              <span className={styles.fatigueValue}>{t('Blue 04:30 / Orange 00:08')}</span>
            </div>
          </div>
        </div>

        {/* Waypoints & Beacon Pipeline */}
        <div className={styles.transitCard}>
          <div className={styles.transitHeader}>
            <MapPin className={styles.transitIcon} />
            <span>{t('Transit Routing Chain')}</span>
          </div>
          <div className={styles.waypointChain}>
            {quote.waypoints.map((wp, idx) => (
              <div key={idx} className={styles.waypointItem}>
                <span className={styles.waypointBadge}>
                  {wp}
                </span>
                {idx < quote.waypoints.length - 1 && (
                  <span className={styles.waypointArrow}>➔</span>
                )}
              </div>
            ))}
          </div>
          <div className={styles.cynoNote}>
            {quote.corridor?.is_cyno_route || (quote.corridor?.danger_level && ['cyno_guarded', 'cyno guarded', 'cyno-guarded'].includes(quote.corridor.danger_level.toLowerCase().trim()))
              ? t('Guarded alliance cynosural network active')
              : t('Direct stargate corridor transit')}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <Button
            onClick={onOpenContractModal}
            className={styles.stepByStepBtn}
          >
            {t('Step-by-Step In-Game Instructions')}
          </Button>
        </div>
      </div>
    </div>
  );
}
