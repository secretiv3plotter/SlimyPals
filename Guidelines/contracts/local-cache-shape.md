# Local Cache Shape

This contract describes the frontend IndexedDB cache shape for Slimy Pals. It is based on the current frontend game rules, existing Dexie stores, REST contract expectations, and friend-yard mechanics.

IndexedDB remains required. It is not a temporary mock database. It is the offline cache, local read model, and future pending-action queue store.

## Goals

- Render the game while offline.
- Keep the UI fast by reading local state first.
- Store server-confirmed state when online.
- Queue offline actions that need backend reconciliation.
- Support friend yard viewing/interactions when realtime data is available.

## Naming Policy

Current IndexedDB records use `snake_case` because they mirror the original local database schema.

Backend REST responses use `camelCase`.

The frontend integration layer should convert between them:

- API/client/domain gateway boundary: `camelCase`
- IndexedDB storage: current `snake_case`, unless a future migration changes all stores together

Do not mix both naming styles inside one store.

## Existing Stores

Current IndexedDB database:

```js
DB_NAME = 'slimy-pals'
DB_VERSION = 2
```

Current stores:

- `user`
- `food_factory_stock`
- `friendship`
- `slime`
- `interaction_log`

These stores should be kept.

## Store: user

Purpose:

- current local/offline user
- backend-confirmed users once auth exists
- friend user records if needed for friend yard labels

Current schema:

```js
'id,&username,deleted_at,last_login'
```

Shape:

```json
{
  "id": "uuid",
  "username": "offline-mvp",
  "password_hash": "offline-mvp-or-bcrypt-hash",
  "daily_summons_left": 9,
  "max_slime_capacity": 25,
  "last_login": "2026-05-09T00:00:00.000Z",
  "created_at": "2026-05-09T00:00:00.000Z",
  "deleted_at": null
}
```

Frontend rules:

- `daily_summons_left` resets to `9` at local midnight for the offline MVP.
- When backend exists, backend reset time is authoritative.
- `last_login` is currently used as the offline MVP daily reset marker.
- Authenticated backend users should eventually use a clearer server field such as `last_daily_reset_at`.

## Store: food_factory_stock

Purpose:

- local user's food quantity
- production day tracking

Current schema:

```js
'id,&user_id,last_produced_at,deleted_at'
```

Shape:

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "quantity": 12,
  "last_produced_at": "2026-05-09T08:00:00.000Z",
  "created_at": "2026-05-09T00:00:00.000Z",
  "deleted_at": null
}
```

Frontend rules:

- food production is allowed once per local day in offline mode.
- backend production window is authoritative when online.
- max food stock is `100`.
- produced amount is `min(activeSlimeCount, remainingFoodCapacity)`.
- friend food stocks are not shown in friend yards.
- feeding a friend slime consumes the viewer's own `food_factory_stock`.

## Store: slime

Purpose:

- local user's active/deleted slimes
- cached friend slimes for visible friend yards

Current schema:

```js
'id,user_id,rarity,type,level,last_fed_at,deleted_at'
```

Shape:

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "rarity": "Rare",
  "type": "fedora",
  "color": "#e2c84a",
  "level": 1,
  "last_fed_at": null,
  "created_at": "2026-05-09T00:00:00.000Z",
  "deleted_at": null
}
```

Rarity values:

- `Common`
- `Rare`
- `Mythical`

Level values:

- `1`: baby
- `2`: teen
- `3`: adult

Frontend rules:

- active slimes have `deleted_at: null`.
- removed slimes are soft-deleted by setting `deleted_at`.
- own slimes can be deleted by owner.
- friend slimes cannot be deleted by viewer.
- own and friend slimes can be poked.
- friend slime level is only shown after tap/poke.
- feed cooldown is 6 hours from `last_fed_at`.
- adult slimes cannot be fed.

Friend-cache note:

Current schema can store friend slimes because `user_id` identifies the owner. When backend arrives, friend slimes from realtime/domain responses may be cached in this same store.

Friend yard rendering should filter by:

- owner `user_id`
- friendship/online presence
- `deleted_at: null`

## Store: friendship

Purpose:

- friend relationship cache
- accepted/pending status
- future yard placement support

Current schema:

```js
'id,user_id,friend_user_id,&[user_id+friend_user_id],status,deleted_at'
```

Shape:

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "friend_user_id": "uuid",
  "status": "accepted",
  "created_at": "2026-05-09T00:00:00.000Z",
  "deleted_at": null
}
```

Status values:

- `pending`
- `accepted`

Frontend rules:

- max friends is `4`.
- only accepted friends can appear as adjacent yards.
- accepted online friends occupy yard positions by queue:
  1. top
  2. right
  3. bottom
  4. left
- yard position does not need to be permanently stored if it can be derived from online queue order.
- if backend returns `yardPosition`, cache may store it in a future field/store.

## Store: interaction_log

Purpose:

- local history of feed/poke interactions
- basis for future notifications and sync reconciliation

Current schema:

```js
'id,sender_id,target_slime_id,action_type,created_at'
```

Current shape:

```json
{
  "id": "uuid",
  "sender_id": "uuid",
  "target_slime_id": "uuid",
  "action_type": "feed",
  "created_at": "2026-05-09T00:00:00.000Z"
}
```

Action types:

- `feed`
- `poke`

Future recommended fields:

```json
{
  "target_user_id": "uuid",
  "source": "local|server|sync",
  "client_action_id": "uuid-or-null"
}
```

Frontend rules:

- feeding own slime creates a feed interaction.
- feeding friend slime creates a feed interaction where sender is viewer and target user is friend.
- poking friend slime creates a poke interaction.
- poking does not currently create a visible notification.

## New Store: notification

Add when backend/realtime notification persistence starts.

Purpose:

- persisted user notifications
- local toast replay after refresh/reconnect

Suggested schema:

```js
'id,recipient_user_id,actor_user_id,type,read_at,created_at'
```

Shape:

```json
{
  "id": "uuid",
  "recipient_user_id": "uuid",
  "actor_user_id": "uuid",
  "type": "friend_slime_fed",
  "message": "player1 fed your Rare fedora slime.",
  "read_at": null,
  "created_at": "2026-05-09T00:00:00.000Z"
}
```

Notification types:

- `friend_online`
- `own_slime_fed`
- `friend_slime_fed`
- `slime_summoned`
- `food_produced`
- `sync_failed`

Frontend rules:

- main user sees failed action notifications.
- main user sees own success notifications such as summon, food produced, feed own slime.
- friend POV notifications should not be shown to the actor.
- friend POV notifications are stored for the recipient when backend/realtime exists.
- poking has no visible notification in the current UI.

## New Store: pending_sync_action

Add for offline backend sync.

Purpose:

- queue actions made while offline
- retry failed network sync
- reconcile accepted/rejected actions

Suggested schema:

```js
'id,type,status,created_at,last_attempted_at'
```

Shape:

```json
{
  "id": "client-action-uuid",
  "type": "feedFriendSlime",
  "payload": {
    "friendUserId": "uuid",
    "slimeId": "uuid"
  },
  "status": "pending",
  "attempt_count": 0,
  "last_error_code": null,
  "created_at": "2026-05-09T00:00:00.000Z",
  "last_attempted_at": null
}
```

Supported action types:

- `summonSlime`
- `produceFood`
- `feedMySlime`
- `feedFriendSlime`
- `pokeFriendSlime`
- `deleteMySlime`

Do not queue:

- deleting another user's slime
- producing food from another user's factory
- summoning in another user's yard
- using another user's food stock

## New Store: friend_domain_cache

Add when real friend yards replace mock friend yards.

Purpose:

- remember visible friend yard state between realtime updates
- support quick render while reconnecting
- keep friend yard separate from own domain controls

Suggested schema:

```js
'friend_user_id,yard_position,online,last_seen_at'
```

Shape:

```json
{
  "friend_user_id": "uuid",
  "username": "Mika",
  "online": true,
  "yard_position": "top",
  "last_seen_at": "2026-05-09T00:00:00.000Z",
  "updated_at": "2026-05-09T00:00:00.000Z"
}
```

Friend slimes can remain in the `slime` store with `user_id = friend_user_id`.

Frontend rules:

- show only online accepted friends as occupied yards.
- keep empty placeholder yards visible if desired by UI.
- hide friend summoning ground.
- hide friend food factory.
- hide friend food count.
- friend slimes are valid feed targets if rules pass.

## New Store: auth_session

Add when backend auth is integrated.

Purpose:

- current auth session metadata
- token lifecycle support

Suggested schema:

```js
'id,user_id,updated_at'
```

Shape:

```json
{
  "id": "current",
  "user_id": "uuid",
  "access_token_expires_at": "2026-05-09T00:15:00.000Z",
  "updated_at": "2026-05-09T00:00:00.000Z"
}
```

Security note:

Token storage strategy should be finalized in `security-auth.md`. Avoid casually storing long-lived secrets in IndexedDB until that contract is decided.

## Derived Readiness State

Do not store readiness as the source of truth.

These should be derived from cached records or backend responses:

- `canSummon`
- `canProduceFood`
- `canFeedSlime`
- `nextFeedAt`
- `nextDailyResetAt`
- `nextFoodProductionAt`

The UI may keep these in React state for rendering, but IndexedDB should store the underlying records.

## Hydration Rules

On app start:

1. Load local user.
2. Load local food stock.
3. Load own active slimes.
4. Load friend cache if present.
5. Render immediately from IndexedDB.
6. If online and authenticated, fetch backend domain snapshot.
7. Write backend snapshot into IndexedDB.
8. Re-render from reconciled cache.
9. Sync pending actions.

## Friend Feed Local Behavior

When feeding a friend slime offline or in mock mode:

- spend viewer's own food locally only if the simulated rule passes
- do not spend friend's food
- do not show friend POV notification to the actor
- queue or log recipient notification for backend/realtime delivery later

Friend feed constraints:

- viewer must have food
- target slime is active
- target slime is not adult
- target slime's 6-hour feed cooldown is complete
- users are accepted friends once backend exists

## Migration Notes

Future IndexedDB version should add:

- `notification`
- `pending_sync_action`
- `friend_domain_cache`
- optionally `auth_session`

Do this in a single versioned Dexie migration so existing offline MVP data is preserved.
