import { foodFactoryStockRepository, friendshipsRepository, slimesRepository, usersRepository } from './repositories'

export async function getUserDomainSnapshot(userId) {
  const [user, foodFactoryStock, slimes, friendships] = await Promise.all([
    usersRepository.getById(userId),
    foodFactoryStockRepository.getByUserId(userId),
    slimesRepository.listByUserId(userId),
    friendshipsRepository.listForUser(userId),
  ])

  return {
    user,
    foodFactoryStock,
    slimes,
    friendships,
  }
}
