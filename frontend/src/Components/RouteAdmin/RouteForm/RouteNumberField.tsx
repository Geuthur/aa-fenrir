// Third Party
import { Form } from 'react-bootstrap';

export interface RouteNumberFieldProps {
  /** Label above the input */
  label: string;
  /** Current value */
  value: number;
  /** Callback with the new numeric value */
  onChange: (value: number) => void;
  /** Readable form of the value, shown between label and input */
  hint?: string;
  /** Text color class of the hint (Bootstrap) */
  hintClassName?: string;
  step?: string;
  min?: string;
  max?: string;
}

/** Labelled number input used for tariffs and limits of a route preset. */
export function RouteNumberField({
  label,
  value,
  onChange,
  hint,
  hintClassName = 'text-warning',
  step,
  min,
  max,
}: RouteNumberFieldProps) {
  return (
    <Form.Group>
      <Form.Label className={hint ? 'd-block mb-0' : undefined}>{label}</Form.Label>
      {hint && <div className={`small font-monospace fw-bold mb-1 ${hintClassName}`}>{hint}</div>}
      <Form.Control
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Form.Group>
  );
}

export default RouteNumberField;
