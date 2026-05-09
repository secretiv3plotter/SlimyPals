# Slimy Pals Backend API Contracts

Base URL: `/api`

All JSON responses use ISO 8601 timestamps. Backend time is authoritative for daily reset, production day checks, and feed cooldowns. IndexedDB remains the offline cache and pending-action queue on the frontend.

## Shared Response Shapes

### Error

```json
{
  "error": {
    "code": "DAILY_SUMMON_LIMIT_REACHED",
    "message": "The user has no daily summons left.",
    "details": {}
  }
}
```

Use stable `code` values so the frontend can map rule failures without parsing text.

Common status codes:
- `200`: success
- `201`: created
- `400`: invalid request body
- `401`: unauthenticated
- `403`: forbidden
- `404`: not found
- `409`: domain rule conflict
- `429`: rate limited

### User

```json
{
  "id": "uuid",
  "username": "player1",
  "dailySummonsLeft": 9,
  "maxSlimeCapacity": 25,
  "lastDailyResetAt": "2026-05-08T16:00:00.000Z",
  "createdAt": "2026-05-08T10:00:00.000Z"
}
```

### Slime

```json
{
  "id": "uuid",
  "userId": "uuid",
  "rarity": "Common",
  "type": "green",
  "color": "#58b56b",
  "level": 1,
  "lastFedAt": null,
  "nextFeedAt": null,
  "createdAt": "2026-05-08T10:00:00.000Z",
  "deletedAt": null
}
```

### Food Factory Stock

```json
{
  "id": "uuid",
  "userId": "uuid",
  "quantity": 12,
  "lastProducedAt": "2026-05-08T10:00:00.000Z",
  "canProduce": false,
  "nextProductionAt": "2026-05-09T00:00:00.000+08:00",
  "maxFoodStock": 100
}
```

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
  "user": {},
  "accessToken": "jwt",
  "refreshToken": "jwt"
}
```

Errors:
- `USERNAME_TAKEN`
- `INVALID_CREDENTIALS`

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

### Refresh Token

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

## Domain Snapshot

### Get My Domain

`GET /me/domain`

Returns all state the current yard needs after login, refresh, or offline sync.

Response `200`:

```json
{
  "serverTime": "2026-05-08T10:00:00.000Z",
  "user": {},
  "foodFactoryStock": {},
  "slimes": [],
  "summonReadiness": {
    "allowed": true,
    "reason": null,
    "dailySummonsLeft": 9,
    "activeSlimeCount": 3,
    "maxSlimeCapacity": 25,
    "nextDailyResetAt": "2026-05-09T00:00:00.000+08:00"
  },
  "foodProductionReadiness": {
    "allowed": false,
    "reason": "FOOD_ALREADY_PRODUCED_TODAY",
    "currentFoodQuantity": 12,
    "producedQuantity": 0,
    "maxFoodStock": 100,
    "nextProductionAt": "2026-05-09T00:00:00.000+08:00"
  }
}
```

## Slimes

### Summon Slime

`POST /me/slimes/summon`

Request:

```json
{}
```

Response `201`:

```json
{
  "slime": {},
  "user": {},
  "summonReadiness": {}
}
```

Rules:
- daily summons left must be greater than 0
- active slime count must be less than max capacity

Errors:
- `USER_UNAVAILABLE`
- `DAILY_SUMMON_LIMIT_REACHED`
- `DOMAIN_CAPACITY_REACHED`

### Feed Slime

`POST /me/slimes/:slimeId/feed`

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
    "targetSlimeId": "uuid",
    "actionType": "feed",
    "createdAt": "2026-05-08T10:00:00.000Z"
  }
}
```

Rules:
- slime must be active
- slime must not already be adult
- food quantity must be greater than 0
- feed cooldown must be open

Errors:
- `SLIME_UNAVAILABLE`
- `SLIME_ALREADY_ADULT`
- `NO_FOOD_AVAILABLE`
- `FEED_COOLDOWN_ACTIVE`

### Poke Slime

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
    "targetSlimeId": "uuid",
    "actionType": "poke",
    "createdAt": "2026-05-08T10:00:00.000Z"
  }
}
```

### Soft Delete Slime

`DELETE /me/slimes/:slimeId`

Response `200`:

```json
{
  "slime": {
    "id": "uuid",
    "deletedAt": "2026-05-08T10:00:00.000Z"
  },
  "foodProductionReadiness": {},
  "summonReadiness": {}
}
```

Rules:
- slime must be active
- slime must belong to the current user

Errors:
- `SLIME_UNAVAILABLE`
- `SLIME_OWNER_MISMATCH`

## Food Factory

### Produce Food

`POST /me/food-factory/produce`

Request:

```json
{}
```

Response `200`:

```json
{
  "foodFactoryStock": {},
  "producedQuantity": 3,
  "foodProductionReadiness": {}
}
```

Rules:
- user must be active
- active slime count must be greater than 0
- production must not have already happened today
- food stock must be below 100
- produced amount is `min(activeSlimeCount, remainingFoodCapacity)`

Errors:
- `USER_UNAVAILABLE`
- `NO_ACTIVE_SLIMES`
- `FOOD_ALREADY_PRODUCED_TODAY`
- `FOOD_STOCK_FULL`

## Daily Timers

### Get Daily Timers

`GET /me/timers`

Response `200`:

```json
{
  "serverTime": "2026-05-08T10:00:00.000Z",
  "nextDailyResetAt": "2026-05-09T00:00:00.000+08:00",
  "nextFoodProductionAt": "2026-05-09T00:00:00.000+08:00"
}
```

Backend should reset daily summons during authenticated requests if the user's `lastDailyResetAt` is older than the current reset window. A background cron may also reset, but request-time reset is required so offline or sleeping users still recover correctly.

## Friends

### List Friends

`GET /me/friends`

Response `200`:

```json
{
  "friends": [
    {
      "id": "uuid",
      "username": "friend1",
      "status": "accepted",
      "online": true
    }
  ],
  "maxFriends": 4
}
```

### Request Friend

`POST /me/friends`

Request:

```json
{
  "username": "friend1"
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
    "createdAt": "2026-05-08T10:00:00.000Z"
  }
}
```

Errors:
- `FRIEND_LIMIT_REACHED`
- `FRIEND_USER_NOT_FOUND`
- `FRIENDSHIP_ALREADY_EXISTS`

### Accept Friend

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
    "deletedAt": "2026-05-08T10:00:00.000Z"
  }
}
```

### Get Friend Domain

`GET /friends/:friendUserId/domain`

Response `200`:

```json
{
  "user": {
    "id": "uuid",
    "username": "friend1",
    "online": true
  },
  "foodFactoryStock": {},
  "slimes": []
}
```

Rules:
- friendship must exist and be accepted

Errors:
- `FRIENDSHIP_UNAVAILABLE`

## Offline Sync

Frontend IndexedDB should store pending actions while offline.

### Sync Actions

`POST /sync/actions`

Request:

```json
{
  "clientId": "browser-generated-uuid",
  "actions": [
    {
      "clientActionId": "uuid",
      "type": "summonSlime",
      "createdAt": "2026-05-08T10:00:00.000Z",
      "payload": {}
    },
    {
      "clientActionId": "uuid",
      "type": "feedSlime",
      "createdAt": "2026-05-08T10:05:00.000Z",
      "payload": {
        "slimeId": "uuid"
      }
    }
  ]
}
```

Response `200`:

```json
{
  "accepted": [
    {
      "clientActionId": "uuid",
      "result": {}
    }
  ],
  "rejected": [
    {
      "clientActionId": "uuid",
      "error": {
        "code": "FEED_COOLDOWN_ACTIVE",
        "message": "This slime must wait for its next 6-hour feeding window."
      }
    }
  ],
  "domain": {}
}
```

Supported MVP action types:
- `summonSlime`
- `produceFood`
- `feedSlime`
- `pokeSlime`
- `deleteSlime`

The backend validates every queued action using server state and server time. The returned `domain` snapshot is the final reconciliation source for IndexedDB.

## Realtime

Use WebSocket for presence and friend domain updates after the REST MVP works.

Events from client:
- `presence.online`
- `presence.offline`
- `domain.subscribe`
- `domain.unsubscribe`

Events from server:
- `friend.online`
- `friend.offline`
- `domain.slime.created`
- `domain.slime.updated`
- `domain.slime.deleted`
- `domain.food.updated`
- `interaction.created`
