// Third Party
import { Alert } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { ConfirmDeleteModal } from "@/Components/Base/ConfirmDeleteModal";

export interface AdministrationDeleteModalProps {
  isOpen: boolean;
  handlerName: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/** Confirmation before a handler and all its contracts are deleted. */
export function AdministrationDeleteModal({
  isOpen,
  handlerName,
  isPending,
  onClose,
  onConfirm,
}: AdministrationDeleteModalProps) {
  const { t } = useTranslation();

  return (
    <ConfirmDeleteModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      isPending={isPending}
      title={t("Confirm Deletion")}
      confirmText={t("Delete Handler")}
      pendingText={t("Delete Handler")}
    >
      <p>
        {t("Are you sure you want to delete")} <strong>{handlerName}</strong>?
      </p>
      <Alert variant="warning" className="small mb-0">
        {t("This removes the handler and all of its contracts. This cannot be undone.")}
      </Alert>
    </ConfirmDeleteModal>
  );
}

export default AdministrationDeleteModal;
