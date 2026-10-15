> Historical snapshot of the rebrand before repository/root rename. Deployment and root migration are now complete; see POST_REBRAND_AUDIT.md for the current audit.

# Geiger Goes Silent — rebrand audit

## Status

Local branding and artifact migration implemented; repository URL and root-folder migration remain pending. No commit/push performed.

GitHub integration on 2026-10-15 confirmed repository ID 1404247760 under its current name. The requested destination returned 404. origin was deliberately preserved. deployment.json records the current and expected endpoints. tools/finalize-repository-rename.cjs is read-only by default; --apply verifies exact GitHub full_name and stable ID before any URL/origin writes.

The open root directory was not moved to avoid invalidating the active session. After closing tools/servers, rename it manually to GeigerGoesSilent.

## Audit totals

194 original project occurrences classified individually before edits (81 A public, 3 B paths, 15 C URLs, 24 D history, 71 E tests). The full source audit is ../geiger-goes-silent-rebrand-before.json. 78 class-A public display strings were replaced, including configuration, HTML/metadata, documentation and accessible artwork titles.

Remaining implementation occurrences: 38, comprising 16 deferred live URL references (C) and 22 genuine historical/audit/cache-fixture references (D). No previous public display name remains in active UI, manifest or artwork. The inventories and this explanatory report quote old names as evidence and are excluded from recursive self-scanning.

Every remaining occurrence, context, category and reason (including 486 sibling historical snapshot occurrences) is recorded in ../geiger-goes-silent-rebrand-remaining.json. Source snapshots preserve original path/hash evidence; their filenames have been migrated.

## Renames

Tracked git mv: design/lastcordon-radiation-green.svg -> design/geiger-goes-silent-radiation-green.svg (visual/source bytes unchanged).

Sibling artifacts:
- `LastCordon-artifact-paths-audit.md` -> `GeigerGoesSilent-artifact-paths-audit.md`
- `LastCordon-artifact-paths-before.json` -> `GeigerGoesSilent-artifact-paths-before.json`
- `lastcordon-bugfix-qa.png` -> `geiger-goes-silent-bugfix-qa.png`
- `LastCordon-local-cleanup-audit.json` -> `GeigerGoesSilent-local-cleanup-audit.json`
- `LastCordon-local-cleanup-audit.md` -> `GeigerGoesSilent-local-cleanup-audit.md`
- `lastcordon-polish-backgrounds.png` -> `geiger-goes-silent-polish-backgrounds.png`
- `lastcordon-polish-human.png` -> `geiger-goes-silent-polish-human.png`
- `lastcordon-polish-map-mobile.png` -> `geiger-goes-silent-polish-map-mobile.png`
- `lastcordon-polish-profile.png` -> `geiger-goes-silent-polish-profile.png`
- `LastCordon-QA` -> `GeigerGoesSilent-QA`

Ten sibling artifacts renamed: nine files and one QA directory. Their screenshot/image bytes are unchanged. Historical Markdown filenames and real report-file references were updated; quoted original paths in audit snapshots remain history. The generic zone-navigation-server logs were left alone.

## Public identity and presentation

Display name: Geiger Goes Silent. Uppercase: GEIGER GOES SILENT. Developer: by Zefisty. Manifest name/short_name use the full name; id/start_url/scope remain ./; theme/colors/icons unchanged. Cache bumped once to v12-geiger-goes-silent; strategy/registration/precache paths unchanged. The brand type size/spacing was adjusted for the longer full name without abbreviating it.

51 SVG files changed only accessible title text; all other artwork geometry remains unchanged. The generator was run successfully with bundled Python/Pillow. Runtime PNGs, ICOs, the radiation master and original QA images remain byte-identical.

## Compatibility

Gameplay, save.js/state.js/schema/migrations, all legacy save/localStorage keys and established window.ZoneRPG* namespaces are preserved. Byte-for-byte and live save/load checks passed. No internal API was renamed.

## QA

All 38 Node suites were run. Initial run: 519 PASS and one failed suite (an old historical header matcher). The matcher was generalized without changing game code; rerun of that suite: 15 PASS, replacing its original 11 passing checks. Final aggregate: 523 PASS, 0 unresolved failures. Other suites were unaffected; the new migration guard suite was rerun after finalizer edits.

node --check: all 71 JS/CJS PASS. JSON: 5 files PASS. Sitemap XML and HTML nesting PASS. Working-tree and staged git diff --check PASS. Generator, radiation, PWA, SEO, branding, save compatibility and all 451 precache HTTP resources pass. 506 local references resolve; both current and expected deployment prefixes are covered.

Real in-app browser QA at local /GeigerGoesSilent/: title/start/new game, manual save/reload/load, PDA More, map, event images and combat fixture rendered. 1280/768/480/360 checked for menu/header/map/combat. No horizontal overflow or missing images; visible header telemetry does not overlap. On mobile telemetry is hidden by the unchanged existing layout rule. Console contained no errors/warnings. No production deployment, installed OS-icon refresh or live destination verification is claimed.

Screenshots: ../GeigerGoesSilent-QA/rebrand-desktop.jpg and rebrand-mobile.jpg.

## Remaining project occurrences

| File:line | Category | Context / reason |
| --- | --- | --- |
| BRANDING_AUDIT.md:3 | D | > Historical snapshot before the repository rename. Current deployment: https://zefisty.github.io/LastCordon/. See REPO_RENAME_AUDIT.md for the migration. — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| BRANDING_AUDIT.md:5 | D | # Last Cordon — public rebrand audit — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| BRANDING_AUDIT.md:34 | D | Only the worker cache-version string advances to v10-last-cordon; its scope, — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| deployment.json:4 | C | "repository": "Zefisty/LastCordon", — Deferred live repository URL: GitHub destination returned 404; safety rule retains working URL until verified rename |
| deployment.json:5 | C | "pages": "https://zefisty.github.io/LastCordon/" — Deferred live repository URL: GitHub destination returned 404; safety rule retains working URL until verified rename |
| index.html:16 | C | <link rel="canonical" href="https://zefisty.github.io/LastCordon/"> — Deferred live repository URL: GitHub destination returned 404; safety rule retains working URL until verified rename |
| index.html:17 | C | <link rel="sitemap" type="application/xml" href="https://zefisty.github.io/LastCordon/sitemap.xml"> — Deferred live repository URL: GitHub destination returned 404; safety rule retains working URL until verified rename |
| index.html:21 | C | <meta property="og:url" content="https://zefisty.github.io/LastCordon/"> — Deferred live repository URL: GitHub destination returned 404; safety rule retains working URL until verified rename |
| index.html:24 | C | <meta property="og:image" content="https://zefisty.github.io/LastCordon/assets/pwa/radiation-green-v2-512.png"> — Deferred live repository URL: GitHub destination returned 404; safety rule retains working URL until verified rename |
| index.html:32 | C | <meta name="twitter:image" content="https://zefisty.github.io/LastCordon/assets/pwa/radiation-green-v2-512.png"> — Deferred live repository URL: GitHub destination returned 404; safety rule retains working URL until verified rename |
| index.html:40 | C | "url": "https://zefisty.github.io/LastCordon/", — Deferred live repository URL: GitHub destination returned 404; safety rule retains working URL until verified rename |
| index.html:42 | C | "image": "https://zefisty.github.io/LastCordon/assets/pwa/radiation-green-v2-512.png", — Deferred live repository URL: GitHub destination returned 404; safety rule retains working URL until verified rename |
| README.md:5 | C | [Играть в Geiger Goes Silent](https://zefisty.github.io/LastCordon/) · [Репозиторий GitHub](https://github.com/Zefisty/LastCordon) — Deferred live repository URL: GitHub destination returned 404; safety rule retains working URL until verified rename |
| README.md:5 | C | [Играть в Geiger Goes Silent](https://zefisty.github.io/LastCordon/) · [Репозиторий GitHub](https://github.com/Zefisty/LastCordon) — Deferred live repository URL: GitHub destination returned 404; safety rule retains working URL until verified rename |
| REPO_RENAME_AUDIT.md:3 | D | # Last Cordon: repository rename migration — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| REPO_RENAME_AUDIT.md:7 | D | Public repository: https://github.com/Zefisty/LastCordon — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| REPO_RENAME_AUDIT.md:9 | D | Canonical/game URL: https://zefisty.github.io/LastCordon/ — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| REPO_RENAME_AUDIT.md:11 | D | Sitemap: https://zefisty.github.io/LastCordon/sitemap.xml — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| REPO_RENAME_AUDIT.md:23 | D | README now exposes the current repository and play links. SEO.md examples all use the current deployment. Local Git origin was updated to https://github.com/Zefisty/LastCordon.git without contacting or pushing to GitHub. — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| REPO_RENAME_AUDIT.md:27 | D | Manifest bytes unchanged: id, start_url, scope remain ./. Launch/scope resolve to /LastCordon/; existing relative icon URLs resolve below that prefix. There are no shortcuts to migrate. Icon bytes, registration, precache list and worker ... — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| REPO_RENAME_AUDIT.md:29 | D | Worker cache version bumped exactly once: v10-last-cordon -> v11-last-cordon-repo. Worker base/cache scope derive from its own URL. The new deployment caches resources under its own prefix and does not intercept or delete the previous de... — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| REPO_RENAME_AUDIT.md:29 | D | Worker cache version bumped exactly once: v10-last-cordon -> v11-last-cordon-repo. Worker base/cache scope derive from its own URL. The new deployment caches resources under its own prefix and does not intercept or delete the previous de... — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| REPO_RENAME_AUDIT.md:38 | D | - 506 local references resolve inside the project prefix; HTTP checks serve all 451 precache resources with matching bytes through /LastCordon/. — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| REPO_RENAME_AUDIT.md:39 | D | - Local test server supports node tests/server.cjs --base=/LastCordon/; root mode remains available. This is a QA fixture, not a production backend. — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| REPO_RENAME_AUDIT.md:41 | D | - Real in-app browser QA succeeded at http://127.0.0.1:41736/LastCordon/ after restarting the server with local network permission. Start menu, new game, character selection, rendered header icon and event artwork loaded. Browser fixture... — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| REPO_RENAME_AUDIT.md:41 | D | - Real in-app browser QA succeeded at http://127.0.0.1:41736/LastCordon/ after restarting the server with local network permission. Start menu, new game, character selection, rendered header icon and event artwork loaded. Browser fixture... — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| robots.txt:4 | C | Sitemap: https://zefisty.github.io/LastCordon/sitemap.xml — Deferred live repository URL: GitHub destination returned 404; safety rule retains working URL until verified rename |
| SEO.md:9 | C | - Current repository: https://github.com/Zefisty/LastCordon — Deferred live repository URL: GitHub destination returned 404; safety rule retains working URL until verified rename |
| SEO.md:10 | C | - Current canonical: https://zefisty.github.io/LastCordon/ — Deferred live repository URL: GitHub destination returned 404; safety rule retains working URL until verified rename |
| SEO.md:11 | C | - Current sitemap: https://zefisty.github.io/LastCordon/sitemap.xml — Deferred live repository URL: GitHub destination returned 404; safety rule retains working URL until verified rename |
| sitemap.xml:3 | C | <url><loc>https://zefisty.github.io/LastCordon/</loc></url> — Deferred live repository URL: GitHub destination returned 404; safety rule retains working URL until verified rename |
| tests/branding-references.tsv:13 | D | config.js	4	ZoneRPGConfig	B	Internal JS namespace/API or technical catalog object	  window.ZoneRPGConfig={version:'11.0',gameName:'Last Cordon',gameN — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| tests/branding-references.tsv:278 | D | tests/branding.cjs	10	ZoneRPG	B	Internal test fixture, compatibility assertion or historical QA record	"https:\/\/zefisty.github.io\/ZoneRPG\/"/);assert.doesNotMatch(html,/\/LastCordon\ — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| tests/branding-references.tsv:279 | D | tests/branding.cjs	14	ZoneRPGConfig	B	Internal JS namespace/API or technical catalog object	fresh());const c=r.ctx.window.ZoneRPGConfig;assert.equal(c.gameName,'Last Cordon');asser — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| tests/branding-references.tsv:470 | D | tests/ui-v11.cjs	196	ZONE RPG	B	Internal test fixture, compatibility assertion or historical QA record	e(/КПК · LAST CORDON/g,'КПК · ZONE RPG');assert.equal(publicBrand(html),publicBrand — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| tests/HEADER_LOGO_QA.md:3 | D | > Historical snapshot before the repository rename. Current deployment: https://zefisty.github.io/LastCordon/. See REPO_RENAME_AUDIT.md for the migration. — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| tests/pwa.cjs:59 | D | for(const version of ['v1','v2-radiation-icons','v3-green-radiation-icons','v4-green-radiation-final','v5-green-shortcut-icons','v6-header-radiation','v7-field-art','v8-pda-interface','v9-menu-polish','v10-last-cordon'])shared.set(prefix... — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |
| tests/PWA_QA.md:3 | D | > Historical snapshot before the repository rename. Current deployment: https://zefisty.github.io/LastCordon/. See REPO_RENAME_AUDIT.md for the migration. — Historical audit snapshot or obsolete cache-version fixture; not current public branding or an active local filename |

## Working-tree file list

```text
 M BRANDING_AUDIT.md
 M README.md
 M REPO_RENAME_AUDIT.md
 M SEO.md
 M assets/art/factions/bandits.svg
 M assets/art/factions/duty.svg
 M assets/art/factions/ecologists.svg
 M assets/art/factions/freedom.svg
 M assets/art/factions/loners.svg
 M assets/art/factions/mercs.svg
 M assets/art/factions/military.svg
 M assets/art/factions/monolith.svg
 M assets/art/factions/mutants.svg
 M assets/sprites/npc-v10-dron.svg
 M assets/sprites/npc-v10-grach.svg
 M assets/sprites/npc-v10-gromova.svg
 M assets/sprites/npc-v10-levin.svg
 M assets/sprites/npc-v10-motyl.svg
 M assets/sprites/npc-v10-orlov.svg
 M assets/sprites/npc-v10-personal_npc_hunter_1.svg
 M assets/sprites/npc-v10-personal_npc_hunter_2.svg
 M assets/sprites/npc-v10-personal_npc_hunter_3.svg
 M assets/sprites/npc-v10-personal_npc_medic_1.svg
 M assets/sprites/npc-v10-personal_npc_medic_2.svg
 M assets/sprites/npc-v10-personal_npc_medic_3.svg
 M assets/sprites/npc-v10-personal_npc_rookie_1.svg
 M assets/sprites/npc-v10-personal_npc_rookie_2.svg
 M assets/sprites/npc-v10-personal_npc_rookie_3.svg
 M assets/sprites/npc-v10-personal_npc_scavenger_1.svg
 M assets/sprites/npc-v10-personal_npc_scavenger_2.svg
 M assets/sprites/npc-v10-personal_npc_scavenger_3.svg
 M assets/sprites/npc-v10-personal_npc_soldier_1.svg
 M assets/sprites/npc-v10-personal_npc_soldier_2.svg
 M assets/sprites/npc-v10-personal_npc_soldier_3.svg
 M assets/sprites/npc-v10-personal_npc_technician_1.svg
 M assets/sprites/npc-v10-personal_npc_technician_2.svg
 M assets/sprites/npc-v10-personal_npc_technician_3.svg
 M assets/sprites/npc-v10-rada.svg
 M assets/sprites/npc-v10-reed.svg
 M assets/sprites/npc-v10-rivet.svg
 M assets/sprites/npc-v10-serov.svg
 M assets/sprites/npc-v10-veres.svg
 M assets/sprites/npc-v10-zhdan.svg
 M assets/sprites/scene-anomaly-field.svg
 M assets/sprites/scene-bunker.svg
 M assets/sprites/scene-checkpoint.svg
 M assets/sprites/scene-cnpp.svg
 M assets/sprites/scene-forest.svg
 M assets/sprites/scene-industrial.svg
 M assets/sprites/scene-laboratory.svg
 M assets/sprites/scene-sarcophagus.svg
 M assets/sprites/scene-swamp.svg
 M assets/sprites/scene-tunnel.svg
 M assets/sprites/scene-underground.svg
 M assets/sprites/scene-village.svg
 M config.js
R  design/lastcordon-radiation-green.svg -> design/geiger-goes-silent-radiation-green.svg
 M design/green-icon-assets.json
 M design/render-green-icons.py
 M index.html
 M manifest.webmanifest
 M service-worker.js
 M tests/HEADER_LOGO_QA.md
 M tests/PWA_QA.md
 M tests/V63_QA.md
 M tests/art-pack.cjs
 M tests/branding.cjs
 M tests/header-logo.cjs
 M tests/hotfix-v1024.cjs
 M tests/pwa.cjs
 M tests/radiation-icons.cjs
 M tests/repo-path.cjs
 M tests/seo.cjs
 M tests/server.cjs
 M tests/ui-v11.cjs
 M ui-v11.css
?? deployment.json
?? tests/geiger-branding.cjs
?? tools/finalize-repository-rename.cjs
?? GEIGER_REBRAND_AUDIT.md
```

Final project change count: 80 status entries (includes one source rename and this report). No commits or pushes.

## Manual completion

1. Rename the existing GitHub repository to the expected name.
2. Run node tools/finalize-repository-rename.cjs --apply; rerun all checks before publishing.
3. Close the active workspace/servers and manually rename the root directory to GeigerGoesSilent; reopen it.
4. Publish only after user review. Installation tied to an older Pages path may need reinstalling from the final URL.
