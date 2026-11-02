// Third Party
import { Form } from 'react-bootstrap';

export interface RouteNumberFieldProps {
  /** Label above the input */
  label: string;
  /** Current value */
  value: number;
  /** Callback with the new numeric value */
  onChange: (value: number) => void;
  step?: string;
  min?: string;
  max?: string;
}

/** Labelled number input used for tariffs and limits of a route preset. */
export function RouteNumberField({ label, value, onChange, step, min, max }: RouteNumberFieldProps) {
  return (
    <Form.Group>
      <Form.Label className="small text-body-secondary">{label}</Form.Label>
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
