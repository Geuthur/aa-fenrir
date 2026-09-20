// React
import { useEffect, useState } from 'react';

// Third Party
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import { getServiceBadge } from '@/Components/Calculator/calculator';
import { FenrirModal } from '@/Components/Modals';
import type { FreightCorridor } from '@/types';
import styles from '@/Components/Calculator/Modals/ConfigurePresetsModal.module.css';

export interface ConfigurePresetsModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Available route corridors */
  corridors: FreightCorridor[];
  /** Currently saved quick-select preset IDs */
  currentSelectedIds: number[];
  /** Callback when user saves new selection */
  onSave: (presetIds: number[]) => Promise<void> | void;
  /** Loading state during save mutation */
  isPending?: boolean;
}

const MAX_QUICK_PRESETS = 5;

/**
 * Modal dialog for customizing user's Quick-Select Route Presets (up to 5).
 * Built with react-bootstrap Modal via FenrirModal.
 * Belongs to the Calculator page (`src/Pages/Calculator.tsx`).
 */
export function ConfigurePresetsModal({
  isOpen,
  onClose,
  corridors,
  currentSelectedIds,
  onSave,
  isPending = false,
}: ConfigurePresetsModalProps) {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<number[]>(currentSelectedIds);

  // Sync with currentSelectedIds whenever modal opens
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIds(currentSelectedIds);
    }
  }, [isOpen, currentSelectedIds]);

  const handleToggle = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= MAX_QUICK_PRESETS) {
        return; // Cap at 5
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleClose = () => {
    setSelectedIds(currentSelectedIds);
    onClose();
  };

  const handleSave = () => {
    onSave(selectedIds);
  };

  return (
    <FenrirModal
      isOpen={isOpen}
      onClose={handleClose}
      onExited={() => setSelectedIds(currentSelectedIds)}
      size="lg"
    >
      <FenrirModal.Header>
        <div className={styles.headerContent}>
          <div className={styles.headerIcon}>
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <FenrirModal.Title>{t('CONFIGURE QUICK-SELECT ROUTES')}</FenrirModal.Title>
            <p className={styles.headerSubtitle}>
              {t('Select up to 5 favorite routes to display as quick-access buttons.')}
            </p>
          </div>
        </div>
      </FenrirModal.Header>

      <FenrirModal.Body>
        <div className={styles.bodyContainer}>
          {/* Header count info */}
          <div className={styles.summaryBox}>
            <span className={styles.summaryLabel}>
              <Sparkles className={styles.summaryIcon} />
              {t('Favorite Corridor Buttons')}
            </span>
            <span
              className={`${styles.countBadge} ${
                selectedIds.length >= MAX_QUICK_PRESETS
                  ? styles.countBadgeAmber
                  : styles.countBadgeCyan
              }`}
            >
              {selectedIds.length} / {MAX_QUICK_PRESETS} {t('selected')}
            </span>
          </div>

          {corridors.length === 0 ? (
            <div className={styles.emptyState}>
              {t('No route presets available to configure.')}
            </div>
          ) : (
            <div className={styles.corridorList}>
              {corridors.map((corridor) => {
                const id = Number(corridor.id);
                const isSelected = selectedIds.includes(id);
                const isDisabled = !isSelected && selectedIds.length >= MAX_QUICK_PRESETS;
                const badge = getServiceBadge(corridor.service_type);

                return (
                  <div
                    key={id}
                    onClick={() => !isDisabled && handleToggle(id)}
                    className={`${styles.corridorCard} ${
                      isSelected
                        ? styles.corridorCardSelected
                        : isDisabled
                        ? styles.corridorCardDisabled
                        : styles.corridorCardDefault
                    }`}
                  >
                    <div className={styles.corridorInfo}>
                      <Form.Check
                        type="checkbox"
                        id={`corridor-check-${id}`}
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => handleToggle(id)}
                        onClick={(e) => e.stopPropagation()}
                        className={styles.corridorCheck}
                      />
                      <div>
                        <div className={styles.corridorTitle}>{corridor.name}</div>
                        <div className={styles.corridorRoute}>
                          <span className={styles.originText}>{corridor.origin_system}</span>
                          <span> ➔ </span>
                          <span className={styles.destText}>{corridor.destination_system}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`${styles.serviceBadge} ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </FenrirModal.Body>

      <FenrirModal.Footer>
        <div className={styles.footerActions}>
          <Button
            variant="primary"
            onClick={handleClose}
            className={styles.modalBtn}
          >
            {t('Cancel')}
          </Button>
          <Button
            variant="success"
            onClick={handleSave}
            disabled={isPending}
            className={styles.modalBtn}
          >
            {isPending ? t('Saving...') : t('Save Selection')}
          </Button>
        </div>
      </FenrirModal.Footer>
    </FenrirModal>
  );
}
