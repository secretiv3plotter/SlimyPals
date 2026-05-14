import { useMemo, useState } from 'react'
import { FRIEND_SLOTS } from '../../../game/worldConstants'

const DUMMY_FRIENDS = [
  {
    createdAt: '2026-05-01T08:00:00.000Z',
    friendshipId: 'friendship-mochi',
    id: 'user-mochi',
    online: true,
    status: 'accepted',
    username: 'Mochi',
  },
  {
    createdAt: '2026-05-02T09:30:00.000Z',
    friendshipId: 'friendship-boba',
    id: 'user-boba',
    online: false,
    status: 'accepted',
    username: 'Boba',
  },
]

const DUMMY_INCOMING_REQUESTS = [
  {
    createdAt: '2026-05-03T10:00:00.000Z',
    friendshipId: 'request-pip',
    id: 'user-pip',
    status: 'pending',
    username: 'Pip',
  },
  {
    createdAt: '2026-05-04T11:00:00.000Z',
    friendshipId: 'request-nova',
    id: 'user-nova',
    status: 'pending',
    username: 'Nova',
  },
  {
    createdAt: '2026-05-05T12:00:00.000Z',
    friendshipId: 'request-lulu',
    id: 'user-lulu',
    status: 'pending',
    username: 'Lulu',
  },
]

const DUMMY_SENT_REQUESTS = [
  {
    createdAt: '2026-05-06T13:00:00.000Z',
    friendshipId: 'sent-kiki',
    id: 'user-kiki',
    status: 'pending',
    username: 'Kiki',
  },
]

const DUMMY_SEARCH_USERS = [
  ...DUMMY_FRIENDS,
  ...DUMMY_INCOMING_REQUESTS,
  ...DUMMY_SENT_REQUESTS,
  {
    id: 'user-sage',
    username: 'Sage',
  },
  {
    id: 'user-rio',
    username: 'Rio',
  },
  {
    id: 'user-zed',
    username: 'Zed',
  },
]

export function useFriendMenuState() {
  const [friends, setFriends] = useState(() => sortByCreatedAt(DUMMY_FRIENDS))
  const [incomingRequests, setIncomingRequests] = useState(() => (
    sortByCreatedAt(DUMMY_INCOMING_REQUESTS)
  ))
  const [sentRequests, setSentRequests] = useState(() => sortByCreatedAt(DUMMY_SENT_REQUESTS))
  const [friendName, setFriendName] = useState('')
  const [searchedUser, setSearchedUser] = useState(null)
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [friendMenuMessage, setFriendMenuMessage] = useState('')
  const [isFriendMenuLoading, setIsFriendMenuLoading] = useState(false)

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

  async function refreshFriendMenu() {
    setFriendMenuMessage('')
    setIsFriendMenuLoading(false)
  }

  async function handleSearchFriend() {
    const username = friendName.trim()

    if (!username) {
      setSearchedUser(null)
      setFriendMenuMessage('')
      return
    }

    setFriendMenuMessage('')

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

    const user = DUMMY_SEARCH_USERS.find((candidate) => sameUsername(candidate.username, username))
    if (!user) {
      setSearchedUser(null)
      setFriendMenuMessage('That user could not be found.')
      return
    }

    setSearchedUser({
      id: user.id,
      username: user.username,
    })
  }

  async function handleSendFriendRequest(user = searchedUser) {
    if (!user || !canSendFriendRequest) {
      return
    }

    const request = {
      createdAt: new Date().toISOString(),
      friendshipId: `sent-${user.id}`,
      id: user.id,
      status: 'pending',
      username: user.username,
    }

    setSentRequests((currentRequests) => sortByCreatedAt([...currentRequests, request]))
    setSearchedUser(null)
    setFriendName('')
    setFriendMenuMessage(`Friend request sent to ${user.username}.`)
  }

  async function handleAcceptFriendRequest(request = selectedRequest) {
    if (!request || !canAcceptFriendRequest) {
      return
    }

    const acceptedFriend = {
      createdAt: request.createdAt,
      friendshipId: request.friendshipId,
      id: request.id,
      online: Math.random() > 0.5,
      status: 'accepted',
      username: request.username,
    }

    setFriends((currentFriends) => sortByCreatedAt([...currentFriends, acceptedFriend]))
    setIncomingRequests((currentRequests) => (
      currentRequests.filter((currentRequest) => (
        currentRequest.friendshipId !== request.friendshipId
      ))
    ))
    setSelectedRequest(null)
    setSearchedUser(null)
    setFriendMenuMessage(`${request.username} is now your friend.`)
  }

  async function handleDeclineFriendRequest(request = selectedRequest) {
    if (!request) {
      return
    }

    setIncomingRequests((currentRequests) => (
      currentRequests.filter((currentRequest) => (
        currentRequest.friendshipId !== request.friendshipId
      ))
    ))
    setSelectedRequest(null)
    setSearchedUser((currentUser) => (
      currentUser?.friendshipId === request.friendshipId ? null : currentUser
    ))
    setFriendMenuMessage(`Declined ${request.username}'s friend request.`)
  }

  async function handleCancelFriendRequest(request = selectedRequest) {
    if (!request) {
      return
    }

    setSentRequests((currentRequests) => (
      currentRequests.filter((currentRequest) => (
        currentRequest.friendshipId !== request.friendshipId
      ))
    ))
    setSearchedUser((currentUser) => (
      currentUser?.friendshipId === request.friendshipId ? null : currentUser
    ))
    setSelectedRequest(null)
    setFriendMenuMessage(`Canceled friend request to ${request.username}.`)
  }

  async function handleRemoveFriend(friendId) {
    const friend = friends.find((currentFriend) => currentFriend.id === friendId)

    if (!friend) {
      return
    }

    setFriends((currentFriends) => (
      currentFriends.filter((currentFriend) => currentFriend.id !== friendId)
    ))
    setSelectedFriend(null)
    setFriendMenuMessage(`${friend.username} was removed from your friends.`)
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

function sortByCreatedAt(items) {
  return [...items].sort((left, right) => (
    new Date(left.createdAt || 0).getTime() - new Date(right.createdAt || 0).getTime()
  ))
}

function sameUsername(left, right) {
  return String(left || '').toLowerCase() === String(right || '').toLowerCase()
}
