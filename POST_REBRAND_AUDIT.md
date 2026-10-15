# Geiger Goes Silent: final post-rebrand audit

## Result

Necessary UI fix implemented; production save code, gameplay, manifest, worker and assets were not changed. No commit/push.

## Title spacing

The original logo mixed an anonymous flex text item and a colored span. GEIGER-to-GOES used gap:8px; GOES-to-SILENT used a normal font space (15.95px at the measured desktop size). Words now share a .brand-words inline formatting context; flex gap only separates the unchanged radiation icon from that text container. One normal U+0020 space separates each word, with inherited font/letter-spacing and preserved two colors. No negative margin or artificial spacing.

Browser range measurements (CSS px):

| Width | First word gap | Second word gap | Result |
| --- | --- | --- | --- |
| 1280 | 15.9583 | 15.9479 | PASS |
| 768 | 13.1354 | 13.1146 | PASS |
| 480 | 9.1146 | 9.1146 | PASS |
| 360 | 9.2396 | 9.2188 | PASS |

Subpixel differences below 0.022px are glyph-boundary rounding. document scrollWidth never exceeded clientWidth.

## Branding / filenames

Fresh tracked-tree baseline: 76 previous-brand occurrences. No active runtime/public/path or accidental leftovers were found, so zero brand replacements were necessary. Current tree: 77 historical occurrences, including one explicit pre-rebrand fixture name added to start-flow tests. Every occurrence is category C (historical) under this audit taxonomy. No category A/B/E remains; technical ZoneRPG names are intentionally compatible, not branding errors.

Full file, line, exact context, category and reason for each remaining occurrence: ../geiger-goes-silent-post-rebrand-references.json. This report avoids duplicating that inventory. No tracked filename/directory or accessible sibling artifact name retains the previous brand. Generic zone-navigation-server logs stay untouched.

Historical files with occurrence counts:
- BRANDING_AUDIT.md: 3; intentional historical report, old cache fixture or pre-rebrand save fixture.
- GEIGER_REBRAND_AUDIT.md: 54; intentional historical report, old cache fixture or pre-rebrand save fixture.
- REPO_RENAME_AUDIT.md: 12; intentional historical report, old cache fixture or pre-rebrand save fixture.
- tests/HEADER_LOGO_QA.md: 1; intentional historical report, old cache fixture or pre-rebrand save fixture.
- tests/PWA_QA.md: 1; intentional historical report, old cache fixture or pre-rebrand save fixture.
- tests/branding-references.tsv: 4; intentional historical report, old cache fixture or pre-rebrand save fixture.
- tests/pwa.cjs: 1; intentional historical report, old cache fixture or pre-rebrand save fixture.
- tests/start-flow.cjs: 1; intentional historical report, old cache fixture or pre-rebrand save fixture.

Current public/config/manifest name: Geiger Goes Silent; logo: GEIGER GOES SILENT. GitHub integration confirms repository ID 1404247760 and Zefisty/GeigerGoesSilent. origin, deployment.json, canonical, Open Graph/Twitter image paths, JSON-LD, sitemap, robots, README and SEO use https://zefisty.github.io/GeigerGoesSilent/ or the corresponding repository URL. The root folder is GeigerGoesSilent. README completion guidance was updated; the earlier rebrand report is now explicitly marked historical.

## Save investigation

Storage implementation: localStorage only (save.js), not IndexedDB, cookies, service-worker CacheStorage or path-named files. Keys:

- zonerpg_manual_save: manual slot
- zonerpg_autosave: automatic slot
- zonerpg-pda-save: preserved legacy backup
- zonerpg_dual_save_initialized: one-time dual-slot migration marker

State schema VERSION=16, accepted legacy versions 2 through 15. Slot parsing accepts these versions, ignores empty/corrupt/unsupported-version data without deleting it, and exposes valid slots. The migration copies a valid legacy backup only once and leaves its original intact; the initialized marker intentionally prevents deleted slots from resurrecting. Production save/state source bytes match HEAD and were not edited.

The new non-destructive tests use commit 629c44f, before the current public-brand change, to create authentic manual/auto saves. Each passes detection, correct slot display, load, preservation of money/health/location/radiation/weapon magazine/inventory/equipment/quests, write, and load in a fresh simulated runtime using copied storage. Discovery/loading does not overwrite the initial slot. Schema and all keys remain identical. Existing tests cover manual/auto separation and older schema migration.

The user clarified that this is the same device and the address appeared unchanged. No code-level incompatibility was reproduced. The exact installed-browser profile/storage was not inspected; the precise cause of that instance is not established. Different browser/profile, private session, site-data deletion/eviction or unavailable/corrupt raw slot data remain possibilities, not findings. Changing only the display name does not select a different localStorage namespace. Even a project-path move on the same HTTPS origin does not itself select different storage. Never clear site data or reinstall again before preserving existing slot data.

## Manifest / PWA identity

Manifest bytes unchanged: id=./, start_url=./, scope=./. Launch and navigation scope resolve to https://zefisty.github.io/GeigerGoesSilent/. Per the W3C id algorithm, id is resolved against start_url ORIGIN, so the normative effective id is https://zefisty.github.io/, including under the prior project directory. This corrects a mistaken manifest-directory assumption in an earlier test; the manifest itself needed no change. Browser/platform handling of an already installed entry was not independently verified.

References: [Web Storage origin](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), [W3C manifest id processing](https://www.w3.org/TR/appmanifest/#id-member).

The scope-derived worker cache is zonerpg-%2FGeigerGoesSilent%2F-v12-geiger-goes-silent. Old caches are independent by scope; neither worker nor registration reads/removes localStorage. Registration, relative precache resources and strategy remain unchanged. Simulated offline install/launch and legacy/current scope isolation pass existing PWA tests. Actual OS-installed application launch/offline behavior was not claimed.

## Integrity / automated tests

All 422 runtime asset files unchanged. All 270 SVGs and sitemap XML parse; all 153 raster/ICO files verify with Pillow; five JSON files (including manifest) parse. HTML nesting validates. Existing HTTP/path checks resolve 506 local references and serve all 451 precache resources with matching bytes. Missing files: 0; broken references: 0; parsing errors: 0. Assets were not regenerated.

All 71 JS/CJS pass node --check; git diff --check passes. Complete Node run: 526 PASS, 0 FAIL, 38 suites, 240.8 seconds. No failed suite was skipped.

## Browser smoke test

Isolated HTTP origin 127.0.0.1:41873, /GeigerGoesSilent/ prefix; no production/installed save data accessed. Tested 1280/768/480/360: menu spacing, header, new game, manual save, refresh, manual load, autosave/manual picker, PDA, inventory, quests, map, event/location images and combat fixture. No horizontal overflow or broken displayed images. Captured console warnings/errors: none. HTTP resource suite confirms successful asset responses; no browser request error was observed. Browser API did not expose a complete DevTools network trace.

Screenshot: ../GeigerGoesSilent-QA/post-audit-title.jpg.

## Files changed

- ui.js: brand-word wrapper only
- ui-v11.css: normal inline word flow and two-color selectors
- tests/branding.cjs: title structure/spacing regression
- tests/start-flow.cjs: pre-rebrand manual/autosave refresh coverage
- tests/repo-path.cjs: correct spec-based manifest id resolution
- README.md: mark root/deployment migration completed
- GEIGER_REBRAND_AUDIT.md: mark previous audit historical
- POST_REBRAND_AUDIT.md: this report

## Recommended manual follow-up

Use the browser/profile that installed the app to inspect the four named localStorage entries without deleting or changing them, and preserve copies before any recovery attempt. If valid slots exist there but not in the installed window, compare the actual scheme/host/port, profile and app context. If absent, also inspect the original browser/profile and a legacy backup; do not replace saves with a new game while investigating. The browser/profile name and read-only slot presence are still needed to diagnose the reported installed-app case precisely.
