import { IncomingRequestActions } from './FriendsPanel'

function FriendRequestsPanel({
  canAcceptFriendRequest,
  friendMenuMessage,
  incomingRequests,
  isFriendMenuLoading,
  onSetMenuMode,
  setSelectedRequest,
}) {
  return (
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
                <IncomingRequestActions
                  canAcceptFriendRequest={canAcceptFriendRequest}
                  isFriendMenuLoading={isFriendMenuLoading}
                  onSetMenuMode={onSetMenuMode}
                  request={request}
                  returnMode="friend-requests"
                  setSelectedRequest={setSelectedRequest}
                />
              </div>
            </div>
          ))
        )}
      </div>
      {friendMenuMessage && (
        <p className="friend-menu-message">{friendMenuMessage}</p>
      )}
    </div>
  )
}

export default FriendRequestsPanel
