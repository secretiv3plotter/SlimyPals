import { useEffect } from 'react'

function NotificationStack({ notifications, onDismiss }) {
  useEffect(() => {
    if (notifications.length === 0) {
      return undefined
    }

    const timers = notifications.map((notification) => (
      window.setTimeout(() => onDismiss(notification.id), 4200)
    ))

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [notifications, onDismiss])

  if (notifications.length === 0) {
    return null
  }

  return (
    <div className="notification-stack" aria-live="polite">
      {notifications.map((notification) => (
        <section className="notification-card" key={notification.id}>
          {notification.message}
        </section>
      ))}
    </div>
  )
}

export default NotificationStack
