# ZoneRPG PWA wrapper

## Files
Only index.html is changed in the game. Added manifest.webmanifest, service-worker.js, pwa-register.js, pwa-assets.js, tests/pwa.cjs and six technical radiation-icon PNG variants under assets/pwa/ (192, 512, maskable 512, Apple 180, favicons 32/48), derived from the existing 1254px master. The local QA server adds manifest/PNG MIME types. Gameplay, CSS, menus, saves and schema are unchanged.

## Manifest and Pages
Name/short_name: ZoneRPG. id/start_url/scope: `./`. Display: standalone. Background #0e130f; theme #111713. All icon and shell paths are relative. At https://zefisty.github.io/ZoneRPG/ the scope resolves to /ZoneRPG/; localhost root also works. Registration resolves from its own script URL, not the domain root. No install button or in-game splash was added.

## Offline and cache policy
The shell list contains 276 local resources, approximately 1.94 MB before compression: HTML, CSS, all boot/data/content JS, manifest, app icons and the existing small SVGs. No tests, Git files, remote resources or optional large audio are precached. Music configuration currently has no audio files; procedural audio needs no network.

Install precaches the complete shell through Cache.addAll. Offline launch is available after this finishes successfully. HTML, JS, CSS and manifest are network-first with cached fallback. SVG/PNG resources are cache-first. Requests outside the whitelist, non-GET, external, unknown navigation and media ranges are untouched. Cache quota errors do not discard healthy online responses.

Cache version is the `CACHE_VERSION` constant in service-worker.js. Cache names include the app's path. Activation deletes only older caches with this exact app/path prefix, then claims clients. Updates use the browser's waiting lifecycle: no skipWaiting, automatic game reload or forced interruption. Close old game tabs/windows and reopen to activate a waiting update. Registration uses updateViaCache:none.

For each release, increment CACHE_VERSION. When adding/removing boot files or lightweight images, update pwa-assets.js as well. Keep large optional tracks out of precache. Existing images refresh with the new cache generation.

## Saves
No save functions, schema, keys or localStorage data were changed. The worker caches static resources only. Existing saves remain in the existing browser storage context; transfer across browsers, profiles or OS-isolated installed-app containers is not implemented or promised.

## Installability checks
Validated JSON, name, standalone mode, relative start/scope, real PNG dimensions and maskable safe zone. Apple standalone/title/status-bar metadata and apple-touch-icon are present. Viewport is not duplicated. Registration skips unsupported/insecure/file contexts and catches rejection without affecting boot. These are configuration/VM checks, not a browser installability audit.

## Automated tests
All 411 existing game checks passed. The latest PWA suite passed 12 groups: 423 checks combined across 27 suites. All 56 JS/CJS files passed node --check; manifest JSON parsed successfully and git diff --check passed.

12 dedicated PWA groups cover install, activate, offline root/index/script/image fetch, localhost and /ZoneRPG/ resolution, network freshness, quota errors, disabled CacheStorage, version replacement, unrelated cache preservation, failed update safety, ignored request types and registration failure. Existing gameplay/save/UI sources are compared byte-for-byte with HEAD. Actual PNG bytes and every precache path are validated.

## Browser QA / remaining checks
The local server started, but the in-app browser returned ERR_CONNECTION_TIMED_OUT for http://127.0.0.1:41736/index.html. No actual Chrome/Edge/Android/iOS installation, standalone window, browser offline relaunch, DevTools service-worker audit or shared-storage check was completed. These need a reachable browser/HTTPS deployment. No commit/push or publication was performed.

## References
Lifecycle/security/update behavior follows [MDN: Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers). Relative manifest resolution follows [MDN: start_url](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/start_url).

## Radiation icon hotfix
Source: assets/pwa/zonerpg-radiation-v1.png, RGB PNG 1254x1254, SHA-256 a89d772d1b92044762c95f424e65c12f82cc99ae709c087c8e2ab3b0d0e61529. Source bytes are unchanged. Pillow LANCZOS technical resize only produced radiation-192.png, radiation-512.png, radiation-apple-180.png and radiation-favicon-32/48.png. radiation-maskable-512.png uses the same source resized to 384px, centered with 64px opaque dark padding; yellow radiation pixels are verified inside the central 40% radius. No generation, redraw, color change or crop.

All five retired Z-icon files were removed. HTML favicon/shortcut/Apple links, manifest and precache point to radiation variants. Manifest fields other than icons are unchanged. Worker differs only in CACHE_VERSION: v2-radiation-icons. Registration and cache strategy are unchanged. A mention of the retired favicon in the historical V63_QA.md is documentation, not an active resource reference.

Hotfix QA: 7 icon groups + 12 PWA groups + 27 world-logic groups = 46 PASS; all 57 JS/CJS syntax checks, HTML parser, manifest JSON and git diff --check passed. PNGs and maskable image were visually inspected locally. No browser-tab favicon or installed OS icon was verified on a device. After deployment, an already installed app may retain its OS icon and require reinstalling; project assets cannot guarantee immediate OS refresh. See [Chrome manifest update behavior](https://web.dev/articles/manifest-updates). No commit/push.
