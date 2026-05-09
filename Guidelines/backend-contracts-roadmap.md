# Backend Contracts Roadmap

This frontend repo will not contain backend source code. Backend work should be planned here as contracts and integration notes, then implemented in a separate backend repo.

Create these contracts one by one.

## 0. Friend Yard Mechanics

File: `Guidelines/friend-yard-mechanics.md`

Covers:
- where online friends' yards appear on the map
- what parts of a friend's yard are visible
- realtime friend yard visibility
- feeding friend slimes with the viewer's own food
- poking friend slimes
- friend slime level visibility
- forbidden friend actions
- interaction notifications

## 1. REST API Contract

File: `Guidelines/contracts/rest-api.md`

Covers:
- auth endpoints
- user/session endpoints
- domain snapshot
- summon slime
- food production
- feed slime
- poke slime
- soft-delete slime
- friends
- friend yard viewing
- timers
- offline sync endpoint

## 2. Data Model Contract

File: `Guidelines/contracts/data-model.md`

Covers:
- user shape
- slime shape
- food factory stock shape
- friendship shape
- interaction log shape
- sync action shape
- frontend camelCase and database snake_case naming rules
- enum values
- timestamp format

## 3. Error Contract

File: `Guidelines/contracts/errors.md`

Covers:
- standard error response format
- HTTP status mapping
- rule error codes
- validation errors
- auth errors
- rate limit errors
- offline sync rejection errors

## 4. Realtime Contract

File: `Guidelines/contracts/realtime.md`

Covers:
- WebSocket auth handshake
- subscribe and unsubscribe events
- friend online/offline events
- domain update events
- slime created/updated/deleted events
- food updated events
- interaction created events
- reconnect behavior
- event payload shapes

## 5. Cron And Timer Contract

File: `Guidelines/contracts/cron-and-timers.md`

Covers:
- daily summon reset
- food production availability
- timezone policy
- request-time reset rules
- background cron jobs
- idempotency rules
- frontend timer behavior
- offline reopen behavior

## 6. Rate Limiting Contract

File: `Guidelines/contracts/rate-limiting.md`

Covers:
- global per-IP limits
- auth limits
- summon/feed/produce/poke limits
- friendship request limits
- sync endpoint limits
- WebSocket event limits
- `429` response shape

## 7. Offline Sync Contract

File: `Guidelines/contracts/offline-sync.md`

Covers:
- IndexedDB as offline cache
- pending action queue format
- supported queued actions
- conflict handling
- server reconciliation
- accepted/rejected sync result shapes
- retry rules
- client-generated IDs

## 8. Security And Auth Contract

File: `Guidelines/contracts/security-auth.md`

Covers:
- JWT access token behavior
- refresh token behavior
- password hashing expectations
- protected route rules
- CORS expectations
- token storage recommendation for frontend
- logout behavior
- account soft delete, if needed later

## 9. Backend Implementation Expectations

File: `Guidelines/contracts/backend-implementation.md`

Covers:
- expected backend stack
- Express app structure suggestion
- middleware list
- PostgreSQL expectations
- transaction requirements
- backend rule validation ownership
- deployment environment variables
- health check endpoint

## Recommended Order

Start with:

1. Friend Yard Mechanics
2. REST API Contract
3. Data Model Contract
4. Error Contract

Friend yard mechanics should be clear first because they affect REST endpoints, realtime events, permissions, notifications, and offline sync. After that, REST API, data model, and errors are the base contracts. Then define realtime, cron/timers, rate limiting, offline sync, security/auth, and implementation expectations.
