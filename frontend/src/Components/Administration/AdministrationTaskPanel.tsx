// Third Party
import { RefreshCw } from "lucide-react";
import { Button, Card, Form, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface AdministrationTaskPanelProps {
  forceRefresh: boolean;
  onToggleForceRefresh: (checked: boolean) => void;
  isPending: boolean;
  onUpdateAll: () => void;
}

/** Global update of all handlers, superusers only. */
export function AdministrationTaskPanel({
  forceRefresh,
  onToggleForceRefresh,
  isPending,
  onUpdateAll,
}: AdministrationTaskPanelProps) {
  const { t } = useTranslation();

  return (
    <Card className="bg-body border-secondary mb-3 shadow-sm">
      <Card.Body className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-3">
        <div>
          <h6 className="mb-1">{t("Global Task Administration")}</h6>
          <p className="mb-0 small text-muted">
            {t("Queue background tasks to synchronize all handlers.")}
          </p>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-3">
          <Form.Check
            type="switch"
            id="global-force-refresh"
            label={<span className="small">{t("Force Refresh ESI")}</span>}
            checked={forceRefresh}
            onChange={(e) => onToggleForceRefresh(e.target.checked)}
          />
          <Button
            variant="primary"
            size="sm"
            disabled={isPending}
            onClick={onUpdateAll}
            className="d-inline-flex align-items-center gap-1"
          >
            {isPending ? <Spinner size="sm" animation="border" /> : <RefreshCw size={14} />}
            {t("Update All Handlers")}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default AdministrationTaskPanel;
