import FriendRequestsPanel from './FriendRequestsPanel'
import FriendsPanel from './FriendsPanel'
import MenuConfirmPanel from './MenuConfirmPanel'

function GameMenu({
  isOpen,
  menuMode,
  onClose,
  onConfirmLogout,
  onSetMenuMode,
  username,
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
  selectedFriend,
  setSelectedFriend,
  selectedRequest,
  setSelectedRequest,
}) {
  const isConfirmMode = [
    'accept-request-confirm',
    'decline-request-confirm',
    'unfriend-confirm',
  ].includes(menuMode)
  const requestReturnMode = selectedRequest?.returnMode || 'friend-requests'
  const modalClassName = isConfirmMode
    ? 'unfriend-popup'
    : `menu-modal menu-modal--${menuMode}`
  const canShowGreeting = !isConfirmMode && menuMode !== 'friend-requests'

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="menu-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <section
        className={modalClassName}
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
        {canShowGreeting && username && (
          <p className="menu-user-greeting">Hi, {username}!</p>
        )}
        {menuMode === 'main' && (
          <MainMenuActions
            onSetMenuMode={onSetMenuMode}
            refreshFriendMenu={refreshFriendMenu}
          />
        )}
        {menuMode === 'friends' && (
          <FriendsPanel
            canAcceptFriendRequest={canAcceptFriendRequest}
            canSendFriendRequest={canSendFriendRequest}
            friendMenuMessage={friendMenuMessage}
            friendName={friendName}
            friendSlots={friendSlots}
            handleCancelFriendRequest={handleCancelFriendRequest}
            handleSearchFriend={handleSearchFriend}
            handleSendFriendRequest={handleSendFriendRequest}
            incomingRequests={incomingRequests}
            isFriendMenuLoading={isFriendMenuLoading}
            onSetMenuMode={onSetMenuMode}
            refreshFriendMenu={refreshFriendMenu}
            setFriendName={setFriendName}
            setSelectedFriend={setSelectedFriend}
            setSelectedRequest={setSelectedRequest}
          />
        )}
        {menuMode === 'unfriend-confirm' && (
          <MenuConfirmPanel
            title={`UNFRIEND ${selectedFriend?.username}?`}
            onCancel={() => {
              setSelectedFriend(null)
              onSetMenuMode('friends')
            }}
            onConfirm={() => {
              onSetMenuMode('friends')
              handleRemoveFriend(selectedFriend.id)
            }}
          />
        )}
        {menuMode === 'logout' && (
          <MenuConfirmPanel
            title="LOG OUT?"
            onCancel={() => onSetMenuMode('main')}
            onConfirm={onConfirmLogout}
          />
        )}
        {menuMode === 'friend-requests' && (
          <FriendRequestsPanel
            canAcceptFriendRequest={canAcceptFriendRequest}
            friendMenuMessage={friendMenuMessage}
            incomingRequests={incomingRequests}
            isFriendMenuLoading={isFriendMenuLoading}
            onSetMenuMode={onSetMenuMode}
            setSelectedRequest={setSelectedRequest}
          />
        )}
        {menuMode === 'accept-request-confirm' && (
          <MenuConfirmPanel
            confirmDisabled={!canAcceptFriendRequest || isFriendMenuLoading}
            title={`ACCEPT ${selectedRequest?.username}?`}
            onCancel={() => {
              setSelectedRequest(null)
              onSetMenuMode(requestReturnMode)
            }}
            onConfirm={() => {
              onSetMenuMode(requestReturnMode)
              handleAcceptFriendRequest()
            }}
          />
        )}
        {menuMode === 'decline-request-confirm' && (
          <MenuConfirmPanel
            confirmDisabled={isFriendMenuLoading}
            title={`DECLINE ${selectedRequest?.username}?`}
            onCancel={() => {
              setSelectedRequest(null)
              onSetMenuMode(requestReturnMode)
            }}
            onConfirm={() => {
              onSetMenuMode(requestReturnMode)
              handleDeclineFriendRequest()
            }}
          />
        )}
      </section>
    </div>
  )
}

function MainMenuActions({ onSetMenuMode, refreshFriendMenu }) {
  return (
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
  )
}

export default GameMenu
