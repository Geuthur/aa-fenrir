// React
import type { ReactNode } from 'react';

// Third Party
import { BaseModal } from "aa-geuthur-react";
import { AlertTriangle } from 'lucide-react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import { ModalTitle } from '@/Components/Base/ModalTitle';

export interface ConfirmDeleteModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when the user confirms */
  onConfirm: () => void;
  /** Whether the delete request is currently pending */
  isPending: boolean;
  /** Modal title */
  title: ReactNode;
  /** Small description below the title */
  subtitle?: ReactNode;
  /** Label of the confirm button */
  confirmText: string;
  /** Label of the confirm button while pending */
  pendingText: string;
  /** Body content (question and details) */
  children?: ReactNode;
}

/** Confirmation dialog for destructive actions, built on `BaseModal`. */
export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  title,
  subtitle,
  confirmText,
  pendingText,
  children,
}: ConfirmDeleteModalProps) {
  const { t } = useTranslation();

  return (
    <BaseModal
      show={isOpen}
      onHide={onClose}
      title={<ModalTitle icon={<AlertTriangle size={20} className="text-danger" />} title={title} subtitle={subtitle} />}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            {t('Cancel')}
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={isPending}>
            {isPending ? pendingText : confirmText}
          </Button>
        </>
      }
    >
      {children}
    </BaseModal>
  );
}

export default ConfirmDeleteModal;
