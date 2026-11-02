// Third Party
import { useTranslation } from 'react-i18next';

import type { components } from '@/Api/OpenApi';
import { ConfirmDeleteModal } from '@/Components/Base/ConfirmDeleteModal';

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

  return (
    <ConfirmDeleteModal
      isOpen={Boolean(system)}
      onClose={onClose}
      onConfirm={() => system && onConfirm(system.id)}
      isPending={isPending}
      title={t('REMOVE AVAILABLE SYSTEM')}
      subtitle={t('Confirm removal of this solar system from available routes.')}
      confirmText={t('Remove System')}
      pendingText={t('Removing...')}
    >
      {system && (
        <>
          <p>
            {t('Are you sure you want to remove {{name}} from available route systems?', {
              name: system.name,
            })}
          </p>
          <div className="aa-modal-card font-monospace small">
            <div className="fw-bold">{system.name}</div>
            {system.region_name && (
              <div className="text-body-secondary">
                {t('Region:')} {system.region_name}
              </div>
            )}
          </div>
          <p className="small font-monospace text-danger mt-3 mb-0">
            {t('Routes currently utilizing this system may need to be updated.')}
          </p>
        </>
      )}
    </ConfirmDeleteModal>
  );
}
