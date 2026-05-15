import { GAME_LIMITS, usersRepository } from '../../../infrastructure/db'
import { assertRule } from './slimeManagementError'

export async function resetDailySummons(userId) {
  const user = await usersRepository.getById(userId)

  if (!user || user.deleted_at) {
    assertRule({
      allowed: false,
      reason: 'USER_UNAVAILABLE',
      message: 'Daily summons can only be reset for an active user.',
    })
  }

  return usersRepository.update(userId, {
    daily_summons_left: GAME_LIMITS.DAILY_SUMMONS,
  })
}