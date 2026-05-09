import { useState } from 'react'
import PasswordField from './PasswordField'

function RegisterForm({ isLoading, onSubmit, onSwitchMode }) {
  const [form, setForm] = useState({
    confirmPassword: '',
    password: '',
    username: '',
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
      confirmPassword: form.confirmPassword,
      password: form.password,
      username: form.username,
    })
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label className="auth-field">
        <span className="auth-field-label">USERNAME</span>
        <input
          className="auth-input"
          type="text"
          name="username"
          autoComplete="username"
          placeholder="Choose a slimekeeper name"
          value={form.username}
          onChange={(event) => updateField('username', event.target.value)}
          disabled={isLoading}
          required
        />
      </label>

      <div className="auth-form-row">
        <PasswordField
          autoComplete="new-password"
          disabled={isLoading}
          label="PASSWORD"
          name="password"
          onChange={(event) => updateField('password', event.target.value)}
          placeholder="Create a password"
          required
          value={form.password}
        />

        <PasswordField
          autoComplete="new-password"
          disabled={isLoading}
          label="CONFIRM"
          name="confirmPassword"
          onChange={(event) => updateField('confirmPassword', event.target.value)}
          placeholder="Repeat the password"
          required
          value={form.confirmPassword}
        />
      </div>

      <label className="auth-check">
        <input type="checkbox" disabled={isLoading} required />
        <span>I agree to care for my slimes responsibly.</span>
      </label>

      <div className="auth-actions">
        <button className="auth-primary-button" type="submit" disabled={isLoading}>
          {isLoading ? 'CREATING...' : 'CREATE ACCOUNT'}
        </button>
        <button
          className="auth-secondary-button"
          type="button"
          onClick={onSwitchMode}
          disabled={isLoading}
        >
          I ALREADY HAVE AN ACCOUNT
        </button>
      </div>

      <p className="auth-footer">You can rename your slime empire later if you want.</p>
    </form>
  )
}

export default RegisterForm
