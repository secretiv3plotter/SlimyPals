import { simpleSlimeSprite, slimeOverlaySprites } from '../../../game/slimeSprites'
import { getSlimeColorFilter } from '../../../game/slimePresentation'

const SLIME_PREVIEW_FRAME = Object.freeze({
  width: 68,
  height: 46,
})

const SLIME_PREVIEW_BOUNDS = Object.freeze({
  common: {
    default: { x: 11, y: 33, width: 14, height: 12 },
  },
  rare: {
    baseball: { x: 10, y: 20, width: 15, height: 25 },
    beanie: { x: 11, y: 21, width: 15, height: 24 },
    fedora: { x: 11, y: 24, width: 14, height: 21 },
  },
  mythical: {
    demon: { x: 4, y: 17, width: 28, height: 28 },
    king: { x: 6, y: 16, width: 24, height: 29 },
    witch: { x: 4, y: 10, width: 32, height: 35 },
  },
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

  const previewFrame = Array.isArray(slime.frames) && slime.frames.length > 0
    ? slime.frames[0]
    : null
  const overlaySprite = slimeOverlaySprites[slime.rarity]?.[slime.type]
  const previewBounds = getSlimePreviewBounds(slime)
  const previewStyle = {
    '--slime-preview-frame-width': `${SLIME_PREVIEW_FRAME.width}`,
    '--slime-preview-frame-height': `${SLIME_PREVIEW_FRAME.height}`,
    '--slime-preview-visible-width': `${previewBounds.width}`,
    '--slime-preview-visible-height': `${previewBounds.height}`,
    '--slime-preview-frame-display-width':
      `${(SLIME_PREVIEW_FRAME.width / previewBounds.width) * 100}%`,
    '--slime-preview-frame-display-height':
      `${(SLIME_PREVIEW_FRAME.height / previewBounds.height) * 100}%`,
    '--slime-preview-x-offset':
      `${-(previewBounds.x / previewBounds.width) * 100}`,
    '--slime-preview-y-offset':
      `${-(previewBounds.y / previewBounds.height) * 100}`,
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
            {previewFrame ? ( 
              <img
                src={previewFrame}
                alt={`${slime.rarity} slime`}
                className="slime-delete-preview-image"
              />
            ) : (
              <div className="slime-delete-preview-sprite">
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
            )}
          </div>
          
          <dl className="slime-delete-details">
            <div>
              <dt>LEVEL</dt>
              <dd>{slime.level}</dd>
            </div>
            <div>
              <dt>RARITY</dt>
              <dd>{slime.rarity}</dd>
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
