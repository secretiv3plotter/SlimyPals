import { useState } from 'react'
import PasswordField from './PasswordField'

function LoginForm({ isLoading, onSubmit, onSwitchMode }) {
  const [form, setForm] = useState({
    identifier: '',
    password: '',
    rememberMe: true,
  })

  function updateField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    await onSubmit({
      identifier: form.identifier,
      password: form.password,
      rememberMe: form.rememberMe,
    })
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-field">
        <span className="auth-field-label">USERNAME</span>
        <input
          className="auth-input"
          type="text"
          name="identifier"
          autoComplete="username"
          placeholder="Enter your username"
          value={form.identifier}
          onChange={(event) => updateField('identifier', event.target.value)}
          disabled={isLoading}
          required
        />
      </label>

      <PasswordField
        autoComplete="current-password"
        disabled={isLoading}
        label="PASSWORD"
        name="password"
        onChange={(event) => updateField('password', event.target.value)}
        placeholder="Enter your password"
        required
        value={form.password}
      />

      <label className="auth-check">
        <input
          type="checkbox"
          checked={form.rememberMe}
          onChange={(event) => updateField('rememberMe', event.target.checked)}
          disabled={isLoading}
        />
        <span>Remember this device</span>
      </label>

      <div className="auth-actions">
        <button className="auth-primary-button" type="submit" disabled={isLoading}>
          {isLoading ? 'LOGGING IN...' : 'ENTER THE YARD'}
        </button>
        <button
          className="auth-secondary-button"
          type="button"
          onClick={onSwitchMode}
          disabled={isLoading}
        >
          CREATE A NEW ACCOUNT
        </button>
      </div>

      <p className="auth-footer">Forgot your account? Use the register tab to start fresh.</p>
    </form>
  )
}

export default LoginForm
