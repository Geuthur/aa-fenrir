// React
import type { ReactNode } from "react";

export interface ModalTitleProps {
  /** Icon shown in front of the title */
  icon?: ReactNode;
  /** Title text */
  title: ReactNode;
  /** Optional small description below the title */
  subtitle?: ReactNode;
}

/** Title block for `BaseModal` (icon, title and optional subtitle). */
export function ModalTitle({ icon, title, subtitle }: ModalTitleProps) {
  return (
    <div className="d-flex align-items-center gap-2">
      {icon && <span className="text-info flex-shrink-0">{icon}</span>}
      <div>
        <div>{title}</div>
        {subtitle && <p className="small fw-normal font-monospace text-body-secondary mb-0">{subtitle}</p>}
      </div>
    </div>
  );
}

export default ModalTitle;
