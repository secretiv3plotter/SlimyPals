import {
  openSlimyPalsDb,
  usersRepository,
} from '../services/slimyPalsDb'
import { OFFLINE_MVP_USERNAME } from './worldConstants'

export async function getOrCreateOfflineUser() {
  await openSlimyPalsDb()

  const existingUser = await usersRepository.getByUsername(OFFLINE_MVP_USERNAME)

  if (existingUser && !existingUser.deleted_at) {
    return existingUser
  }

  try {
    return await usersRepository.create({
      username: OFFLINE_MVP_USERNAME,
      password_hash: 'offline-mvp',
      last_login: new Date().toISOString(),
    })
  } catch {
    return usersRepository.getByUsername(OFFLINE_MVP_USERNAME)
  }
}
