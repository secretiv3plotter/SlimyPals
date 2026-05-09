# Frontend Backend Integration Roadmap

This roadmap is from the frontend repo point of view. The backend source code will live in a separate repo. This frontend should prepare clean boundaries so it can connect to the backend later while keeping IndexedDB offline functionality.

## Goal

Keep the app local-first:

- IndexedDB remains the offline cache.
- The UI reads fast local state.
- Online actions sync to the backend.
- Offline actions are queued and reconciled later.
- Backend REST/realtime contracts are treated as the source of truth when online.

## 1. API Client Layer

Create:

`src/services/slimyPalsApi/`

Suggested files:

- `client.js`
- `authApi.js`
- `domainApi.js`
- `slimesApi.js`
- `foodFactoryApi.js`
- `friendsApi.js`
- `notificationsApi.js`
- `syncApi.js`
- `index.js`

Responsibilities:

- wrap `fetch`
- attach `Authorization: Bearer <token>`
- parse JSON
- normalize error responses
- expose functions matching `Guidelines/contracts/rest-api.md`

Example functions:

- `login(credentials)`
- `register(credentials)`
- `getMyDomain()`
- `summonSlime()`
- `produceFood()`
- `feedMySlime(slimeId)`
- `feedFriendSlime({ friendUserId, slimeId })`
- `pokeFriendSlime({ friendUserId, slimeId })`
- `deleteMySlime(slimeId)`
- `listNotifications()`
- `syncActions(actions)`

## 2. Runtime Config

Create:

`src/config/apiConfig.js`

Responsibilities:

- read API base URL from Vite env
- provide safe default for local dev

Expected env:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## 3. API Error Mapping

Create:

`src/services/slimyPalsApi/apiError.js`

Responsibilities:

- represent backend errors consistently
- preserve backend `error.code`
- expose user-friendly messages for notifications

Needed for:

- failed summon
- failed food production
- failed feed
- failed friend feed
- failed delete
- auth failures
- rate limit failures

## 4. Domain Gateway Layer

Create:

`src/services/slimyPalsDomain/`

This layer becomes the only thing UI components call for game actions.

Suggested files:

- `domainGateway.js`
- `localDomainGateway.js`
- `remoteDomainGateway.js`
- `localFirstDomainGateway.js`
- `index.js`

Responsibilities:

- hide whether actions are local, remote, or queued
- keep UI code independent from API/IndexedDB details
- preserve current offline behavior

Current UI calls should eventually move from:

- `summonSlime(...)`
- `produceSlimeFood(...)`
- `feedSlime(...)`
- `removeSlime(...)`
- direct repositories

to:

- `domainGateway.loadDomain()`
- `domainGateway.summonSlime()`
- `domainGateway.produceFood()`
- `domainGateway.feedMySlime(slimeId)`
- `domainGateway.feedFriendSlime({ friendUserId, slimeId })`
- `domainGateway.pokeFriendSlime({ friendUserId, slimeId })`
- `domainGateway.deleteMySlime(slimeId)`

## 5. Local Cache Shape

Detailed contract:

`Guidelines/contracts/local-cache-shape.md`

Keep IndexedDB stores for:

- user
- food factory stock
- friendship
- slime
- interaction log

Add stores later for:

- notification
- pending sync action
- remote friend domain cache
- auth/session metadata, if appropriate

The cache should store backend-shaped records after conversion from REST responses.

## 6. Offline Action Queue

Create:

`src/services/offlineSync/`

Suggested files:

- `pendingActionsRepository.js`
- `queueAction.js`
- `syncPendingActions.js`
- `syncStatus.js`

Queued action shape:

```json
{
  "id": "client-action-uuid",
  "type": "feedFriendSlime",
  "payload": {
    "friendUserId": "uuid",
    "slimeId": "uuid"
  },
  "createdAt": "2026-05-08T12:00:00.000Z",
  "status": "pending",
  "attemptCount": 0,
  "lastErrorCode": null
}
```

Supported queued actions:

- summon slime
- produce food
- feed own slime
- feed friend slime
- poke friend slime
- delete own slime

## 7. Online/Offline Detection

Create:

`src/services/networkStatus/`

Responsibilities:

- expose current online state
- listen to browser `online` and `offline` events
- trigger sync when the app comes online
- notify UI when sync fails

## 8. Domain Hydration Flow

On app start:

1. Load cached IndexedDB domain immediately.
2. Render yard from cache.
3. If authenticated and online, call `GET /me/domain`.
4. Save backend domain response into IndexedDB.
5. Re-render from reconciled cache.
6. Sync pending actions if any exist.

If offline:

1. Load cached IndexedDB domain.
2. Continue local-first behavior.
3. Queue actions that need backend reconciliation.

## 9. Friend Yard Integration

Replace mock online friends with backend/realtime data.

Frontend responsibilities:

- render accepted online friends by queue order:
  1. top
  2. right
  3. bottom
  4. left
- hide friend summoning grounds
- hide friend food factories
- hide friend food counts
- allow poking friend slimes
- allow feeding friend slimes with own food
- show friend slime level only after tap/poke
- disallow friend slime deletion

Data sources:

- initial: `GET /me/domain`
- friend details: `GET /friends/:friendUserId/domain`
- realtime updates: WebSocket presence/domain events

## 10. Notification Integration

Current notifications are local UI toasts.

Later:

- successful own actions may show local immediate notifications
- friend POV notifications come from backend/realtime
- persisted notifications load from `GET /me/notifications`

Frontend should distinguish:

- local UI feedback
- persisted backend notification
- friend POV notification that should not show to actor

## 11. Realtime Client Layer

Create:

`src/services/websockets/`

Suggested files:

- `realtimeClient.js`
- `presenceEvents.js`
- `domainEvents.js`
- `notificationEvents.js`
- `index.js`

Responsibilities:

- connect with auth token
- handle reconnect
- subscribe to friend domain updates
- update IndexedDB cache from events
- dispatch notification toasts

Events should match the future realtime contract.

## 12. Auth State

Create:

`src/services/authSession/`

Responsibilities:

- store access token
- store refresh token if chosen
- refresh tokens when needed
- expose current authenticated user
- logout safely

The offline MVP user `offline-mvp` should remain only as a dev/local fallback.

## 13. UI State Additions

Add UI states gradually:

- syncing indicator
- offline indicator
- action queued indicator
- failed sync notification
- auth loading state
- backend unavailable notification

Avoid blocking the whole game when offline.

## 14. Migration Steps

Recommended implementation order:

1. Add API config and API client shell.
2. Add API error type and mapper.
3. Add domain gateway interface.
4. Move current `App.jsx` data/action calls behind local gateway.
5. Add remote gateway that matches REST contracts.
6. Add local-first gateway that chooses local/remote/queue.
7. Add pending action queue.
8. Add app startup hydration from cache, then backend.
9. Replace mock friend yards with domain/realtime data.
10. Add notification persistence and realtime notifications.

## Do Not Do

Do not remove IndexedDB.

Do not make UI components call `fetch` directly.

Do not make backend connectivity required for the app to load.

Do not show friend POV notifications to the actor unless they are explicitly testing mock behavior.
