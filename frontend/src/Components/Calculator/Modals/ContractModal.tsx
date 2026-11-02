// React
import { useState } from 'react';

// Third Party
import { Info, Shield } from 'lucide-react';
import { Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import { BaseModal } from '@/Components/Base/BaseModal';
import { ModalTitle } from '@/Components/Base/ModalTitle';
import { formatIsk } from '@/Components/Calculator/calculator';
import { ContractParamCard } from '@/Components/Calculator/Modals/ContractParamCard';
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
 * Built on `BaseModal`.
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

  const assigneeCorp =
    quote.corridor?.assign_corp_name || "Voices of War Inc.";
  const expirationDays = quote.corridor?.expiration_days ?? 7;
  const daysToComplete = quote.isRush
    ? 1
    : (quote.corridor?.days_to_complete || quote.corridor?.estimated_days || 3);

  const destination = destinationStation || `${quote.destination.name} - Upwell Citadel`;

  return (
    <BaseModal
      show={isOpen}
      onHide={onClose}
      size="xl"
      title={
        <ModalTitle
          icon={<Shield size={20} />}
          title={t('IN-GAME COURIER CONTRACT ASSISTANT')}
          subtitle={t('Copy values directly into the EVE Online contract creation wizard.')}
        />
      }
    >
      {/* Step-by-Step EVE Instructions */}
      <Alert variant="info" className="d-flex align-items-start gap-3 small">
        <Info size={16} className="flex-shrink-0 mt-1" />
        <div>
          <div className="fw-semibold">{t('How to create this contract in EVE Online:')}</div>
          <p className="mb-1">
            {t('1. Select your cargo in your hangar, right-click and choose')}{' '}
            <span className="font-monospace">{t('Create Contract')}</span>.
          </p>
          <p className="mb-1">
            {t('2. Select Contract Type:')} <span className="font-monospace fw-bold">{t('Courier')}</span>{' '}
            {t('and Availability:')} <span className="font-monospace fw-bold">{t('Private')}</span>.
          </p>
          <p className="mb-0">{t('3. Paste the Name / Corporation and parameters below into each field.')}</p>
        </div>
      </Alert>

      {/* Copyable Parameters Grid */}
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <ContractParamCard
            label={t('Assign To (Private)')}
            value={assigneeCorp}
            copyText={assigneeCorp}
            isCopied={copiedField === 'assignee'}
            onCopy={(text) => handleCopy('assignee', text)}
          />
        </div>
        <div className="col-12 col-md-6">
          <ContractParamCard
            label={t('Destination Citadel')}
            value={destination}
            valueClassName="text-info"
            copyText={destination}
            isCopied={copiedField === 'dest'}
            onCopy={(text) => handleCopy('dest', text)}
          />
        </div>
        <div className="col-12 col-md-6">
          <ContractParamCard
            label={t('Reward (ISK)')}
            value={formatIsk(quote.totalReward)}
            valueClassName="text-success"
            borderClassName="border-success"
            copyIconClassName="text-success"
            copyText={String(quote.totalReward)}
            isCopied={copiedField === 'reward'}
            onCopy={(text) => handleCopy('reward', text)}
            showCopyLabel
          />
        </div>
        <div className="col-12 col-md-6">
          <ContractParamCard
            label={t('Collateral (ISK)')}
            value={formatIsk(quote.collateralIsk)}
            valueClassName="text-warning"
            borderClassName="border-warning"
            copyIconClassName="text-warning"
            copyText={String(quote.collateralIsk)}
            isCopied={copiedField === 'collateral'}
            onCopy={(text) => handleCopy('collateral', text)}
            showCopyLabel
          />
        </div>
        <div className="col-12 col-md-6">
          <ContractParamCard label={t('Expiration')} value={`${expirationDays} ${t('Days')}`} />
        </div>
        <div className="col-12 col-md-6">
          <ContractParamCard label={t('Days to Complete')} value={`${daysToComplete} ${t('Days')}`} />
        </div>
      </div>
    </BaseModal>
  );
}
