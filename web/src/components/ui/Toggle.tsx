import './Toggle.css';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  className?: string;
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  label,
  className = '',
}: ToggleProps) {
  return (
    <label className={`toggle-wrapper ${className}`}>
      <div className={`toggle toggle-${size} ${checked ? 'toggle-checked' : ''} ${disabled ? 'toggle-disabled' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="toggle-input"
        />
        <span className="toggle-track">
          <span className="toggle-thumb" />
        </span>
      </div>
      {label && <span className="toggle-label">{label}</span>}
    </label>
  );
}
