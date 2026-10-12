// A labelled input with its hint and error right under it. The error and hint
// are tied to the input, so a screen reader reads them when the field gets focus.
export default function FormField({ label, name, hint, error, ...inputProps }) {
  const hintId = hint ? `${name}-hint` : null;
  const errorId = error ? `${name}-error` : null;

  return (
    <div className='field'>
      <label>
        {label}
        <input
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          {...inputProps} />
      </label>
      {hint && <p id={hintId} className='field-hint'>{hint}</p>}
      {error && <p id={errorId} className='field-error'>{error}</p>}
    </div>
  );
}
