function MenuConfirmPanel({
  confirmDisabled = false,
  onCancel,
  onConfirm,
  title,
}) {
  return (
    <div className="menu-panel">
      <h2 className="menu-panel-title">{title}</h2>

      <div className="menu-confirm-actions">
        <button
          className="menu-modal-action menu-modal-action--small"
          type="button"
          onClick={onCancel}
        >
          NO
        </button>

        <button
          className="menu-modal-action menu-modal-action--small"
          type="button"
          disabled={confirmDisabled}
          onClick={onConfirm}
        >
          YES
        </button>
      </div>
    </div>
  )
}

export default MenuConfirmPanel
