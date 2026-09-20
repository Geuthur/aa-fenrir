// React
import { useEffect, useState } from 'react';

// Third Party
import { AlertTriangle } from 'lucide-react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import { FenrirModal } from '@/Components/Modals';
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
 * Built on top of react-bootstrap Modal via FenrirModal.
 * Belongs to the RouteAdmin page (`src/Pages/RouteAdmin.tsx`).
 */
export function DeleteRouteModal({
  preset,
  onClose,
  onConfirm,
  isPending,
}: DeleteRouteModalProps) {
  const { t } = useTranslation();

  // Preserve the last active preset during exit animation to prevent modal shrink/flicker
  const [displayedPreset, setDisplayedPreset] = useState<FreightCorridor | null>(preset);

  useEffect(() => {
    if (preset) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayedPreset(preset);
    }
  }, [preset]);

  const currentPreset = preset || displayedPreset;

  return (
    <FenrirModal
      isOpen={Boolean(preset)}
      onClose={onClose}
      onExited={() => setDisplayedPreset(null)}
      size="lg"
    >
      <FenrirModal.Header>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg !bg-red-950/60 border !border-red-500/40 !text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <FenrirModal.Title>{t('DELETE ROUTE PRESET')}</FenrirModal.Title>
            <p className="text-[11px] !text-slate-400 font-mono m-0">
              {t('Confirm permanent removal of this corridor.')}
            </p>
          </div>
        </div>
      </FenrirModal.Header>

      <FenrirModal.Body>
        {currentPreset && (
          <div className="space-y-3 text-sm !text-slate-300">
            <p>{t('Are you sure you want to delete this route preset?')}</p>
            <div className="p-3.5 rounded-lg !bg-slate-900/80 border !border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="font-bold !text-white text-sm">{currentPreset.name}</div>
              <div className="flex items-center gap-1.5 !text-slate-400">
                <span className="!text-cyan-400">{currentPreset.origin_system}</span>
                <span>➔</span>
                <span className="!text-indigo-400">{currentPreset.destination_system}</span>
              </div>
            </div>
            <p className="text-xs !text-red-400/90 font-mono m-0">
              {t('This action cannot be undone.')}
            </p>
          </div>
        )}
      </FenrirModal.Body>

      <FenrirModal.Footer>
        <div className="flex justify-end gap-3 w-full">
          <Button
            variant="primary"
            onClick={onClose}
            className="text-xs font-semibold"
          >
            {t('Cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={() => currentPreset && onConfirm(Number(currentPreset.id))}
            disabled={isPending || !currentPreset}
            className="text-xs font-semibold"
          >
            {isPending ? t('Deleting...') : t('Delete Route')}
          </Button>
        </div>
      </FenrirModal.Footer>
    </FenrirModal>
  );
}
