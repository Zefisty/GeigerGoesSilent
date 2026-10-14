# ZoneRPG PWA / final green icon audit

## Audit before cleanup

The working tree was clean. Repository-wide searches covered HTML, manifests, JS/CSS, metadata, service worker/registration, precache, PNG/SVG/ICO assets, tests, documentation and asset builders. Found: 0 remaining Z icon files, 0 active Z references, 1 unused yellow master PNG and its obsolete prompt, 6 green unversioned PNGs and 13 active green references (4 HTML, 3 manifest, 6 precache). The letter Z in ui.js is in-game header text, not an app icon resource; UI stays unchanged as required. Historical V63_QA.md contains a retired filename as a past change log, not an active asset source.

## Sole master and reproducible output

Master: design/zonerpg-radiation-green.svg, unchanged. Background #0e130f; symbol #b6c783. design/render-green-icons.py now reads geometry and palette directly from this SVG rather than rewriting it from a second definition. Pillow is needed only at build time. Generated opaque RGB PNGs use 8x sampling and BOX reduction. All six new PNGs were verified byte-for-byte against their approved green predecessors. design/green-icon-assets.json records normalized master SHA-256, PNG SHA-256, dimensions and byte counts. No external resources or runtime image dependency.

## Current URLs

All files below are under ./assets/pwa/:

- radiation-green-v2-favicon-32.png: browser favicon 32x32
- radiation-green-v2-favicon-48.png: browser favicon 48x48 and shortcut icon
- radiation-green-v2-apple-180.png: Apple touch icon 180x180
- radiation-green-v2-192.png: manifest 192x192, image/png, purpose any
- radiation-green-v2-512.png: manifest 512x512, image/png, purpose any
- radiation-green-v2-maskable-512.png: manifest 512x512, image/png, purpose maskable

The 178px symbol radius fits inside the 204.8px maskable safe radius. Background is opaque and built into the PNG. Only these six files remain in assets/pwa/. The old yellow source/prompt and the six unversioned green derivatives were removed. No icon design changed.

## Cache and app identity

CACHE_VERSION is v4-green-radiation-final. All six versioned URLs are in pwa-assets.js. Installation precaches them; activate already deletes older caches with this exact app/path prefix, preserving other applications/scopes. Tests seed old Z cache data and legacy versions, then verify deletion, current icon bytes offline and exclusion of retired paths. Caching strategy, registration and waiting lifecycle stay unchanged. Close existing app windows/tabs and reopen to let a waiting worker activate. No forced reload, skipWaiting, OS hacks, storage deletion or UI controls.

Manifest id/start_url/scope remain ./; name, short_name, display and colors are unchanged. URLs work at GitHub Pages /ZoneRPG/ and localhost root. No second app identity was introduced. Fresh installations receive only the approved green manifest resources. Existing Edge metadata/Windows shortcuts/taskbar icons may refresh later or require app reinstallation if OS cache persists. Actual installed Edge/Windows icon refresh has not been verified; project configuration cannot guarantee OS refresh timing.

## Validation

PWA/icon suites include no-old-z-icons, actual PNG contents/hash/dimensions/opaque background, maskable safe zone, HTML/favicon/Apple, manifest metadata and precache path validation, old-cache removal, offline fetch and unchanged gameplay/UI/registration checks. Full local run: 434 PASS across 28 executable test suites, zero failures (runtime.cjs/server.cjs are helpers; audit-v72.cjs is a report generator). Dedicated icon/PWA checks: 23 PASS (7 radiation, 3 no-old-z-icons, 13 PWA). All 58 JS/CJS files passed syntax checking. All JS/CJS pass node --check; manifest JSON and HTML parse; git diff --check passes. No commit/push or deployment.

## Desktop shortcut ICO follow-up (current)

The previous patch had PNG links and valid PWA metadata but no real favicon.ico. Thus some legacy/shortcut paths could still depend on cached browser/bookmark icons; the exact OS/browser selection was not observed. This patch adds a real multi-image ICO derived exclusively from the approved green 512px PNG: 16, 24, 32, 48, 64, 128 and 256px. Files: favicon.ico and assets/pwa/radiation-green-v3-shortcut.ico (identical bytes). HTML rel=icon explicitly offers the versioned ICO and existing PNG 32/48; rel=shortcut icon now uses the ICO. Apple 180 and manifest entries are unchanged. No new icon design.

The renderer and hash audit include both ICO copies. The PWA folder now contains six approved PNGs plus the versioned ICO. CACHE_VERSION is v5-green-shortcut-icons; precache includes both ICO URLs. Activation removes older same-app caches through the unchanged strategy. Tests verify actual ICO headers, directory offsets, all decoded frame dimensions, green pixels/opaque background, hashes, all HTML resources, unchanged manifest and offline ICO bytes. no-old-z-icons now accepts the approved default ICO while continuing to reject retired icon assets.

Fresh shortcuts get only green resources exposed by the project after deployment. Existing browser/bookmark/OS shortcuts may still need recreation; actual Edge desktop/home-screen installation was not tested. On GitHub Pages, project fallback lives at /ZoneRPG/favicon.ico and explicit HTML links resolve under /ZoneRPG/. A browser request to the origin-level /favicon.ico is outside this repository's Pages scope and cannot be replaced by this project; explicit versioned links provide the correct project icon.

Current follow-up validation: 53 PASS across icon, no-old-z-icons, shortcut, PWA and world-logic suites. All 59 JS/CJS syntax checks, manifest JSON, HTML parsing, ICO validation and git diff --check passed. The 434/28 full-suite result above belongs to the preceding cleanup, not this follow-up. No gameplay/UI or save changes; no commit/push.
