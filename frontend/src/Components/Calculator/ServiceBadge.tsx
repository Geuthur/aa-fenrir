// Third Party
import { Badge } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

import { getServiceBadge } from '@/Components/Calculator/calculator';

export interface ServiceBadgeProps {
  /** Service type of the corridor, e.g. `jump_freighter` */
  serviceType: string;
}

/** Badge showing the freight service profile of a corridor. */
export function ServiceBadge({ serviceType }: ServiceBadgeProps) {
  const { t } = useTranslation();
  const badge = getServiceBadge(serviceType);

  return (
    <Badge bg={badge.variant} className="font-monospace fw-normal">
      {t(badge.label)}
    </Badge>
  );
}

export default ServiceBadge;
