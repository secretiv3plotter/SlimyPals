import { useId, useState } from 'react'

function EyeIcon({ isVisible }) {
  return isVisible ? (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 5C6.5 5 2.3 9 1 12c1.3 3 5.5 7 11 7s9.7-4 11-7c-1.3-3-5.5-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
        fill="currentColor"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M2.2 4.8 19.2 21.8l1.4-1.4-2.7-2.7c2.5-1.7 4.3-4 5.1-5.7-1.3-3-5.5-7-11-7-1.4 0-2.7.2-3.9.6L3.6 3.4 2.2 4.8Zm9.8 3.2a4 4 0 0 1 4 4c0 .6-.1 1.1-.3 1.6l-5.3-5.3c.5-.2 1-.3 1.6-.3Zm-9 4c1.3 3 5.5 7 11 7 .8 0 1.6-.1 2.3-.2L3.9 7.5C2.9 8.5 2.2 9.5 1.9 10c-.1.3-.1 1.8 1.1 2.9Z"
        fill="currentColor"
      />
    </svg>
  )
}

function PasswordField({
  autoComplete,
  disabled,
  label,
  name,
  onChange,
  placeholder,
  required = false,
  value,
}) {
  const [isVisible, setIsVisible] = useState(false)
  const inputId = useId()

  return (
    <div className="auth-field">
      <label className="auth-field-label" htmlFor={inputId}>
        {label}
      </label>
      <div className="auth-password-control">
        <input
          id={inputId}
          className="auth-input auth-password-input"
          type={isVisible ? 'text' : 'password'}
          name={name}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
        />
        <button
          className="auth-password-toggle"
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          disabled={disabled}
        >
          <EyeIcon isVisible={isVisible} />
        </button>
      </div>
    </div>
  )
}

export default PasswordField
