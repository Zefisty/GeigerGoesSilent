# Character rename: implementation and QA

## Existing default and state

Before this feature there was no player nickname field. The profile displayed rank/background, and the player portrait used the existing generic label «Сталкер» (combat image alt). That existing label is now DEFAULT_PLAYER_NAME, not a new lore nickname.

Optional save-owned root field: playerName. ZoneRPGState exposes validatePlayerName, getPlayerDisplayName and formatPlayerText. Fresh states initialize the default; sanitize accepts valid names and falls back for absent/invalid fields. Schema remains VERSION=16; all previous versions/migrations and all existing namespace names remain compatible.

## UI and persistence

Click the name at the top of Character profile. An inline input with the current name and ✓ replaces it; no new modal. ✓ and Enter confirm; Escape or an outside click cancel without a write. IME composition Enter does not submit. Invalid input leaves the editor open with a small status message. A reserved hint area keeps the name block at 71px both before/while editing at the measured mobile width.

The confirmation reuses the existing square control family (36×36px, radius 4px) and existing auto-save action/snapshot mechanism. Renaming writes the auto slot without replacing manual save. Manual save retains the name at the time it was written. Slot metadata reads each saved state's name; it does not use the currently loaded/global name.

Storage keys remain exactly zonerpg_manual_save, zonerpg_autosave, zonerpg-pda-save and zonerpg_dual_save_initialized. No new localStorage key, version bump, cache bump, PWA change or migration was added.

## Validation / safe text

Trim surrounding whitespace; reject empty/non-string/control-character values and more than 24 Unicode code points. Cyrillic, Latin, digits, spaces, hyphens, apostrophes and other printable Unicode are allowed. The input's 48 UTF-16-unit limit accommodates 24 supplementary Unicode characters; the shared validator enforces the actual 24-code-point maximum.

All displayed names and input value attributes use the existing HTML-escaping helper. Payloads including <test> and <img src=x onerror=1> render as text. The plain-text token helper uses a replacement callback so $& remains literal. Event body rendering escapes the interpolated result.

{playerName} is supported through the centralized helper and event UI. No existing production dialogue lines were rewritten. A test-only arrival event demonstrates changing greeting text immediately after a rename.

## Automated checks

Full Node run: 539 PASS, 0 FAIL, 39 suites, 215.6 seconds. The final optional hint and square-control adjustments were additionally checked with the player-name and v11 UI suites. Node --check: all 72 JS/CJS PASS. git diff --check PASS.

13 player-name groups cover default/reset, Unicode, validation, manual/auto independence, fresh-runtime load, authentic pre-feature save compatibility, malformed optional fields, ✓/Enter/Escape/outside/IME handling, unrelated gameplay state, XSS in profile/input/slots/events, interpolation, original storage keys/schema/PWA, and exact additive changes in state/save/engine source.

Older whole-file equality checks were scoped to unrelated modules because four core files intentionally gain this feature. New exact-delta assertions still verify that state helpers/optional fields, save metadata and rename action/autosave registration are the only changes in those three source modules. Existing action matrices exclude only the two new rename controls; all original actions remain compared. Save-card source comparison permits only the additional saved-name line.

## Real browser QA

Isolated HTTP origin 127.0.0.1:41879 under /GeigerGoesSilent/; production save data was not accessed. Tested 1280, 768, 480 and 360px. Input remains within profile; no horizontal overflow or overlap; ✓ is exactly 36×36 at all four widths. Confirmed Слава by checkmark, manual save, page reload, correct slot/name and manual load. Enter renamed to Минику; autosave picker shows Минику while manual remains Слава. Escape and outside click discard Не сохранять; whitespace-only input stays in editor with Введите имя. Browser token fixture changed Рад тебя видеть, Слава. to Рад тебя видеть, Минику. Captured warnings/errors: none.

Screenshot: ../GeigerGoesSilent-QA/player-name-inline-360.jpg.

## Exact modified/new file list

Production:
- state.js
- save.js
- engine.js
- game.js
- ui.js
- ui-v11.css

Existing tests/fixtures updated:
- tests/art-pack.cjs
- tests/branding.cjs
- tests/browser-fixture.js
- tests/geiger-branding.cjs
- tests/pwa.cjs
- tests/repo-path.cjs
- tests/seo.cjs
- tests/start-flow.cjs
- tests/ui-v11.cjs

New:
- tests/player-name.cjs
- PLAYER_NAME_QA.md

No commit or push performed. Assets, manifest, service worker, item definitions, world graph, quests and combat mechanics were not edited.
