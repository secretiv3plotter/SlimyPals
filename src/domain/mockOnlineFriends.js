import { SLIME_RARITIES } from '../infrastructure/db'

export const mockOnlineFriends = Object.freeze([
  {
    id: 'mock-friend-top',
    username: 'Mika',
    slimes: [
      createMockSlime('mika-green', 'green', '#58b56b', 1),
      createMockSlime('mika-beanie', 'beanie', '#d96aa4', 2, SLIME_RARITIES.RARE),
    ],
  },
  {
    id: 'mock-friend-bottom',
    username: 'Ren',
    slimes: [
      createMockSlime('ren-blue', 'blue', '#4d8fd9', 1),
    ],
  },
  {
    id: 'mock-friend-left',
    username: 'Ari',
    slimes: [
      createMockSlime('ari-witch', 'witch', '#9661c7', 3, SLIME_RARITIES.MYTHICAL),
    ],
  },
  {
    id: 'mock-friend-right',
    username: 'Jo',
    slimes: [
      createMockSlime('jo-orange', 'orange', '#e48a3a', 2),
      createMockSlime('jo-fedora', 'fedora', '#e2c84a', 1, SLIME_RARITIES.RARE, {
        lastFedAt: new Date().toISOString(),
      }),
    ],
  },
])

function createMockSlime(id, type, color, level, rarity = SLIME_RARITIES.COMMON, options = {}) {
  return {
    id,
    user_id: 'mock-friend',
    rarity,
    type,
    color,
    level,
    last_fed_at: options.lastFedAt ?? null,
    created_at: '2026-05-08T00:00:00.000Z',
    deleted_at: null,
  }
}
