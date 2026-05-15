import { useCallback, useMemo, useRef, useState } from 'react'
import { FRIEND_SLOTS } from '../../../game/worldConstants'
import {
  acceptFriendRequest,
  getApiErrorMessage,
  listFriends,
  removeFriend,
  searchUser,
  sendFriendRequest,
} from '../../../services/slimyPalsApi'

export function useFriendMenuState() {
  const [friends, setFriends] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [friendName, setFriendName] = useState('')
  const [searchedUser, setSearchedUser] = useState(null)
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [friendMenuMessage, setFriendMenuMessage] = useState('')
  const [isFriendMenuLoading, setIsFriendMenuLoading] = useState(false)
  const refreshRequestIdRef = useRef(0)

  const occupiedFriendSlots = friends.length + sentRequests.length
  const availableFriendSlots = Math.max(0, FRIEND_SLOTS - occupiedFriendSlots)
  const canSendFriendRequest = availableFriendSlots > 0
  const canAcceptFriendRequest = occupiedFriendSlots < FRIEND_SLOTS

  const friendSlots = useMemo(() => {
    const occupiedSlots = [
      ...friends.map((friend) => ({
        ...friend,
        slotType: 'friend',
      })),
      ...sentRequests.map((request) => ({
        ...request,
        slotType: 'sent-request',
      })),
    ]

    if (searchedUser && occupiedSlots.length < FRIEND_SLOTS) {
      occupiedSlots.push({
        ...searchedUser,
        slotType: searchedUser.incomingRequest ? 'incoming-search' : 'search-result',
      })
    }

    return Array.from({ length: FRIEND_SLOTS }, (_, index) => (
      occupiedSlots[index] || {
        id: `empty-${index}`,
        slotType: 'empty',
      }
    ))
  }, [friends, searchedUser, sentRequests])

  const applyFriendListResponse = useCallback((response) => {
    const payload = getPayload(response)

    setFriends((payload.friends || []).map(normalizeFriend).sort(sortByCreatedAt))
    setIncomingRequests((payload.pending || []).map(normalizeIncomingRequest).sort(sortByCreatedAt))
    setSentRequests((payload.sent || []).map(normalizeSentRequest).sort(sortByCreatedAt))
  }, [])

  const refreshFriendMenu = useCallback(async () => {
    const requestId = refreshRequestIdRef.current + 1
    refreshRequestIdRef.current = requestId
    setIsFriendMenuLoading(true)
    setFriendMenuMessage('')

    try {
      const response = await listFriends()
      if (requestId === refreshRequestIdRef.current) {
        applyFriendListResponse(response)
      }
    } catch (error) {
      if (requestId === refreshRequestIdRef.current) {
        setFriendMenuMessage(getApiErrorMessage(error, 'Unable to load friends.'))
      }
    } finally {
      if (requestId === refreshRequestIdRef.current) {
        setIsFriendMenuLoading(false)
      }
    }
  }, [applyFriendListResponse])

  async function handleSearchFriend() {
    const username = friendName.trim()

    if (!username) {
      setSearchedUser(null)
      setFriendMenuMessage('')
      return
    }

    setIsFriendMenuLoading(true)
    setFriendMenuMessage('')

    try {
      const existingFriend = friends.find((friend) => sameUsername(friend.username, username))
      if (existingFriend) {
        setSearchedUser(null)
        setFriendMenuMessage('That user is already your friend.')
        return
      }

      const incomingRequest = incomingRequests.find((request) => (
        sameUsername(request.username, username)
      ))
      if (incomingRequest) {
        setSearchedUser({
          ...incomingRequest,
          incomingRequest: true,
        })
        setFriendMenuMessage(
          canAcceptFriendRequest
            ? `${incomingRequest.username} already sent you a request. Accept or decline?`
            : `${incomingRequest.username} sent you a request, but your slots are full.`,
        )
        return
      }

      const sentRequest = sentRequests.find((request) => sameUsername(request.username, username))
      if (sentRequest) {
        setSearchedUser(null)
        setFriendMenuMessage('You already sent that user a friend request.')
        return
      }

      if (!canSendFriendRequest) {
        setSearchedUser(null)
        setFriendMenuMessage('You need an open friend slot to add someone.')
        return
      }

      const response = await searchUser(username)
      const user = getPayload(response).user

      setSearchedUser({
        id: user.id,
        username: user.username,
      })
    } catch (error) {
      setSearchedUser(null)
      setFriendMenuMessage(getApiErrorMessage(error, 'That user could not be found.'))
    } finally {
      setIsFriendMenuLoading(false)
    }
  }

  async function handleSendFriendRequest(user = searchedUser) {
    if (!user || !canSendFriendRequest) {
      return
    }

    setIsFriendMenuLoading(true)
    setFriendMenuMessage('')

    try {
      await sendFriendRequest(user.username)
      setSearchedUser(null)
      setFriendName('')
      await refreshFriendMenu()
      setFriendMenuMessage(`Friend request sent to ${user.username}.`)
    } catch (error) {
      setFriendMenuMessage(getApiErrorMessage(error, 'Unable to send friend request.'))
    } finally {
      setIsFriendMenuLoading(false)
    }
  }

  async function handleAcceptFriendRequest(request = selectedRequest) {
    if (!request || !canAcceptFriendRequest) {
      return
    }

    setIsFriendMenuLoading(true)
    setFriendMenuMessage('')

    try {
      await acceptFriendRequest(request.friendshipId)
      setSelectedRequest(null)
      setSearchedUser(null)
      await refreshFriendMenu()
      setFriendMenuMessage(`${request.username} is now your friend.`)
    } catch (error) {
      setFriendMenuMessage(getApiErrorMessage(error, 'Unable to accept friend request.'))
    } finally {
      setIsFriendMenuLoading(false)
    }
  }

  async function handleDeclineFriendRequest(request = selectedRequest) {
    if (!request) {
      return
    }

    setIsFriendMenuLoading(true)
    setFriendMenuMessage('')

    try {
      await removeFriend(request.friendshipId)
      setSelectedRequest(null)
      setSearchedUser((currentUser) => (
        currentUser?.friendshipId === request.friendshipId ? null : currentUser
      ))
      await refreshFriendMenu()
      setFriendMenuMessage(`Declined ${request.username}'s friend request.`)
    } catch (error) {
      setFriendMenuMessage(getApiErrorMessage(error, 'Unable to decline friend request.'))
    } finally {
      setIsFriendMenuLoading(false)
    }
  }

  async function handleCancelFriendRequest(request = selectedRequest) {
    if (!request) {
      return
    }

    setIsFriendMenuLoading(true)
    setFriendMenuMessage('')

    try {
      await removeFriend(request.friendshipId)
      setSelectedRequest(null)
      setSearchedUser((currentUser) => (
        currentUser?.friendshipId === request.friendshipId ? null : currentUser
      ))
      await refreshFriendMenu()
      setFriendMenuMessage(`Canceled friend request to ${request.username}.`)
    } catch (error) {
      setFriendMenuMessage(getApiErrorMessage(error, 'Unable to cancel friend request.'))
    } finally {
      setIsFriendMenuLoading(false)
    }
  }

  async function handleRemoveFriend(friendId) {
    const friend = friends.find((currentFriend) => currentFriend.id === friendId)

    if (!friend) {
      return
    }

    setIsFriendMenuLoading(true)
    setFriendMenuMessage('')

    try {
      await removeFriend(friend.friendshipId)
      setSelectedFriend(null)
      await refreshFriendMenu()
      setFriendMenuMessage(`${friend.username} was removed from your friends.`)
    } catch (error) {
      setFriendMenuMessage(getApiErrorMessage(error, 'Unable to remove friend.'))
    } finally {
      setIsFriendMenuLoading(false)
    }
  }

  return {
    availableFriendSlots,
    canAcceptFriendRequest,
    canSendFriendRequest,
    friendMenuMessage,
    friendName,
    friends,
    friendSlots,
    handleAcceptFriendRequest,
    handleCancelFriendRequest,
    handleDeclineFriendRequest,
    handleRemoveFriend,
    handleSearchFriend,
    handleSendFriendRequest,
    incomingRequests,
    isFriendMenuLoading,
    refreshFriendMenu,
    searchedUser,
    selectedFriend,
    selectedRequest,
    sentRequests,
    setFriendName,
    setSearchedUser,
    setSelectedFriend,
    setSelectedRequest,
  }
}

function getPayload(response) {
  return response?.data || response || {}
}

function normalizeFriend(friend) {
  return {
    createdAt: friend.createdAt || friend.created_at,
    friendshipId: friend.friendshipId || friend.id,
    id: friend.friendUserId || friend.friend_id || friend.id,
    online: Boolean(friend.online),
    status: friend.status || 'accepted',
    username: friend.username || friend.friend_username,
  }
}

function normalizeIncomingRequest(request) {
  return {
    createdAt: request.createdAt || request.created_at,
    friendshipId: request.friendshipId || request.id,
    id: request.senderId || request.sender_id,
    status: 'pending',
    username: request.username || request.senderUsername || request.sender_username,
  }
}

function normalizeSentRequest(request) {
  return {
    createdAt: request.createdAt || request.created_at,
    friendshipId: request.friendshipId || request.id,
    id: request.receiverId || request.receiver_id,
    status: 'pending',
    username: request.username || request.receiverUsername || request.receiver_username,
  }
}

function sortByCreatedAt(left, right) {
  return new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime()
}

function sameUsername(left, right) {
  return String(left || '').toLowerCase() === String(right || '').toLowerCase()
}
