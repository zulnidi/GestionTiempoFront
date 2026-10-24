/** Campo accesible: etiqueta, input y mensaje de error enlazados con aria. */
export default function FormField({ id, label, error, hint, type = 'text', ...inputProps }) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ');
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />
      {hint && (
        <p id={`${id}-hint`} className="hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
