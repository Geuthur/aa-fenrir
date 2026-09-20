// React
import { useState } from 'react';

// Third Party
import { Check, Copy, Info, Shield } from 'lucide-react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// Styles
import styles from '@/Components/Calculator/Modals/ContractModal.module.css';

import { formatIsk } from '@/Components/Calculator/calculator';
import { FenrirModal } from '@/Components/Modals';
import type { QuoteCalculation } from '@/types';

export interface ContractModalProps {
  /** The calculated courier quote details */
  quote: QuoteCalculation;
  /** Destination station / structure text */
  destinationStation: string;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * In-game Courier Contract Assistant Modal.
 * Built on top of react-bootstrap Modal via FenrirModal.
 * Displays step-by-step instructions and copyable fields to quickly create the contract in EVE Online.
 * Belongs to the Calculator page (`src/Pages/Calculator.tsx`).
 */
export function ContractModal({
  quote,
  destinationStation,
  isOpen,
  onClose,
}: ContractModalProps) {
  const { t } = useTranslation();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const assigneeCorp = "Voices of War Inc.";
  const expirationDays = 7;
  const daysToComplete = quote.isRush ? 1 : (quote.corridor?.estimated_days || 3);

  return (
    <FenrirModal isOpen={isOpen} onClose={onClose} size="xl">
      <FenrirModal.Header>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <Shield className={styles.headerShieldIcon} />
          </div>
          <div>
            <FenrirModal.Title>{t('IN-GAME COURIER CONTRACT ASSISTANT')}</FenrirModal.Title>
            <p className={styles.headerSubtitle}>
              {t('Copy values directly into the EVE Online contract creation wizard.')}
            </p>
          </div>
        </div>
      </FenrirModal.Header>

      <FenrirModal.Body>
        <div className={styles.bodyContainer}>
          {/* Step-by-Step EVE Instructions */}
          <div className={styles.instructionBox}>
            <Info className={styles.instructionIcon} />
            <div className={styles.instructionContent}>
              <div className={styles.instructionTitle}>
                {t('How to create this contract in EVE Online:')}
              </div>
              <p className={styles.instructionText}>
                {t('1. Select your cargo in your hangar, right-click and choose')}{' '}
                <span className={styles.instructionCode}>{t('Create Contract')}</span>.
              </p>
              <p className={styles.instructionText}>
                {t('2. Select Contract Type:')}{' '}
                <span className={styles.instructionCodeBold}>{t('Courier')}</span>{' '}
                {t('and Availability:')}{' '}
                <span className={styles.instructionCodeBold}>{t('Private')}</span>.
              </p>
              <p className={styles.instructionText}>
                {t('3. Paste the Name / Corporation and parameters below into each field.')}
              </p>
            </div>
          </div>

          {/* Copyable Parameters Grid */}
          <div className={styles.paramsGrid}>
            {/* Assign To Corporation */}
            <div className={`${styles.paramCard} ${styles.paramCardDefault}`}>
              <div>
                <div className={styles.paramLabel}>
                  {t('Assign To (Private)')}
                </div>
                <div className={styles.paramValueWhite}>
                  {assigneeCorp}
                </div>
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => handleCopy('assignee', assigneeCorp)}
                className={styles.copyIconBtn}
              >
                {copiedField === 'assignee' ? (
                  <Check className={styles.copyStatusIconEmerald} />
                ) : (
                  <Copy className={styles.copyStatusIconSlate} />
                )}
              </Button>
            </div>

            {/* Destination Citadel */}
            <div className={`${styles.paramCard} ${styles.paramCardDefault}`}>
              <div className={styles.destInfo}>
                <div className={styles.paramLabel}>
                  {t('Destination Citadel')}
                </div>
                <div className={styles.paramValueIndigo}>
                  {destinationStation || `${quote.destination.name} - Upwell Citadel`}
                </div>
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() =>
                  handleCopy(
                    'dest',
                    destinationStation || `${quote.destination.name} - Upwell Citadel`
                  )
                }
                className={styles.copyIconBtn}
              >
                {copiedField === 'dest' ? (
                  <Check className={styles.copyStatusIconEmerald} />
                ) : (
                  <Copy className={styles.copyStatusIconSlate} />
                )}
              </Button>
            </div>

            {/* Reward */}
            <div className={styles.paramCardReward}>
              <div>
                <div className={styles.paramLabel}>
                  {t('Reward (ISK)')}
                </div>
                <div className={styles.paramValueReward}>
                  {formatIsk(quote.totalReward)}
                </div>
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => handleCopy('reward', String(quote.totalReward))}
                className={styles.copyRewardBtn}
              >
                {copiedField === 'reward' ? (
                  <Check className={styles.copyStatusIconEmerald} />
                ) : (
                  <Copy className={styles.copyStatusIconEmerald} />
                )}
                <span>{copiedField === 'reward' ? t('Copied') : t('Copy')}</span>
              </Button>
            </div>

            {/* Collateral */}
            <div className={styles.paramCardCollateral}>
              <div>
                <div className={styles.paramLabel}>
                  {t('Collateral (ISK)')}
                </div>
                <div className={styles.paramValueCollateral}>
                  {formatIsk(quote.collateralIsk)}
                </div>
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => handleCopy('collateral', String(quote.collateralIsk))}
                className={styles.copyCollateralBtn}
              >
                {copiedField === 'collateral' ? (
                  <Check className={styles.copyStatusIconAmber} />
                ) : (
                  <Copy className={styles.copyStatusIconAmber} />
                )}
                <span>{copiedField === 'collateral' ? t('Copied') : t('Copy')}</span>
              </Button>
            </div>

            {/* Expiration Days */}
            <div className={`${styles.paramCard} ${styles.paramCardDefault}`}>
              <div>
                <div className={styles.paramLabel}>
                  {t('Expiration')}
                </div>
                <div className={styles.paramValueWhite}>
                  {expirationDays} {t('Days')}
                </div>
              </div>
            </div>

            {/* Days to Complete */}
            <div className={`${styles.paramCard} ${styles.paramCardDefault}`}>
              <div>
                <div className={styles.paramLabel}>
                  {t('Days to Complete')}
                </div>
                <div className={styles.paramValueWhite}>
                  {daysToComplete} {t('Days')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </FenrirModal.Body>

      <FenrirModal.Footer>
        <div className={styles.footerActions}>
          <Button
            variant="primary"
            onClick={onClose}
            className={styles.footerDoneBtn}
          >
            {t('Close')}
          </Button>
        </div>
      </FenrirModal.Footer>
    </FenrirModal>

  );
}
