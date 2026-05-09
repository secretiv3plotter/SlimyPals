# REST API Contract

Base URL: `/api`

The backend is authoritative for game rules, ownership, time, cooldowns, daily resets, and friendship permissions. The frontend may keep IndexedDB as an offline cache and action queue, but REST responses are the reconciliation source when online.

All request and response bodies are JSON. Response fields use `camelCase`. Database columns may use `snake_case`.

## Common Rules

Protected routes require:

```http
Authorization: Bearer <accessToken>
```

Standard error response:

```json
{
  "error": {
    "code": "FEED_COOLDOWN_ACTIVE",
    "message": "This slime must wait before being fed again.",
    "details": {}
  }
}
```

Common status codes:
- `200`: success
- `201`: created
- `400`: invalid request
- `401`: unauthenticated
- `403`: forbidden
- `404`: missing resource
- `409`: game rule conflict
- `429`: rate limited

## Auth

### Register

`POST /auth/register`

Request:

```json
{
  "username": "player1",
  "password": "plain-password"
}
```

Response `201`:

```json
{
  "user": {
    "id": "uuid",
    "username": "player1",
    "dailySummonsLeft": 9,
    "maxSlimeCapacity": 25,
    "createdAt": "2026-05-08T12:00:00.000Z"
  },
  "accessToken": "jwt",
  "refreshToken": "jwt"
}
```

### Login

`POST /auth/login`

Request:

```json
{
  "username": "player1",
  "password": "plain-password"
}
```

Response `200`:

```json
{
  "user": {},
  "accessToken": "jwt",
  "refreshToken": "jwt"
}
```

### Refresh

`POST /auth/refresh`

Request:

```json
{
  "refreshToken": "jwt"
}
```

Response `200`:

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt"
}
```

### Logout

`POST /auth/logout`

Request:

```json
{
  "refreshToken": "jwt"
}
```

Response `200`:

```json
{
  "ok": true
}
```

## Current User

### Get Current User

`GET /me`

Response `200`:

```json
{
  "user": {
    "id": "uuid",
    "username": "player1",
    "dailySummonsLeft": 7,
    "maxSlimeCapacity": 25,
    "lastDailyResetAt": "2026-05-08T00:00:00.000+08:00",
    "createdAt": "2026-05-08T12:00:00.000Z"
  }
}
```

## Domain Snapshot

### Get My Domain

`GET /me/domain`

This is the main app bootstrap endpoint. It should run request-time daily reset before responding.

Response `200`:

```json
{
  "serverTime": "2026-05-08T12:00:00.000Z",
  "user": {},
  "foodFactoryStock": {
    "id": "uuid",
    "userId": "uuid",
    "quantity": 5,
    "lastProducedAt": "2026-05-08T09:00:00.000Z",
    "maxFoodStock": 100
  },
  "slimes": [],
  "friends": [],
  "timers": {
    "nextDailyResetAt": "2026-05-09T00:00:00.000+08:00",
    "nextFoodProductionAt": "2026-05-09T00:00:00.000+08:00"
  },
  "summonReadiness": {
    "allowed": true,
    "reason": null,
    "dailySummonsLeft": 7,
    "activeSlimeCount": 4,
    "maxSlimeCapacity": 25
  },
  "foodProductionReadiness": {
    "allowed": false,
    "reason": "FOOD_ALREADY_PRODUCED_TODAY",
    "currentFoodQuantity": 5,
    "producedQuantity": 0,
    "maxFoodStock": 100
  }
}
```

## Slimes

### List My Slimes

`GET /me/slimes`

Response `200`:

```json
{
  "slimes": []
}
```

### Summon Slime

`POST /me/slimes/summon`

Request:

```json
{}
```

Response `201`:

```json
{
  "slime": {
    "id": "uuid",
    "userId": "uuid",
    "rarity": "Rare",
    "type": "fedora",
    "color": "#58b56b",
    "level": 1,
    "lastFedAt": null,
    "nextFeedAt": null,
    "createdAt": "2026-05-08T12:00:00.000Z",
    "deletedAt": null
  },
  "user": {
    "id": "uuid",
    "dailySummonsLeft": 6
  },
  "summonReadiness": {}
}
```

Backend rules:
- user must be active
- daily summons left must be greater than `0`
- active slime count must be below `maxSlimeCapacity`
- rarity roll is server-side
- color/type roll is server-side

Possible errors:
- `USER_UNAVAILABLE`
- `DAILY_SUMMON_LIMIT_REACHED`
- `DOMAIN_CAPACITY_REACHED`

### Feed My Slime

`POST /me/slimes/:slimeId/feed`

Feeds one of the current user's own slimes using the current user's food.

Request:

```json
{}
```

Response `200`:

```json
{
  "slime": {},
  "foodFactoryStock": {},
  "interactionLog": {
    "id": "uuid",
    "senderId": "uuid",
    "targetUserId": "uuid",
    "targetSlimeId": "uuid",
    "actionType": "feed",
    "createdAt": "2026-05-08T12:00:00.000Z"
  },
  "notification": {
    "id": "uuid",
    "recipientUserId": "uuid",
    "message": "You fed your Rare fedora slime.",
    "createdAt": "2026-05-08T12:00:00.000Z"
  }
}
```

Backend rules:
- slime must belong to current user
- slime must be active
- current user must have food
- slime must not be adult
- 6-hour feed cooldown must be complete

Possible errors:
- `SLIME_UNAVAILABLE`
- `SLIME_OWNER_MISMATCH`
- `NO_FOOD_AVAILABLE`
- `SLIME_ALREADY_ADULT`
- `FEED_COOLDOWN_ACTIVE`

### Poke My Slime

`POST /me/slimes/:slimeId/poke`

Request:

```json
{}
```

Response `200`:

```json
{
  "slime": {},
  "interactionLog": {
    "id": "uuid",
    "senderId": "uuid",
    "targetUserId": "uuid",
    "targetSlimeId": "uuid",
    "actionType": "poke",
    "createdAt": "2026-05-08T12:00:00.000Z"
  }
}
```

No notification is required for poking in the current frontend behavior.

### Delete My Slime

`DELETE /me/slimes/:slimeId`

Soft-deletes one of the current user's own slimes.

Response `200`:

```json
{
  "slime": {
    "id": "uuid",
    "deletedAt": "2026-05-08T12:00:00.000Z"
  },
  "summonReadiness": {},
  "foodProductionReadiness": {}
}
```

Backend rules:
- slime must belong to current user
- slime must be active

Possible errors:
- `SLIME_UNAVAILABLE`
- `SLIME_OWNER_MISMATCH`

## Food Factory

### Get Food Factory

`GET /me/food-factory`

Response `200`:

```json
{
  "foodFactoryStock": {},
  "foodProductionReadiness": {}
}
```

### Produce Food

`POST /me/food-factory/produce`

Request:

```json
{}
```

Response `200`:

```json
{
  "foodFactoryStock": {
    "id": "uuid",
    "userId": "uuid",
    "quantity": 8,
    "lastProducedAt": "2026-05-08T12:00:00.000Z",
    "maxFoodStock": 100
  },
  "producedQuantity": 3,
  "foodProductionReadiness": {
    "allowed": false,
    "reason": "FOOD_ALREADY_PRODUCED_TODAY"
  },
  "notification": {
    "id": "uuid",
    "recipientUserId": "uuid",
    "message": "Your factory produced 3 food.",
    "createdAt": "2026-05-08T12:00:00.000Z"
  }
}
```

Backend rules:
- user must be active
- active slime count must be greater than `0`
- food must not have been produced in the current reset window
- current food quantity must be below `100`
- produced amount is `min(activeSlimeCount, remainingFoodCapacity)`

Possible errors:
- `USER_UNAVAILABLE`
- `NO_ACTIVE_SLIMES`
- `FOOD_ALREADY_PRODUCED_TODAY`
- `FOOD_STOCK_FULL`

## Friends

### List Friends

`GET /me/friends`

Response `200`:

```json
{
  "friends": [
    {
      "id": "uuid",
      "username": "Mika",
      "friendshipId": "uuid",
      "status": "accepted",
      "online": true,
      "yardPosition": "top"
    }
  ],
  "maxFriends": 4
}
```

Online accepted friends should be assigned yard positions by queue order:

1. `top`
2. `right`
3. `bottom`
4. `left`

### Send Friend Request

`POST /me/friends`

Request:

```json
{
  "username": "Mika"
}
```

Response `201`:

```json
{
  "friendship": {
    "id": "uuid",
    "userId": "uuid",
    "friendUserId": "uuid",
    "status": "pending",
    "createdAt": "2026-05-08T12:00:00.000Z"
  }
}
```

Possible errors:
- `FRIEND_USER_NOT_FOUND`
- `FRIEND_LIMIT_REACHED`
- `FRIENDSHIP_ALREADY_EXISTS`

### Accept Friend Request

`POST /me/friends/:friendshipId/accept`

Response `200`:

```json
{
  "friendship": {
    "id": "uuid",
    "status": "accepted"
  }
}
```

### Remove Friend

`DELETE /me/friends/:friendshipId`

Response `200`:

```json
{
  "friendship": {
    "id": "uuid",
    "deletedAt": "2026-05-08T12:00:00.000Z"
  }
}
```

## Friend Yards

### Get Friend Domain

`GET /friends/:friendUserId/domain`

Response `200`:

```json
{
  "friend": {
    "id": "uuid",
    "username": "Mika",
    "online": true,
    "yardPosition": "top"
  },
  "slimes": []
}
```

Friend domain response excludes:
- summoning ground state
- food factory state
- food count

Backend rules:
- users must be accepted friends
- deleted slimes are excluded

Possible errors:
- `FRIENDSHIP_UNAVAILABLE`

### Feed Friend Slime

`POST /friends/:friendUserId/slimes/:slimeId/feed`

Feeds a friend's slime using the current user's food.

Request:

```json
{}
```

Response `200`:

```json
{
  "slime": {},
  "feederFoodFactoryStock": {},
  "interactionLog": {
    "id": "uuid",
    "senderId": "uuid",
    "targetUserId": "uuid",
    "targetSlimeId": "uuid",
    "actionType": "feed",
    "createdAt": "2026-05-08T12:00:00.000Z"
  },
  "notification": {
    "id": "uuid",
    "recipientUserId": "friend-user-uuid",
    "message": "player1 fed your Rare fedora slime.",
    "createdAt": "2026-05-08T12:00:00.000Z"
  }
}
```

Backend rules:
- users must be accepted friends
- target slime must belong to `friendUserId`
- target slime must be active
- current user spends their own food
- friend food stock is not used
- target slime must not be adult
- 6-hour feed cooldown must be complete

Possible errors:
- `FRIENDSHIP_UNAVAILABLE`
- `SLIME_UNAVAILABLE`
- `SLIME_OWNER_MISMATCH`
- `NO_FOOD_AVAILABLE`
- `SLIME_ALREADY_ADULT`
- `FEED_COOLDOWN_ACTIVE`

### Poke Friend Slime

`POST /friends/:friendUserId/slimes/:slimeId/poke`

Request:

```json
{}
```

Response `200`:

```json
{
  "slime": {},
  "interactionLog": {
    "id": "uuid",
    "senderId": "uuid",
    "targetUserId": "uuid",
    "targetSlimeId": "uuid",
    "actionType": "poke",
    "createdAt": "2026-05-08T12:00:00.000Z"
  }
}
```

Backend rules:
- users must be accepted friends
- friends can poke anytime
- poke does not require food
- poke does not create a notification in current frontend behavior

Forbidden friend actions:
- deleting another user's slime
- summoning in another user's yard
- producing food from another user's factory
- using another user's food stock

## Notifications

### List Notifications

`GET /me/notifications?limit=20`

Response `200`:

```json
{
  "notifications": [
    {
      "id": "uuid",
      "recipientUserId": "uuid",
      "actorUserId": "uuid",
      "type": "friend_slime_fed",
      "message": "player1 fed your Rare fedora slime.",
      "readAt": null,
      "createdAt": "2026-05-08T12:00:00.000Z"
    }
  ]
}
```

### Mark Notification Read

`POST /me/notifications/:notificationId/read`

Response `200`:

```json
{
  "notification": {
    "id": "uuid",
    "readAt": "2026-05-08T12:00:00.000Z"
  }
}
```

Notification types for MVP:
- `friend_online`
- `own_slime_fed`
- `friend_slime_fed`
- `slime_summoned`
- `food_produced`

## Timers

### Get Timers

`GET /me/timers`

Response `200`:

```json
{
  "serverTime": "2026-05-08T12:00:00.000Z",
  "nextDailyResetAt": "2026-05-09T00:00:00.000+08:00",
  "nextFoodProductionAt": "2026-05-09T00:00:00.000+08:00"
}
```

## Offline Sync Entry Point

Detailed sync rules belong in `Guidelines/contracts/offline-sync.md`, but REST should reserve this endpoint.

`POST /sync/actions`

Request:

```json
{
  "clientId": "browser-generated-uuid",
  "actions": []
}
```

Response `200`:

```json
{
  "accepted": [],
  "rejected": [],
  "domain": {}
}
```

## Health Check

`GET /health`

Response `200`:

```json
{
  "ok": true,
  "service": "slimy-pals-api"
}
```
