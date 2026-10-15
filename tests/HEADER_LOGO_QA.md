> Historical audit of an earlier release/name. Current brand: Geiger Goes Silent. See GEIGER_REBRAND_AUDIT.md for current migration status.

> Historical snapshot before the repository rename. Current deployment: https://zefisty.github.io/LastCordon/. See REPO_RENAME_AUDIT.md for the migration.

# Header badge / public deployment audit

## Facts checked

Public https://zefisty.github.io/ZoneRPG/ was opened in a real browser on 2026-10-14. After starting a fresh game, DOM contained exactly one .topbar, one .brand-mark IMG, empty badge text and src ./assets/pwa/radiation-green-v2-favicon-48.png. Image loaded at its actual 48px resolution. Both brand/badge ::before and ::after had content none. At 1280px viewport, logo measured 29x29 and header 78px; at 320px, logo measured 25x25 and header 65px. Brand and logo stayed within the header, header stayed within viewport; screenshot showed the radiation mark.

Independent HTTPS requests with Cache-Control: no-cache and an audit query retrieved index.html, ui.js, style.css, service-worker.js and pwa-assets.js (HTTP 200). Every response matched the pre-patch working tree after newline normalization. Public worker was v5-green-shortcut-icons. Public ui.js already had the radiation IMG and no old text badge.

## Actual render path / historical origin

index.html loads ui.js once; game.js calls ZoneRPGUI.render(engine.getState()). render -> gameScreen(s) -> head(s) is the single game header path. Repository-wide scans of shipped JS/HTML/CSS covered literal Z text, brand/logo/header/badge strings, template/innerHTML render paths, CSS content and pseudo-elements. No duplicate or alternate Z implementation found. The actual old markup was <span class="brand-mark">Z</span> in ui.js head(s), confirmed in commit 5e764b4. Commit 8382154 replaced it with the current IMG and is already deployed. Thus the previous fix did remove the badge in the current public build; the user's previously open tab/cache is a possible explanation, not a confirmed device-level diagnosis.

## Narrow change

No UI, CSS, image, favicon, manifest, registration, gameplay or save changes were needed. Only production change is CACHE_VERSION v5-green-shortcut-icons -> v6-header-radiation. Strategy remains byte-identical otherwise: UI JS/CSS are already network-first with no-store and offline fallback. New worker install fetches current precache resources; activation deletes prior same-app/path caches. Existing running JS is not hot-replaced: after deployment, reload online, and close all existing game/PWA windows then reopen if worker is waiting. No forced reload or skipWaiting.

## Regression checks

Header suite: 5 PASS, covering final location, event, combat, death and PDA panel renders; only one image badge, exact brand text, no text/entity Z, one boot header implementation, CSS generated Z detection including escaped values, asset existence and unchanged desktop/mobile dimensions. PWA suite: 14 PASS, including deliberately stale ui.js/style.css replaced online, correct offline content and legacy cache removal. Navigation suite: 6 PASS. All 60 JS/CJS passed node --check; git diff --check passed. No commit/push/deployment.
