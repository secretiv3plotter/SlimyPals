import { FENCE_COLUMNS, FENCE_ROWS, TILE_SIZE } from '../../../game/worldConstants'
import { getGridSizeStyle } from '../../../game/mapTiles'

function FenceOverlay({ fencePosition, fenceTiles }) {
  return (
    <div
      className="fence-overlay grid"
      style={{
        width: FENCE_COLUMNS * TILE_SIZE,
        height: FENCE_ROWS * TILE_SIZE,
        ...getGridSizeStyle({ columns: FENCE_COLUMNS, rows: FENCE_ROWS }),
        left: fencePosition.x,
        top: fencePosition.y,
      }}
    >
      {fenceTiles.map((tile) => (
        <div
          key={tile.id}
          className="fence-cell map-tile"
          style={{
            zIndex: Math.round(fencePosition.y + (tile.y + 1) * TILE_SIZE),
          }}
        >
          {tile.layers.map((layer) => (
            <img
              key={`${tile.id}-${layer.id}`}
              className={`fence-layer map-tile${layer.isRightColumn ? ' fence-tile--right' : ''}`}
              src={layer.src}
              alt=""
              draggable="false"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default FenceOverlay
