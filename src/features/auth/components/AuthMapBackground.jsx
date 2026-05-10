import { useState } from 'react'

const authMapTiles = Object.entries(
  import.meta.glob('../../../assets/map/tiles/map*.png', {
    eager: true,
    import: 'default',
  }),
)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, tile]) => tile)

const AUTH_BACKGROUND_TILE_COUNT = 4000

function AuthMapBackground() {
  const [tiles] = useState(() => createRandomizedTiles())

  return (
    <div className="auth-map-background" aria-hidden="true">
      {tiles.map((tile, index) => (
        <img src={tile} alt="" draggable="false" key={`${tile}-${index}`} />
      ))}
    </div>
  )
}

function createRandomizedTiles() {
  return Array.from({ length: AUTH_BACKGROUND_TILE_COUNT }, (_, index) => (
    authMapTiles[index] || authMapTiles[Math.floor(Math.random() * authMapTiles.length)]
  ))
}

export default AuthMapBackground
