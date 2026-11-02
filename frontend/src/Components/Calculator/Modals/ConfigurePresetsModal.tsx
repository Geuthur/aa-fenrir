// React
import { useEffect, useState } from 'react';

// Third Party
import { SlidersHorizontal, Sparkles } from 'lucide-react';
import { Badge, Button, Form, ListGroup } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import { BaseModal } from '@/Components/Base/BaseModal';
import { ModalTitle } from '@/Components/Base/ModalTitle';
import { ServiceBadge } from '@/Components/Calculator/ServiceBadge';
import type { FreightCorridor } from '@/types';

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
 * Built on `BaseModal`.
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
    <BaseModal
      show={isOpen}
      onHide={handleClose}
      onExited={() => setSelectedIds(currentSelectedIds)}
      title={
        <ModalTitle
          icon={<SlidersHorizontal size={20} />}
          title={t('CONFIGURE QUICK-SELECT ROUTES')}
          subtitle={t('Select up to 5 favorite routes to display as quick-access buttons.')}
        />
      }
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>
            {t('Cancel')}
          </Button>
          <Button variant="success" onClick={handleSave} disabled={isPending}>
            {isPending ? t('Saving...') : t('Save Selection')}
          </Button>
        </>
      }
    >
      {/* Header count info */}
      <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between mb-3 aa-modal-card small font-monospace">
        <span className="d-flex align-items-center gap-2">
          <Sparkles size={14} className="text-info" />
          {t('Favorite Corridor Buttons')}
        </span>
        <Badge bg={selectedIds.length >= MAX_QUICK_PRESETS ? 'warning' : 'info'}>
          {selectedIds.length} / {MAX_QUICK_PRESETS} {t('selected')}
        </Badge>
      </div>

      {corridors.length === 0 ? (
        <div className="text-center py-4 small font-monospace text-body-secondary">
          {t('No route presets available to configure.')}
        </div>
      ) : (
        <ListGroup className="overflow-y-auto" variant="flush">
          {corridors.map((corridor) => {
            const id = Number(corridor.id);
            const isSelected = selectedIds.includes(id);
            const isDisabled = !isSelected && selectedIds.length >= MAX_QUICK_PRESETS;

            return (
              <ListGroup.Item
                key={id}
                action={!isDisabled}
                active={isSelected}
                disabled={isDisabled}
                onClick={() => !isDisabled && handleToggle(id)}
                className="d-flex flex-wrap gap-2 align-items-center justify-content-between"
              >
                <div className="d-flex align-items-center gap-3">
                  <Form.Check
                    type="checkbox"
                    id={`corridor-check-${id}`}
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => handleToggle(id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div>
                    <div className="fw-semibold small">{corridor.name}</div>
                    <div className="small font-monospace">
                      <span className="text-info">{corridor.origin_system}</span>
                      <span> ➔ </span>
                      <span className="text-warning">{corridor.destination_system}</span>
                    </div>
                  </div>
                </div>
                <ServiceBadge serviceType={corridor.service_type} />
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      )}
    </BaseModal>
  );
}
