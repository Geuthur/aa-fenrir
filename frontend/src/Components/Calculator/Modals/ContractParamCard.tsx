// Third Party
import { Check, Copy } from 'lucide-react';
import { Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

export interface ContractParamCardProps {
  /** Small label above the value */
  label: string;
  /** Value shown in the card */
  value: string;
  /** Text color class of the value (Bootstrap), e.g. `text-success` */
  valueClassName?: string;
  /** Border color class of the card (Bootstrap), e.g. `border-success` */
  borderClassName?: string;
  /** Text color class of the copy icon (Bootstrap) */
  copyIconClassName?: string;
  /** Raw text that is copied; no copy button is shown when missing */
  copyText?: string;
  /** Whether the copied state is active */
  isCopied?: boolean;
  /** Callback after the user clicked copy */
  onCopy?: (text: string) => void;
  /** Show a "Copy" label next to the icon */
  showCopyLabel?: boolean;
}

/** Single parameter of the in-game courier contract, optionally copyable. */
export function ContractParamCard({
  label,
  value,
  valueClassName = '',
  borderClassName = '',
  copyIconClassName = 'text-body-secondary',
  copyText,
  isCopied = false,
  onCopy,
  showCopyLabel = false,
}: ContractParamCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className={`d-flex align-items-center justify-content-between gap-2 p-3 rounded-3 border bg-body ${borderClassName}`}
    >
      <div className="text-truncate">
        <div className="small text-uppercase font-monospace text-body-secondary">{label}</div>
        <div className={`fw-bold font-monospace text-truncate ${valueClassName}`}>{value}</div>
      </div>
      {copyText !== undefined && (
        <Button
          variant="outline-secondary"
          size="sm"
          className="flex-shrink-0"
          onClick={() => onCopy?.(copyText)}
        >
          {isCopied ? <Check size={14} className="text-success" /> : <Copy size={14} className={copyIconClassName} />}
          {showCopyLabel && <span>{isCopied ? t('Copied') : t('Copy')}</span>}
        </Button>
      )}
    </div>
  );
}

export default ContractParamCard;
