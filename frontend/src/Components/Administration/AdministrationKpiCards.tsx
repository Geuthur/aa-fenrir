// Third Party
import { AlertTriangle, CheckCircle2, Package, Truck } from "lucide-react";
import { Card, Col, Row } from "react-bootstrap";
import { useTranslation } from "react-i18next";

export interface AdministrationMetrics {
  total: number;
  synced: number;
  issues: number;
  openContracts: number;
}

export interface AdministrationKpiCardsProps {
  metrics: AdministrationMetrics;
}

/** Summary cards on top of the Administration. */
export function AdministrationKpiCards({ metrics }: AdministrationKpiCardsProps) {
  const { t } = useTranslation();

  const cards = [
    { label: t("Handlers"), value: metrics.total, icon: <Truck size={24} />, tone: "secondary" },
    { label: t("Synced"), value: metrics.synced, icon: <CheckCircle2 size={24} />, tone: "success" },
    {
      label: t("Sync Issues"),
      value: metrics.issues,
      icon: <AlertTriangle size={24} />,
      tone: metrics.issues > 0 ? "danger" : "success",
    },
    { label: t("Open Contracts"), value: metrics.openContracts, icon: <Package size={24} />, tone: "info" },
  ];

  return (
    <Row className="g-3 mb-3">
      {cards.map((card) => (
        <Col key={card.label} xs={12} sm={6} md={3}>
          <Card className="bg-body border-secondary h-100 shadow-sm">
            <Card.Body className="p-3 d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted small fw-semibold">{card.label}</span>
                <h4 className={`mb-0 fw-bold text-${card.tone}`}>{card.value}</h4>
              </div>
              <div className={`p-2 rounded-3 bg-${card.tone} bg-opacity-10 text-${card.tone}`}>
                {card.icon}
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default AdministrationKpiCards;
