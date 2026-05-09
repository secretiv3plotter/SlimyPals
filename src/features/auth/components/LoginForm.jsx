import { useState } from 'react'
import PasswordField from './PasswordField'

function LoginForm({ isLoading, onSubmit }) {
  const [form, setForm] = useState({
    identifier: '',
    password: '',
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

      <div className="auth-actions">
        <button className="auth-primary-button" type="submit" disabled={isLoading}>
          {isLoading ? 'LOGGING IN...' : 'ENTER THE YARD'}
        </button>
      </div>
    </form>
  )
}

export default LoginForm
