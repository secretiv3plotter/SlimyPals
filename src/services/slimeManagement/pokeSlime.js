import {
  interactionLogsRepository,
  INTERACTION_TYPES,
  slimesRepository,
  STORES,
  withTransaction,
} from '../slimyPalsDb'
import { assertRule } from './slimeManagementError'
import { createInteractionLogDraft } from './rules'

export async function pokeSlime({ slimeId, senderId, options = {} }) {
  return withTransaction([STORES.INTERACTION_LOG, STORES.SLIME], 'rw', async () => {
    const now = options.now ?? new Date()
    const slime = await slimesRepository.getById(slimeId)

    if (!slime || slime.deleted_at) {
      assertRule({
        allowed: false,
        reason: 'SLIME_UNAVAILABLE',
        message: 'Only an active slime can be poked.',
      })
    }

    const interactionLog = await interactionLogsRepository.create(
      createInteractionLogDraft({
        senderId,
        targetSlimeId: slimeId,
        actionType: INTERACTION_TYPES.POKE,
        now,
      }),
    )

    return { slime, interactionLog }
  })
}
