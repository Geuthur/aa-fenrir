// Third Party
import { ShieldAlert, Trash2 } from "lucide-react";
import { Alert, Button, Modal, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

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
    <Modal show={isOpen} onHide={onClose} centered contentClassName="aa-react">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center gap-2 text-danger">
          <ShieldAlert size={20} />
          {t("Confirm Deletion")}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          {t("Are you sure you want to delete")} <strong>{handlerName}</strong>?
        </p>
        <Alert variant="warning" className="small mb-0">
          {t("This removes the handler and all of its contracts. This cannot be undone.")}
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={isPending}>
          {t("Cancel")}
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isPending}>
          {isPending ? (
            <Spinner size="sm" animation="border" className="me-1" />
          ) : (
            <Trash2 size={14} className="me-1" />
          )}
          {t("Delete Handler")}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AdministrationDeleteModal;
