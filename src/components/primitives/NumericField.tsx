import { forwardRef, useId, type InputHTMLAttributes } from 'react';

export type FieldState = 'idle' | 'valid' | 'invalid';

interface NumericFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  state?: FieldState;
  message?: string;
}

const ring: Record<FieldState, string> = {
  idle: 'ring-line focus-within:ring-magenta',
  valid: 'ring-lime/70',
  invalid: 'ring-pink/80',
};

/** Large numeric input row: label on the left, value on the right, inline validation below. */
export const NumericField = forwardRef<HTMLInputElement, NumericFieldProps>(function NumericField(
  { label, value, onChange, unit, state = 'idle', message, readOnly, className = '', ...rest },
  ref,
) {
  const id = useId();
  const msgId = `${id}-msg`;
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={`flex min-h-16 items-center justify-between gap-4 rounded-inner px-5 ring-1 transition-shadow ${ring[state]} ${
          readOnly ? 'bg-white/4' : 'bg-surface-high'
        }`}
      >
        <span className={`text-[15px] ${readOnly ? 'text-faint' : 'text-muted'}`}>{label}</span>
        <span className="flex items-baseline gap-1.5">
          <input
            ref={ref}
            id={id}
            inputMode="decimal"
            autoComplete="off"
            value={value}
            readOnly={readOnly}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={state === 'invalid'}
            aria-describedby={message ? msgId : undefined}
            className={`num w-28 bg-transparent text-right font-mono text-lg font-semibold outline-none placeholder:text-faint ${
              readOnly ? 'text-muted' : 'text-ink'
            }`}
            {...rest}
          />
          {unit && <span className="text-sm text-muted">{unit}</span>}
        </span>
      </label>
      {message && (
        <p id={msgId} role="status" className={`mt-1.5 px-2 text-sm ${state === 'invalid' ? 'text-[#f9a8d4]' : 'text-lime'}`}>
          {message}
        </p>
      )}
    </div>
  );
});
