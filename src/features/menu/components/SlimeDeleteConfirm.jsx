import { simpleSlimeSprite, slimeOverlaySprites } from '../../../game/slimeSprites'
import { getSlimeColorFilter } from '../../../game/slimePresentation'

const SLIME_PREVIEW_FRAME = Object.freeze({
  width: 68,
  height: 46,
})

const SLIME_PREVIEW_BOUNDS = Object.freeze({
  common: {
    default: { x: 6, y: 28, width: 24, height: 18 },
  },
  rare: {
    baseball: { x: 6, y: 17, width: 24, height: 28 },
    beanie: { x: 6, y: 18, width: 24, height: 27 },
    fedora: { x: 6, y: 21, width: 24, height: 24 },
  },
  mythical: {
    demon: { x: 1, y: 14, width: 34, height: 31 },
    king: { x: 3, y: 13, width: 31, height: 32 },
    witch: { x: 1, y: 7, width: 38, height: 38 },
  },
})

const SLIME_RARITY_COLORS = Object.freeze({
  common: '#ffffff',
  mythical: '#ffd83d',
  rare: '#d43cff',
})

function getSlimePreviewBounds(slime) {
  const rarity = String(slime.rarity ?? '').toLowerCase()
  const type = String(slime.type ?? '').toLowerCase()

  return SLIME_PREVIEW_BOUNDS[rarity]?.[type]
    ?? SLIME_PREVIEW_BOUNDS[rarity]?.default
    ?? SLIME_PREVIEW_BOUNDS.common.default
}

function SlimeDeleteConfirm({ slime, onCancel, onConfirm }) {
  if (!slime) {
    return null
  }

  const rarityKey = String(slime.rarity ?? '').toLowerCase()
  const overlaySprite = slimeOverlaySprites[slime.rarity]?.[slime.type]
  const previewBounds = getSlimePreviewBounds(slime)
  const previewStyle = {
    '--slime-preview-visible-width': `${previewBounds.width}`,
    '--slime-preview-visible-height': `${previewBounds.height}`,
    '--slime-preview-frame-width': `${SLIME_PREVIEW_FRAME.width}`,
    '--slime-preview-frame-height': `${SLIME_PREVIEW_FRAME.height}`,
    '--slime-preview-x-offset': `${-previewBounds.x}`,
    '--slime-preview-y-offset': `${-previewBounds.y}`,
  }

  return (
    <div
      className="menu-modal-backdrop"
      role="presentation"
      onClick={onCancel}
    >
      <section
        className="menu-modal slime-delete-modal"
        role="dialog"
        aria-label="Confirm slime deletion"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          className="menu-modal-close"
          type="button"
          aria-label="Cancel slime deletion"
          onClick={onCancel}
        >
          <span aria-hidden="true" />
        </button>
        <div className="menu-panel slime-delete-panel">
          <h2 className="menu-panel-title">DELETE SLIME?</h2>
      
          <div
            className="slime-delete-preview"
            style={previewStyle}
          >
            <div
              className="slime-delete-preview-sprite"
              role="img"
              aria-label={`${slime.rarity} slime`}
            >
              <div
                className="slime-delete-base"
                style={{
                  '--slime-base-sprite': `url(${simpleSlimeSprite})`,
                  '--slime-filter': getSlimeColorFilter(slime.color),
                }}
              />
              {overlaySprite && (
                <div
                  className="slime-delete-overlay"
                  style={{ backgroundImage: `url(${overlaySprite})` }}
                />
              )}
            </div>
          </div>
          
          <dl className="slime-delete-details">
            <div>
              <dt>LEVEL</dt>
              <dd>{slime.level}</dd>
            </div>
            <div>
              <dt>RARITY</dt>
              <dd
                className="slime-delete-rarity-value"
                style={{ '--slime-rarity-color': SLIME_RARITY_COLORS[rarityKey] }}
              >
                {slime.rarity}
              </dd>
            </div>
            <div>
              <dt>TYPE</dt>
              <dd>{slime.type}</dd>
            </div>
          </dl>
          <div className="menu-confirm-actions">
            <button
              className="menu-modal-action menu-modal-action--small"
              type="button"
              onClick={onCancel}
            >
              KEEP
            </button>
            <button
              className="menu-modal-action menu-modal-action--small slime-delete-confirm"
              type="button"
              onClick={() => onConfirm(slime.id)}
            >
              DELETE
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default SlimeDeleteConfirm
