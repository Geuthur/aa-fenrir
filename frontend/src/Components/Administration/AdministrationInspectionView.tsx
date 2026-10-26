// Third Party
import { ArrowLeft } from "lucide-react";
import { Button, Card, Col, Row, Table } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { HandlerStatusBadge } from "@/Components/Administration/HandlerStatusBadge";
import { useAdministrationHandler } from "@/Components/Administration/Hooks";
import { getContractStatusLabel } from "@/Components/Administration/status";
import { formatIskCompact, formatM3 } from "@/Components/Calculator/calculator";
import ErrorLoader from "@/Components/Loader/ErrorLoader";
import FetchingLoader from "@/Components/Loader/FetchingLoader";

export interface AdministrationInspectionViewProps {
  corporationId: number;
  onBack: () => void;
}

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : "-");

/** Detail view of one handler with contract statistics and recent notifications. */
export function AdministrationInspectionView({
  corporationId,
  onBack,
}: AdministrationInspectionViewProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useAdministrationHandler(corporationId);

  const backButton = (
    <Button variant="outline-secondary" size="sm" className="mb-3" onClick={onBack}>
      <ArrowLeft size={14} className="me-1" />
      {t("Back")}
    </Button>
  );

  if (isLoading) {
    return (
      <>
        {backButton}
        <FetchingLoader message={t("Loading handler...")} />
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        {backButton}
        <ErrorLoader
          title={t("Error")}
          message={t("Failed to load handler. Please try again.")}
        />
      </>
    );
  }

  const summary = [
    { label: t("Contracts"), value: data.contracts_total.toLocaleString() },
    { label: t("Total Reward"), value: formatIskCompact(data.total_reward) },
    { label: t("Total Collateral"), value: formatIskCompact(data.total_collateral) },
    { label: t("Total Volume"), value: formatM3(data.total_volume) },
  ];

  return (
    <>
      {backButton}

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <h2 className="h4 mb-0">{data.name}</h2>
        <HandlerStatusBadge status={data.status} />
      </div>
      <p className="small text-muted">
        {t("Character")}: {data.character_name ?? "-"} · {t("Last Sync")}:{" "}
        {formatDate(data.last_sync)} · {t("First Contract")}: {formatDate(data.first_issued)} ·{" "}
        {t("Latest Contract")}: {formatDate(data.last_issued)}
      </p>

      <Row className="g-3 mb-3">
        {summary.map((item) => (
          <Col key={item.label} xs={6} md={3}>
            <Card className="bg-body border-secondary h-100 shadow-sm">
              <Card.Body className="p-3">
                <span className="text-muted small fw-semibold">{item.label}</span>
                <h5 className="mb-0 fw-bold">{item.value}</h5>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <h3 className="h6">{t("Contracts by Status")}</h3>
      {data.stats.length === 0 ? (
        <p className="text-muted">{t("No contracts yet.")}</p>
      ) : (
        <div className="table-responsive mb-3">
          <Table size="sm" className="align-middle mb-0">
            <thead>
              <tr>
                <th>{t("Status")}</th>
                <th className="text-end">{t("Contracts")}</th>
                <th className="text-end">{t("Reward")}</th>
                <th className="text-end">{t("Collateral")}</th>
                <th className="text-end">{t("Volume")}</th>
              </tr>
            </thead>
            <tbody>
              {data.stats.map((row) => (
                <tr key={row.status}>
                  <td>{getContractStatusLabel(t, row.status)}</td>
                  <td className="text-end">{row.count.toLocaleString()}</td>
                  <td className="text-end text-nowrap">{formatIskCompact(row.reward)}</td>
                  <td className="text-end text-nowrap">{formatIskCompact(row.collateral)}</td>
                  <td className="text-end text-nowrap">{formatM3(row.volume)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <h3 className="h6">{t("Recent Notifications")}</h3>
      {data.recent_notifications.length === 0 ? (
        <p className="text-muted mb-0">{t("No notifications sent yet.")}</p>
      ) : (
        <div className="table-responsive">
          <Table size="sm" className="align-middle mb-0">
            <thead>
              <tr>
                <th>{t("Contract")}</th>
                <th>{t("Status")}</th>
                <th>{t("Notified")}</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_notifications.map((notification) => (
                <tr key={`${notification.contract_id}-${notification.status}`}>
                  <td>{notification.contract_id}</td>
                  <td>{getContractStatusLabel(t, notification.status)}</td>
                  <td className="text-nowrap">{formatDate(notification.date_notified)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </>
  );
}

export default AdministrationInspectionView;
