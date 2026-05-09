import { FRIEND_SLOTS } from '../../../game/worldConstants'

function GameMenu({
  isOpen,
  menuMode,
  onClose,
  onConfirmLogout,
  onSetMenuMode,
  friends,
  friendName,
  setFriendName,
  handleAddFriend,
  handleRemoveFriend,
  selectedFriend,
  setSelectedFriend,
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
              className={
                menuMode === 'unfriend-confirm'
                  ? 'unfriend-popup'
                  : 'menu-modal'
              }
            role="dialog"
            aria-label="Game menu"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
              <button
                className="menu-modal-close"
                type="button"
                aria-label="Close menu"
                onClick={onClose}
              >
                <span aria-hidden="true" />
              </button>
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
                <div className="friend-input-row">
                  <input
                    type="text"
                    value={friendName}
                    onChange={(event) => setFriendName(event.target.value)}
                    placeholder="Friend name"
                    className="friend-input"
                  />

                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="button"
                    onClick={handleAddFriend}
                  >
                    ADD FRIEND
                  </button>
                </div>

                <div className="friend-slots" aria-label="Friend slots">
                  {friends.length === 0 ? (
                    Array.from({ length: FRIEND_SLOTS }, (_, index) => (
                      <div className="friend-slot" key={index}>
                        EMPTY SLOT
                      </div>
                    ))
                  ) : (
                    friends.map((friend) => (
                      <div className="friend-slot friend-slot-filled" key={friend.id}>
                        <div className="friend-info">
                          <div
                            className={
                              friend.online
                                ? 'friend-status online'
                                : 'friend-status offline'
                            }
                          />

                          <span className="friend-name">
                            {friend.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="friend-remove-button"
                          onClick={() => {
                            setSelectedFriend(friend)
                            onSetMenuMode('unfriend-confirm')
                          }}
                        >
                          X
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <button
                  className="menu-modal-action menu-modal-action--small"
                  type="button"
                  onClick={() => onSetMenuMode('friend-requests')}
                >
                  VIEW FRIEND REQUESTS
                </button>
              </div>
            )}
            {menuMode === 'unfriend-confirm' && (
              <div className="menu-panel">
                <h2 className="menu-panel-title">
                  UNFRIEND {selectedFriend?.name}?
                </h2>

                <div className="menu-confirm-actions">
                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="button"
                    onClick={() => {
                      handleRemoveFriend(selectedFriend.id)
                      setSelectedFriend(null)
                      onSetMenuMode('friends')
                    }}
                  >
                    YES
                  </button>

                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="button"
                    onClick={() => {
                      setSelectedFriend(null)
                      onSetMenuMode('friends')
                    }}
                  >
                    NO
                  </button>
                </div>
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
