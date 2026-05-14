import { getSlimeBaseSprite, getSlimeOverlaySprite } from '../../../game/slimeSprites'
import { getSlimeColorFilter } from '../../../game/slimePresentation'
import { SLIME_FRAME_HEIGHT, SLIME_FRAME_WIDTH } from '../../../game/worldConstants'

const SLIME_PREVIEW_FRAME = Object.freeze({
  width: SLIME_FRAME_WIDTH,
  height: SLIME_FRAME_HEIGHT,
})

const SLIME_RARITY_COLORS = Object.freeze({
  common: '#ffffff',
  mythical: '#d43cff',
  rare: '#ffd83d',
})

function SlimeDeleteConfirm({ slime, onCancel, onConfirm }) {
  if (!slime) {
    return null
  }

  const rarityKey = String(slime.rarity ?? '').toLowerCase()
  const baseSprite = getSlimeBaseSprite(slime.level)
  const overlaySprite = getSlimeOverlaySprite(slime)
  
  const previewStyle = {
    '--slime-preview-visible-width': `${SLIME_PREVIEW_FRAME.width}`,
    '--slime-preview-visible-height': `${SLIME_PREVIEW_FRAME.height}`,
    '--slime-preview-frame-width': `${SLIME_PREVIEW_FRAME.width}`,
    '--slime-preview-frame-height': `${SLIME_PREVIEW_FRAME.height}`,
    '--slime-preview-x-offset': `0`,
    '--slime-preview-y-offset': `0`,
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
                  '--slime-base-sprite': `url(${baseSprite})`,
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
