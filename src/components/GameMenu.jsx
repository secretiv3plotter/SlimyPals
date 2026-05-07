import { FRIEND_SLOTS } from '../game/worldConstants'

function GameMenu({
  isOpen,
  menuMode,
  onClose,
  onConfirmLogout,
  onSetMenuMode,
}) {
  return (
    <>
      {isOpen && (
        <div
          className="menu-modal-backdrop"
          role="presentation"
          onClick={onClose}
        >
          <section
            className="menu-modal"
            role="dialog"
            aria-label="Game menu"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            {menuMode !== 'friends' && (
              <button
                className="menu-modal-close"
                type="button"
                aria-label="Close menu"
                onClick={onClose}
              >
                <span aria-hidden="true" />
              </button>
            )}
            {menuMode === 'main' && (
              <div className="menu-main-actions">
                <button
                  className="menu-modal-action"
                  type="button"
                  onClick={() => onSetMenuMode('friends')}
                >
                  FRIENDS
                </button>
                <button
                  className="menu-modal-action"
                  type="button"
                  onClick={() => onSetMenuMode('logout')}
                >
                  LOG OUT
                </button>
              </div>
            )}
            {menuMode === 'friends' && (
              <div className="menu-panel">
                <h2 className="menu-panel-title">FRIENDS</h2>
                <div className="friend-slots" aria-label="Friend slots">
                  {Array.from({ length: FRIEND_SLOTS }, (_, index) => (
                    <div className="friend-slot" key={index}>
                      EMPTY SLOT
                    </div>
                  ))}
                </div>
                <button
                  className="menu-modal-action menu-modal-action--small"
                  type="button"
                  onClick={() => onSetMenuMode('main')}
                >
                  BACK
                </button>
              </div>
            )}
            {menuMode === 'logout' && (
              <div className="menu-panel">
                <h2 className="menu-panel-title">LOG OUT?</h2>
                <div className="menu-confirm-actions">
                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="button"
                    onClick={onConfirmLogout}
                  >
                    YES
                  </button>
                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="button"
                    onClick={() => onSetMenuMode('main')}
                  >
                    NO
                  </button>
                </div>
              </div>
            )}
            {menuMode === 'logged-out' && (
              <div className="menu-panel">
                <h2 className="menu-panel-title">LOGGED OUT</h2>
                <button
                  className="menu-modal-action menu-modal-action--small"
                  type="button"
                  onClick={onClose}
                >
                  OK
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  )
}

export default GameMenu
