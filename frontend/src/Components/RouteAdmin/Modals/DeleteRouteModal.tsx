// Third Party
import { useTranslation } from 'react-i18next';

import { ConfirmDeleteModal } from '@/Components/Base/ConfirmDeleteModal';
import type { FreightCorridor } from '@/types';

export interface DeleteRouteModalProps {
  /** The route preset selected for deletion (or null if closed) */
  preset: FreightCorridor | null;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when user confirms deletion of the preset */
  onConfirm: (presetId: number) => void;
  /** Whether the deletion request is currently pending */
  isPending: boolean;
}

/**
 * Confirmation modal for permanently deleting a route preset.
 * Built on `ConfirmDeleteModal`.
 * Belongs to the RouteAdmin page (`src/Pages/RouteAdmin.tsx`).
 */
export function DeleteRouteModal({
  preset,
  onClose,
  onConfirm,
  isPending,
}: DeleteRouteModalProps) {
  const { t } = useTranslation();

  return (
    <ConfirmDeleteModal
      isOpen={Boolean(preset)}
      onClose={onClose}
      onConfirm={() => preset && onConfirm(Number(preset.id))}
      isPending={isPending}
      title={t('DELETE ROUTE PRESET')}
      subtitle={t('Confirm permanent removal of this corridor.')}
      confirmText={t('Delete Route')}
      pendingText={t('Deleting...')}
    >
      {preset && (
        <>
          <p>{t('Are you sure you want to delete this route preset?')}</p>
          <div className="p-3 rounded-3 border bg-body-tertiary font-monospace small">
            <div className="fw-bold">{preset.name}</div>
            <div className="d-flex flex-wrap align-items-center gap-2 text-body-secondary">
              <span className="text-info">{preset.origin_system}</span>
              <span>➔</span>
              <span className="text-warning">{preset.destination_system}</span>
            </div>
          </div>
          <p className="small font-monospace text-danger mt-3 mb-0">{t('This action cannot be undone.')}</p>
        </>
      )}
    </ConfirmDeleteModal>
  );
}
