// Third Party
import { Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import { getHandlerStatus } from "@/Components/Administration/status";

export interface HandlerStatusBadgeProps {
  status: string;
}

/** Badge showing the sync status of a handler. */
export function HandlerStatusBadge({ status }: HandlerStatusBadgeProps) {
  const { t } = useTranslation();
  const { variant, label } = getHandlerStatus(t, status);
  return <Badge bg={variant}>{label}</Badge>;
}

export default HandlerStatusBadge;
