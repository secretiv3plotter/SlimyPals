import { useRef, useState } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import brandName from '../../assets/brand/brandname.png'

const AUTH_MODES = Object.freeze({
  LOGIN: 'login',
  REGISTER: 'register',
})

const SLIDE_MIN = -50
const SLIDE_MAX = 0
const SLIDE_THRESHOLD = -25

function AuthScreen({
  onLogin = async () => {},
  onRegister = async () => {},
}) {
  const [mode, setMode] = useState(AUTH_MODES.LOGIN)
  const [previewMode, setPreviewMode] = useState(null)
  const [status, setStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [, forceRender] = useState(0)
  const dragRef = useRef(null)
  const visibleMode = previewMode ?? mode

  async function runAction(action, successMessage) {
    setStatus(null)
    setIsSubmitting(true)

    try {
      await action()
      setStatus({
        type: 'success',
        text: successMessage,
      })
    } catch (error) {
      setStatus({
        type: 'error',
        text: error?.message || 'Something went wrong. Please try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogin(values) {
    await runAction(
      () =>
        onLogin({
          identifier: values.identifier.trim(),
          password: values.password,
          rememberMe: values.rememberMe,
        }),
      'Welcome back. Loading your slime yard now.',
    )
  }

  async function handleRegister(values) {
    if (values.password !== values.confirmPassword) {
      setStatus({
        type: 'error',
        text: 'Passwords do not match.',
      })
      return
    }

    await runAction(
      () =>
        onRegister({
          password: values.password,
          username: values.username.trim(),
        }),
      'Account created. Your slime colony is ready.',
    )
  }

  function canStartDrag(target) {
    if (!(target instanceof Element)) {
      return true
    }

    return !target.closest('input, button, textarea, select, a, label')
  }

  function getSliderTranslate() {
    const drag = dragRef.current

    if (!drag) {
      return visibleMode === AUTH_MODES.LOGIN ? SLIDE_MAX : SLIDE_MIN
    }

    const baseTranslate =
      drag.mode === AUTH_MODES.LOGIN ? SLIDE_MAX : SLIDE_MIN
    const deltaX = drag.currentX - drag.startX
    const nextTranslate = baseTranslate + (deltaX / drag.width) * 50

    return Math.min(SLIDE_MAX, Math.max(SLIDE_MIN, nextTranslate))
  }

  function handlePointerDown(event) {
    if (event.button !== 0 || !canStartDrag(event.target)) {
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()

    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      currentX: event.clientX,
      mode: visibleMode,
      pointerId: event.pointerId,
      startX: event.clientX,
      width: Math.max(rect.width, 1),
    }

    forceRender((value) => value + 1)
  }

  function handlePointerMove(event) {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    dragRef.current = {
      ...drag,
      currentX: event.clientX,
    }

    forceRender((value) => value + 1)
  }

  function finishDrag(event) {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const baseTranslate =
      drag.mode === AUTH_MODES.LOGIN ? SLIDE_MAX : SLIDE_MIN
    const deltaX = drag.currentX - drag.startX
    const finalTranslate = baseTranslate + (deltaX / drag.width) * 50

    setMode(
      finalTranslate <= SLIDE_THRESHOLD
        ? AUTH_MODES.REGISTER
        : AUTH_MODES.LOGIN,
    )

    setPreviewMode(null)

    dragRef.current = null
    forceRender((value) => value + 1)
  }

  const isDragging = Boolean(dragRef.current)
  const sliderTranslate = getSliderTranslate()
  const screenMode = visibleMode

  return (
    <main className={`auth-screen auth-screen--${screenMode}`}>
      <section
        className="auth-stage"
        aria-label="Authentication"
        onPointerCancel={finishDrag}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
      >
        <div
          className={`auth-track${isDragging ? ' auth-track--dragging' : ''}`}
          style={{
            transform: `translateX(${sliderTranslate}%)`,
          }}
        >
          <div className="auth-slide">
            <AuthCard
              isActive={visibleMode === AUTH_MODES.LOGIN}
              isSubmitting={isSubmitting}
              mode={visibleMode}
              onLogin={handleLogin}
              onRegister={handleRegister}
              onCommitMode={(nextMode) => {
                setMode(nextMode)
                setPreviewMode(nextMode)
              }}
              onPreviewMode={setPreviewMode}
              status={status}
              variant={AUTH_MODES.LOGIN}
            />
          </div>

          <div className="auth-slide">
            <AuthCard
              isActive={visibleMode === AUTH_MODES.REGISTER}
              isSubmitting={isSubmitting}
              mode={visibleMode}
              onLogin={handleLogin}
              onRegister={handleRegister}
              onCommitMode={(nextMode) => {
                setMode(nextMode)
                setPreviewMode(nextMode)
              }}
              onPreviewMode={setPreviewMode}
              status={status}
              variant={AUTH_MODES.REGISTER}
            />
          </div>
        </div>
      </section>
    </main>
  )
}

function AuthCard({
  isActive,
  isSubmitting,
  mode,
  onLogin,
  onRegister,
  onCommitMode,
  onPreviewMode,
  status,
  variant,
}) {
  const isLoginCard = variant === AUTH_MODES.LOGIN
  const isRegisterCard = variant === AUTH_MODES.REGISTER

  return (
    <section
      className={`auth-card auth-card--${variant}`}
      aria-label={isLoginCard ? 'Log in' : 'Create account'}
    >
      <header className="auth-header">
        <img className="auth-brand" src={brandName} alt="Slimy Pals" draggable="false" />
      </header>

      <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
        <button
          id="auth-tab-login"
          className={`auth-tab${mode === AUTH_MODES.LOGIN ? ' auth-tab--active' : ''}`}
          type="button"
          role="tab"
          aria-selected={mode === AUTH_MODES.LOGIN}
          aria-controls="auth-panel-login"
          onMouseEnter={() => onPreviewMode(AUTH_MODES.LOGIN)}
          onMouseLeave={() => onPreviewMode(null)}
          onFocus={() => onPreviewMode(AUTH_MODES.LOGIN)}
          onBlur={() => onPreviewMode(null)}
          onClick={() => onCommitMode(AUTH_MODES.LOGIN)}
        >
          LOG IN
        </button>

        <button
          id="auth-tab-register"
          className={`auth-tab${mode === AUTH_MODES.REGISTER ? ' auth-tab--active' : ''}`}
          type="button"
          role="tab"
          aria-selected={mode === AUTH_MODES.REGISTER}
          aria-controls="auth-panel-register"
          onMouseEnter={() => onPreviewMode(AUTH_MODES.REGISTER)}
          onMouseLeave={() => onPreviewMode(null)}
          onFocus={() => onPreviewMode(AUTH_MODES.REGISTER)}
          onBlur={() => onPreviewMode(null)}
          onClick={() => onCommitMode(AUTH_MODES.REGISTER)}
        >
          CREATE ACCOUNT
        </button>
      </div>

      {status && isActive && (
        <p
          className={`auth-status auth-status--${status.type}`}
          role={status.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {status.text}
        </p>
      )}

      <div className="auth-panel">
        {isLoginCard ? (
          <LoginForm
            isLoading={isSubmitting}
            onSubmit={onLogin}
            onSwitchMode={() => onCommitMode(AUTH_MODES.REGISTER)}
          />
        ) : (
          <RegisterForm
            isLoading={isSubmitting}
            onSubmit={onRegister}
            onSwitchMode={() => onCommitMode(AUTH_MODES.LOGIN)}
          />
        )}
      </div>
    </section>
  )
}

export default AuthScreen
