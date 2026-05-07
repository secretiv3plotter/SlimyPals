function SlimeDeleteConfirm({ slime, onCancel, onConfirm }) {
  if (!slime) {
    return null
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
          <dl className="slime-delete-details">
            <div>
              <dt>RARITY</dt>
              <dd>{slime.rarity}</dd>
            </div>
            <div>
              <dt>TYPE</dt>
              <dd>{slime.type}</dd>
            </div>
            <div>
              <dt>LEVEL</dt>
              <dd>{slime.level}</dd>
            </div>
            <div>
              <dt>ID</dt>
              <dd>{slime.id.slice(0, 8)}</dd>
            </div>
          </dl>
          <div className="menu-confirm-actions">
            <button
              className="menu-modal-action menu-modal-action--small slime-delete-confirm"
              type="button"
              onClick={() => onConfirm(slime.id)}
            >
              DELETE
            </button>
            <button
              className="menu-modal-action menu-modal-action--small"
              type="button"
              onClick={onCancel}
            >
              KEEP
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default SlimeDeleteConfirm
