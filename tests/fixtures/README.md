# Stable test contracts

Tests read these files directly. They never generate expectations from Git HEAD
or overwrite these fixtures while running.

- `gameplay-contract.json`: the current reviewed 520dcb4 production contract:
  all 111 items (including the four named field items), weapon mechanics, all
  115 quests without display title/description, all 541 encounter IDs, locations,
  enemy types, factions, schema and storage keys. Item flavor and weapon trait
  prose are excluded because catalog tests validate their presentation separately.
  Comparing the full current set replaces the obsolete `HEAD item count + 4`
  and the asymmetric removal of six events from only one side of a comparison.
- `pwa-contract.json`: explicit manifest/install identity, registration source,
  complete precache source and worker strategy. Only the worker cache version
  declaration is normalized; its current concrete value is asserted separately.
- `legacy-v16-no-name.json`: authentic fresh schema-16 state from release
  `4fa56a8` (before player naming and the field journal). The fixture has no
  `playerName` or `fieldJournal`. Money is set to 9876, health to 63, and the
  first quest's search-attempt counter to 2 so tests can verify real progress
  survives load without rewriting the original manual slot.

An intentional change to a gameplay/PWA contract requires review of the specific
fixture diff. Do not blindly regenerate these files to make a failure pass.
Behavior tests additionally exercise reload, equipment, consumables, trade,
clock/survival, paid/free rest, combat and save/load; definition snapshots do not
replace those tests.

`repo-path.cjs` emits synthetic request objects to the **actual** listener of
`tests/server.cjs`, with an in-memory response sink. It does not bind a socket or
mock the routing/file-serving logic. Every precached resource is compared byte
for byte, and launch URLs, content types, cache headers, query strings, redirects,
404, malformed encoding and traversal rejection are asserted. Browser TCP/HTTP
transport is outside this deterministic test's scope.
