export function getSlimeDisplayName(slime) {
  if (!slime) {
    return 'unknown'
  }

  const type = String(slime.type || '').trim()
  const rarity = String(slime.rarity || '').trim()

  if (!type) {
    return rarity || 'unknown'
  }

  if (!rarity || type.toLowerCase() === rarity.toLowerCase()) {
    return type
  }

  return `${rarity} ${type}`
}
