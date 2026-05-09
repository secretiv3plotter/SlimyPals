# Friend Yard Mechanics

This document defines how a user views and interacts with friends' yards. These rules should guide frontend behavior, backend API contracts, realtime events, permissions, and notifications.

## Yard Placement

When the main user and one or more friends are online, each online friend's yard can appear adjacent to the main user's yard on the shared map.

Allowed friend yard positions:
- above the main user's yard
- below the main user's yard
- left of the main user's yard
- right of the main user's yard

Only the friend's yard is visible.

Friend yard view excludes:
- friend's summoning ground
- friend's food factory

Friend yard view includes:
- friend's active slimes
- enough yard/fence/map tiles to understand the yard boundary

## Map Navigation

The user can drag/pan the map to see online friends' yards in real time.

Friend yards should feel like they exist in the same world space as the main user's yard, not as separate menu screens.

## Realtime Requirement

Friend yards are visible only when the friend is online.

Realtime updates should reflect:
- friend comes online
- friend goes offline
- friend slime is summoned
- friend slime is fed
- friend slime is poked
- friend slime is deleted by its owner
- friend slime level changes

If a friend goes offline, their yard should be removed or hidden from the map.

## Feeding Friend Slimes

The main user can feed a friend's slime by dragging food from the main user's food icon to the friend's slime.

Important ownership rule:
- the feeding user spends their own food
- the target friend's slime receives the feed

The friend cannot use or see the main user's food factory directly. The main user also cannot use the friend's food factory.

Feeding rules still apply:
- target slime must be active
- target slime must not already be adult
- feeding user must have at least 1 food
- target slime feed cooldown must be open

Successful feed effects:
- feeding user's food quantity decreases by 1
- target slime level increases by 1, up to adult
- target slime `lastFedAt` updates
- interaction log is created
- notification is shown

## Poking Friend Slimes

The main user can poke a friend's slime.

Rules:
- friends can poke anytime
- poking does not require food
- poking does not change slime level
- poking creates an interaction log
- poking should trigger the slime's local visual reaction, such as jump/bounce
- notification is shown

## Friend Slime Level Visibility

The user can see a friend's slime level only when the slime is tapped or poked.

Default friend-yard view should not permanently show friend slime levels.

When tapped/poked:
- show the friend's slime level display
- keep it visible briefly, using the same 5-second style as own slimes if practical

## Forbidden Friend Actions

A user cannot:
- delete another user's slime
- summon slimes in another user's yard
- use another user's summoning ground
- produce food from another user's food factory
- use another user's food stock

## Notifications

Interactions should show notifications.

Notification examples:
- `You fed FriendName's Level 2 slime.`
- `FriendName fed your slime.`
- `You poked FriendName's slime.`
- `FriendName poked your slime.`

Notifications should be backed by interaction logs so they can be shown again after refresh or reconnect.

## Backend Contract Impact

These mechanics require backend support for:
- online presence
- friend yard placement data
- realtime friend yard updates
- cross-user feed permission
- cross-user poke permission
- interaction logs
- notifications

Friend feed endpoint should distinguish:
- feeder user
- target slime owner
- target slime
- whose food stock is consumed

The backend must enforce that friends can feed and poke, but cannot delete, summon, or produce food in each other's yards.
