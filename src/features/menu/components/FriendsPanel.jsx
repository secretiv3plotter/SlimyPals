function FriendsPanel({
  canAcceptFriendRequest,
  canSendFriendRequest,
  friendMenuMessage,
  friendName,
  friendSlots,
  handleCancelFriendRequest,
  handleSearchFriend,
  handleSendFriendRequest,
  incomingRequests,
  isFriendMenuLoading,
  onSetMenuMode,
  refreshFriendMenu,
  setFriendName,
  setSelectedFriend,
  setSelectedRequest,
}) {
  return (
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
        {friendSlots.map((slot, index) => (
          <FriendSlot
            key={
              slot.slotType === 'empty'
                ? slot.id
                : `${slot.slotType}-${slot.friendshipId || slot.id || index}`
            }
            canAcceptFriendRequest={canAcceptFriendRequest}
            canSendFriendRequest={canSendFriendRequest}
            handleCancelFriendRequest={handleCancelFriendRequest}
            handleSendFriendRequest={handleSendFriendRequest}
            isFriendMenuLoading={isFriendMenuLoading}
            onSetMenuMode={onSetMenuMode}
            setSelectedFriend={setSelectedFriend}
            setSelectedRequest={setSelectedRequest}
            slot={slot}
          />
        ))}
      </div>
      {friendMenuMessage && (
        <p className="friend-menu-message">{friendMenuMessage}</p>
      )}
      <button
        className="menu-modal-action menu-modal-action--med friend-requests-button"
        type="button"
        onClick={() => {
          onSetMenuMode('friend-requests')
          refreshFriendMenu()
        }}
      >
        {incomingRequests.length > 0 && (
          <span
            className="friend-requests-indicator"
            aria-label={`${incomingRequests.length} pending friend request${incomingRequests.length === 1 ? '' : 's'}`}
          />
        )}
        VIEW FRIEND REQUESTS
      </button>
    </div>
  )
}

function FriendSlot({
  canAcceptFriendRequest,
  canSendFriendRequest,
  handleCancelFriendRequest,
  handleSendFriendRequest,
  isFriendMenuLoading,
  onSetMenuMode,
  setSelectedFriend,
  setSelectedRequest,
  slot,
}) {
  if (slot.slotType === 'empty') {
    return (
      <div className="friend-slot">
        EMPTY SLOT
      </div>
    )
  }

  return (
    <div className="friend-slot friend-slot-filled">
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
              handleCancelFriendRequest(slot)
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
            onClick={() => handleSendFriendRequest()}
          >
            <span className="friend-add-icon" aria-hidden="true" />
          </button>
        )}

        {slot.slotType === 'incoming-search' && (
          <IncomingRequestActions
            canAcceptFriendRequest={canAcceptFriendRequest}
            isFriendMenuLoading={isFriendMenuLoading}
            onSetMenuMode={onSetMenuMode}
            request={slot}
            returnMode="friends"
            setSelectedRequest={setSelectedRequest}
          />
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
}

export function IncomingRequestActions({
  canAcceptFriendRequest,
  isFriendMenuLoading,
  onSetMenuMode,
  request,
  returnMode,
  setSelectedRequest,
}) {
  return (
    <>
      <button
        type="button"
        className="friend-accept-button"
        disabled={!canAcceptFriendRequest || isFriendMenuLoading}
        aria-label={`Accept friend request from ${request.username}`}
        onClick={() => {
          setSelectedRequest({
            ...request,
            returnMode,
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
            returnMode,
          })
          onSetMenuMode('decline-request-confirm')
        }}
      >
        <span className="friend-remove-icon" aria-hidden="true" />
      </button>
    </>
  )
}

export default FriendsPanel
