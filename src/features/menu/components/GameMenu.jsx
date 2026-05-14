function GameMenu({
  isOpen,
  menuMode,
  onClose,
  onConfirmLogout,
  onSetMenuMode,
  friendName,
  setFriendName,
  handleAcceptFriendRequest,
  handleCancelFriendRequest,
  handleDeclineFriendRequest,
  handleSearchFriend,
  handleSendFriendRequest,
  handleRemoveFriend,
  friendMenuMessage,
  friendSlots,
  incomingRequests,
  isFriendMenuLoading,
  refreshFriendMenu,
  canAcceptFriendRequest,
  canSendFriendRequest,
  searchedUser,
  selectedFriend,
  setSelectedFriend,
  selectedRequest,
  setSelectedRequest,
}) {
  const isConfirmMode = [
    'add-friend-confirm',
    'accept-request-confirm',
    'cancel-request-confirm',
    'decline-request-confirm',
    'unfriend-confirm',
  ].includes(menuMode)
  const requestReturnMode = selectedRequest?.returnMode || 'friend-requests'

  return (
    <>
      {isOpen && (
        <div
          className="menu-modal-backdrop"
          role="presentation"
          onClick={onClose}
        >
          <section
            className={isConfirmMode ? 'unfriend-popup' : 'menu-modal'}
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
                  onClick={() => {
                    onSetMenuMode('friends')
                    refreshFriendMenu()
                  }}
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
              <div className="menu-panel friends-panel">
                <h2 className="menu-panel-title">FRIENDS</h2>
                <form
                  className="friend-input-row"
                  onSubmit={(event) => {
                    event.preventDefault()
                    handleSearchFriend()
                  }}
                >
                  <input
                    type="text"
                    value={friendName}
                    onChange={(event) => setFriendName(event.target.value)}
                    placeholder="Search username"
                    className="friend-input"
                  />

                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="submit"
                    disabled={isFriendMenuLoading}
                  >
                    SEARCH
                  </button>
                </form>

                <div className="friend-slots" aria-label="Friend slots">
                  {friendSlots.map((slot, index) => {
                    if (slot.slotType === 'empty') {
                      return (
                        <div className="friend-slot" key={slot.id}>
                          EMPTY SLOT
                        </div>
                      )
                    }

                    return (
                      <div
                        className="friend-slot friend-slot-filled"
                        key={`${slot.slotType}-${slot.friendshipId || slot.id || index}`}
                      >
                        <div className="friend-info">
                          {slot.slotType === 'friend' && (
                            <div
                              className={
                                slot.online
                                  ? 'friend-status online'
                                  : 'friend-status offline'
                              }
                              aria-label={slot.online ? 'Available' : 'Offline'}
                            />
                          )}
                          <span className="friend-name">
                            {slot.username}
                          </span>

                          {slot.slotType === 'sent-request' && (
                            <span className="friend-pending-status">
                              PENDING
                            </span>
                          )}
                        </div>
                        <div className="friend-actions">
                          {slot.slotType === 'sent-request' && (
                            <button
                              type="button"
                              className="friend-remove-button"
                              disabled={isFriendMenuLoading}
                              onClick={() => {
                                setSelectedRequest(slot)
                                onSetMenuMode('cancel-request-confirm')
                              }}
                              aria-label={`Cancel friend request to ${slot.username}`}
                            >
                              <span className="friend-remove-icon" aria-hidden="true" />
                            </button>
                          )}

                          {slot.slotType === 'search-result' && (
                            <button
                              type="button"
                              className="friend-add-button"
                              disabled={!canSendFriendRequest || isFriendMenuLoading}
                              aria-label={`Send friend request to ${slot.username}`}
                              onClick={() => onSetMenuMode('add-friend-confirm')}
                            >
                              <span className="friend-add-icon" aria-hidden="true" />
                            </button>
                          )}

                          {slot.slotType === 'incoming-search' && (
                            <>
                              <button
                                type="button"
                                className="friend-accept-button"
                                disabled={!canAcceptFriendRequest || isFriendMenuLoading}
                                aria-label={`Accept friend request from ${slot.username}`}
                                onClick={() => {
                                  setSelectedRequest({
                                    ...slot,
                                    returnMode: 'friends',
                                  })
                                  onSetMenuMode('accept-request-confirm')
                                }}
                              >
                                <span className="friend-accept-icon" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className="friend-remove-button"
                                disabled={isFriendMenuLoading}
                                aria-label={`Decline friend request from ${slot.username}`}
                                onClick={() => {
                                  setSelectedRequest({
                                    ...slot,
                                    returnMode: 'friends',
                                  })
                                  onSetMenuMode('decline-request-confirm')
                                }}
                              >
                                <span className="friend-remove-icon" aria-hidden="true" />
                              </button>
                            </>
                          )}

                          {slot.slotType === 'friend' && (
                            <button
                              type="button"
                              className="friend-remove-button"
                              aria-label={`Unfriend ${slot.username}`}
                              onClick={() => {
                                setSelectedFriend(slot)
                                onSetMenuMode('unfriend-confirm')
                              }}
                            >
                              <span className="friend-remove-icon" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {friendMenuMessage && (
                  <p className="friend-menu-message">{friendMenuMessage}</p>
                )}
                <button
                  className="menu-modal-action menu-modal-action--med"
                  type="button"
                  onClick={() => {
                    onSetMenuMode('friend-requests')
                    refreshFriendMenu()
                  }}
                >
                  VIEW FRIEND REQUESTS
                </button>
              </div>
            )}
            {menuMode === 'add-friend-confirm' && (
              <div className="menu-panel">
                <h2 className="menu-panel-title">
                  ADD FRIEND?
                </h2>
                <p className="friend-confirm-copy">
                  Send a request to {searchedUser?.username}?
                </p>

                <div className="menu-confirm-actions">
                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="button"
                    onClick={() => onSetMenuMode('friends')}
                  >
                    NO
                  </button>

                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="button"
                    disabled={!canSendFriendRequest || isFriendMenuLoading}
                    onClick={() => {
                      handleSendFriendRequest()
                      onSetMenuMode('friends')
                    }}
                  >
                    YES
                  </button>
                </div>
              </div>
            )}
            {menuMode === 'unfriend-confirm' && (
              <div className="menu-panel">
                <h2 className="menu-panel-title">
                  UNFRIEND {selectedFriend?.username}?
                </h2>

                <div className="menu-confirm-actions">
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

                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="button"
                    onClick={() => {
                      handleRemoveFriend(selectedFriend.id)
                      onSetMenuMode('friends')
                    }}
                  >
                    YES
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
                    onClick={() => onSetMenuMode('main')}
                  >
                    NO
                  </button>
                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="button"
                    onClick={onConfirmLogout}
                  >
                    YES
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
            {menuMode === 'friend-requests' && (
              <div className="menu-panel">
                <button
                  className="menu-modal-back"
                  type="button"
                  aria-label="Back to friends"
                  onClick={() => onSetMenuMode('friends')}
                >
                  <span className="menu-modal-back-icon" aria-hidden="true" />
                  <span className="menu-modal-back-label">BACK</span>
                </button>
                <h2 className="menu-panel-title">FRIEND REQUESTS</h2>
                {!canAcceptFriendRequest && incomingRequests.length > 0 && (
                  <p className="friend-menu-message">
                    Friend slots full. Cancel a sent request or remove a friend before accepting.
                  </p>
                )}
                <div className="friend-request-list" aria-label="Friend requests">
                  {incomingRequests.length === 0 ? (
                    <div className="friend-slot">NO REQUESTS</div>
                  ) : (
                    incomingRequests.map((request) => (
                      <div className="friend-slot friend-slot-filled" key={request.friendshipId}>
                        <div className="friend-info">
                          <span className="friend-name">{request.username}</span>
                        </div>
                        <div className="friend-actions">
                          <button
                            type="button"
                            className="friend-accept-button"
                            disabled={!canAcceptFriendRequest || isFriendMenuLoading}
                            aria-label={`Accept friend request from ${request.username}`}
                            onClick={() => {
                              setSelectedRequest({
                                ...request,
                                returnMode: 'friend-requests',
                              })
                              onSetMenuMode('accept-request-confirm')
                            }}
                          >
                            <span className="friend-accept-icon" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="friend-remove-button"
                            disabled={isFriendMenuLoading}
                            aria-label={`Decline friend request from ${request.username}`}
                            onClick={() => {
                              setSelectedRequest({
                                ...request,
                                returnMode: 'friend-requests',
                              })
                              onSetMenuMode('decline-request-confirm')
                            }}
                          >
                            <span className="friend-remove-icon" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {friendMenuMessage && (
                  <p className="friend-menu-message">{friendMenuMessage}</p>
                )}
              </div>
            )}
            {menuMode === 'cancel-request-confirm' && (
              <div className="menu-panel">
                <h2 className="menu-panel-title">
                  CANCEL REQUEST?
                </h2>
                <p className="friend-confirm-copy">
                  Cancel request to {selectedRequest?.username}?
                </p>

                <div className="menu-confirm-actions">
                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="button"
                    onClick={() => {
                      setSelectedRequest(null)
                      onSetMenuMode('friends')
                    }}
                  >
                    NO
                  </button>

                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="button"
                    disabled={isFriendMenuLoading}
                    onClick={() => {
                      handleCancelFriendRequest()
                      onSetMenuMode('friends')
                    }}
                  >
                    YES
                  </button>
                </div>
              </div>
            )}
            {menuMode === 'accept-request-confirm' && (
              <div className="menu-panel">
                <h2 className="menu-panel-title">
                  ACCEPT {selectedRequest?.username}?
                </h2>

                <div className="menu-confirm-actions">
                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="button"
                    onClick={() => {
                      setSelectedRequest(null)
                      onSetMenuMode(requestReturnMode)
                    }}
                  >
                    NO
                  </button>

                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="button"
                    disabled={!canAcceptFriendRequest || isFriendMenuLoading}
                    onClick={async () => {
                      await handleAcceptFriendRequest()
                      onSetMenuMode(requestReturnMode)
                    }}
                  >
                    YES
                  </button>
                </div>
              </div>
            )}
            {menuMode === 'decline-request-confirm' && (
              <div className="menu-panel">
                <h2 className="menu-panel-title">
                  DECLINE {selectedRequest?.username}?
                </h2>

                <div className="menu-confirm-actions">
                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="button"
                    onClick={() => {
                      setSelectedRequest(null)
                      onSetMenuMode(requestReturnMode)
                    }}
                  >
                    NO
                  </button>

                  <button
                    className="menu-modal-action menu-modal-action--small"
                    type="button"
                    disabled={isFriendMenuLoading}
                    onClick={async () => {
                      await handleDeclineFriendRequest()
                      onSetMenuMode(requestReturnMode)
                    }}
                  >
                    YES
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  )
}

export default GameMenu
