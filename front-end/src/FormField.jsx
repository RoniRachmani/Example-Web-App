import { useState } from 'react';

// A labelled input with its hint and error right under it. The error and hint
// are tied to the input, so a screen reader reads them when the field gets focus.
export default function FormField({ label, name, hint, error, ...inputProps }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = inputProps.type === 'password';
  const hintId = hint ? `${name}-hint` : null;
  const errorId = error ? `${name}-error` : null;

  return (
    <div className='field'>
      <label htmlFor={name}>
        {label}
      </label>
      <div className={isPassword ? 'password-input' : undefined}>
        <input
          id={name}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          {...inputProps}
          type={isPassword && showPassword ? 'text' : inputProps.type} />
        {isPassword && <button type='button' className='password-toggle'
          aria-controls={name} aria-pressed={showPassword}
          aria-label={`Show ${label.toLowerCase()}`}
          onClick={() => setShowPassword(visible => !visible)}>
          {showPassword ? 'Hide' : 'Show'}
        </button>}
      </div>
      {hint && <p id={hintId} className='field-hint'>{hint}</p>}
      {error && <p id={errorId} className='field-error'>{error}</p>}
    </div>
  );
}
