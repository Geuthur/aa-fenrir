// React
import { useEffect, useState } from 'react';

// Third Party
import { AlertTriangle } from 'lucide-react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import type { components } from '@/Api/OpenApi';
import { FenrirModal } from '@/Components/Modals';

type RouteSystemItem = components['schemas']['RouteSystemSchema'];

export interface DeleteRouteSystemModalProps {
  system: RouteSystemItem | null;
  onClose: () => void;
  onConfirm: (systemId: number) => void;
  isPending: boolean;
}

export function DeleteRouteSystemModal({
  system,
  onClose,
  onConfirm,
  isPending,
}: DeleteRouteSystemModalProps) {
  const { t } = useTranslation();
  const [displayedSystem, setDisplayedSystem] = useState<RouteSystemItem | null>(system);

  useEffect(() => {
    if (system) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayedSystem(system);
    }
  }, [system]);

  const currentSystem = system || displayedSystem;

  return (
    <FenrirModal
      isOpen={Boolean(system)}
      onClose={onClose}
      onExited={() => setDisplayedSystem(null)}
      size="lg"
    >
      <FenrirModal.Header>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg !bg-red-950/60 border !border-red-500/40 !text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <FenrirModal.Title>{t('REMOVE AVAILABLE SYSTEM')}</FenrirModal.Title>
            <p className="text-[11px] !text-slate-400 font-mono m-0">
              {t('Confirm removal of this solar system from available routes.')}
            </p>
          </div>
        </div>
      </FenrirModal.Header>

      <FenrirModal.Body>
        {currentSystem && (
          <div className="space-y-3 text-sm !text-slate-300">
            <p>
              {t('Are you sure you want to remove {{name}} from available route systems?', {
                name: currentSystem.name,
              })}
            </p>
            <div className="p-3.5 rounded-lg !bg-slate-900/80 border !border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="font-bold !text-white text-sm">{currentSystem.name}</div>
              {currentSystem.region_name && (
                <div className="text-[11px] !text-slate-400">
                  {t('Region:')} {currentSystem.region_name}
                </div>
              )}
            </div>
            <p className="text-xs !text-red-400/90 font-mono m-0">
              {t('Routes currently utilizing this system may need to be updated.')}
            </p>
          </div>
        )}
      </FenrirModal.Body>

      <FenrirModal.Footer>
        <div className="flex justify-end gap-3 w-full">
          <Button
            variant="secondary"
            onClick={onClose}
            className="text-xs font-semibold"
          >
            {t('Cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={() => currentSystem && onConfirm(currentSystem.id)}
            disabled={isPending || !currentSystem}
            className="text-xs font-semibold"
          >
            {isPending ? t('Removing...') : t('Remove System')}
          </Button>
        </div>
      </FenrirModal.Footer>
    </FenrirModal>
  );
}

