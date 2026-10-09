import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  /** Adds a show/hide toggle for password fields. */
  secret?: boolean;
}

/** Labelled text input with inline error, used by the registration and login forms. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, value, onChange, error, hint, secret, type = 'text', className = '', ...rest },
  ref,
) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[15px] text-muted">
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={secret && !shown ? 'password' : secret ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`min-h-13 w-full rounded-inner bg-surface-high px-4 text-[16px] ring-1 outline-none transition-shadow placeholder:text-faint focus:ring-magenta ${
            error ? 'ring-pink/80' : 'ring-line'
          } ${secret ? 'pr-12' : ''}`}
          {...rest}
        />
        {secret && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? 'Скрыть пароль' : 'Показать пароль'}
            aria-pressed={shown}
            className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-white/8 hover:text-ink"
          >
            {shown ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm text-[#f9a8d4]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
