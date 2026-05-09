import { resetDailySummons } from '../services/slimeManagement'
import { usersRepository } from '../services/slimyPalsDb'

export function getMsUntilNextLocalMidnight() {
  const now = new Date()
  const nextMidnight = new Date(now)
  nextMidnight.setHours(24, 0, 0, 0)
  return nextMidnight.getTime() - now.getTime()
}

export function isSameLocalDay(leftDate, rightDate = new Date()) {
  if (!leftDate) {
    return false
  }

  const left = new Date(leftDate)
  const right = new Date(rightDate)

  return (
    left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
  )
}

export async function resetDailySummonsForToday(userId) {
  const resetUser = await resetDailySummons(userId)
  return usersRepository.update(resetUser.id, {
    last_login: new Date().toISOString(),
  })
}
