> Historical snapshot before the repository rename. Current deployment: https://zefisty.github.io/LastCordon/. See REPO_RENAME_AUDIT.md for the migration.

# Last Cordon — public rebrand audit

## Public changes (A)

HTML title/description/app labels/H1, Open Graph, Twitter and VideoGame identity;
header and start menu; overlay captions and credits; manifest display names and
description; README and SEO introduction; 51 accessible SVG titles. SVG geometry
and all radiation icon files are unchanged. Public UI names use the existing
ZoneRPGConfig gameName/gameNameUpper fields.

## Remaining technical references (B)

The exhaustive repo-wide remaining-match list is
[tests/branding-references.tsv](tests/branding-references.tsv). Each row records
the file, line, token, classification, reason and context. Reproduce it with
`node tools/audit-branding.cjs`. The generated inventory and this explanation
are excluded from their own input to avoid recursive duplication.

Retained categories: window.ZoneRPG* APIs and catalog objects; source/test
identifiers and fixture titles; repository and deployment URL `/ZoneRPG/`;
internal console diagnostics; historical developer reports and tooling.
Historical reports describe earlier releases and do not set the current game
brand. Test HTML titles identify internal fixtures, not game screens.

Save keys `zonerpg_manual_save`, `zonerpg_autosave` and legacy keys, the save
schema and migration functions remain unchanged. No repository or path rename.

## Cache and compatibility

Only the worker cache-version string advances to `v10-last-cordon`; its scope,
prefix and caching strategy stay intact. Manifest id/start_url/scope and all
icon URLs/bytes are preserved. Updates still wait until active game windows
close. Installed app-name refresh timing is controlled by the browser/OS.

## QA scope

Automated checks render main screens and preserve controls, load old saves,
check manual/autosave isolation, compare SVG geometry and PNG hashes, and check
sizing contracts at 1280/768/480/360. These are not computed browser layouts.
The running local fixture could not open in the in-app browser at
`http://127.0.0.1:41736/tests/browser.html?scenario=polish`:
`ERR_CONNECTION_TIMED_OUT`. Actual visual/layout/Console checks remain unverified.
No commit or push was performed.

## Final validation

505 PASS across 36 suites, including the rerun of shortcut-icons.cjs (3 PASS). The first batch reported 504 PASS and stopped that suite at an assertion requiring the former manifest display name. Its assertion now permits only the requested public name/description fields while preserving install identity and icons. No failing check remains; the entire batch was not repeated. All 68 JS/CJS files passed node --check; git diff --check passed. Seven branding-specific checks passed.

519 retained-name matches were classified; none require manual review. Counts: 429 namespace/API objects, 55 test/fixture records, 15 repository/deployment paths, 10 historical developer/tooling records, 8 console diagnostics, 2 source comments.

## Complete changed/added file list

- `README.md`
- `SEO.md`
- `assets/art/factions/bandits.svg`
- `assets/art/factions/duty.svg`
- `assets/art/factions/ecologists.svg`
- `assets/art/factions/freedom.svg`
- `assets/art/factions/loners.svg`
- `assets/art/factions/mercs.svg`
- `assets/art/factions/military.svg`
- `assets/art/factions/monolith.svg`
- `assets/art/factions/mutants.svg`
- `assets/sprites/npc-v10-dron.svg`
- `assets/sprites/npc-v10-grach.svg`
- `assets/sprites/npc-v10-gromova.svg`
- `assets/sprites/npc-v10-levin.svg`
- `assets/sprites/npc-v10-motyl.svg`
- `assets/sprites/npc-v10-orlov.svg`
- `assets/sprites/npc-v10-personal_npc_hunter_1.svg`
- `assets/sprites/npc-v10-personal_npc_hunter_2.svg`
- `assets/sprites/npc-v10-personal_npc_hunter_3.svg`
- `assets/sprites/npc-v10-personal_npc_medic_1.svg`
- `assets/sprites/npc-v10-personal_npc_medic_2.svg`
- `assets/sprites/npc-v10-personal_npc_medic_3.svg`
- `assets/sprites/npc-v10-personal_npc_rookie_1.svg`
- `assets/sprites/npc-v10-personal_npc_rookie_2.svg`
- `assets/sprites/npc-v10-personal_npc_rookie_3.svg`
- `assets/sprites/npc-v10-personal_npc_scavenger_1.svg`
- `assets/sprites/npc-v10-personal_npc_scavenger_2.svg`
- `assets/sprites/npc-v10-personal_npc_scavenger_3.svg`
- `assets/sprites/npc-v10-personal_npc_soldier_1.svg`
- `assets/sprites/npc-v10-personal_npc_soldier_2.svg`
- `assets/sprites/npc-v10-personal_npc_soldier_3.svg`
- `assets/sprites/npc-v10-personal_npc_technician_1.svg`
- `assets/sprites/npc-v10-personal_npc_technician_2.svg`
- `assets/sprites/npc-v10-personal_npc_technician_3.svg`
- `assets/sprites/npc-v10-rada.svg`
- `assets/sprites/npc-v10-reed.svg`
- `assets/sprites/npc-v10-rivet.svg`
- `assets/sprites/npc-v10-serov.svg`
- `assets/sprites/npc-v10-veres.svg`
- `assets/sprites/npc-v10-zhdan.svg`
- `assets/sprites/scene-anomaly-field.svg`
- `assets/sprites/scene-bunker.svg`
- `assets/sprites/scene-checkpoint.svg`
- `assets/sprites/scene-cnpp.svg`
- `assets/sprites/scene-forest.svg`
- `assets/sprites/scene-industrial.svg`
- `assets/sprites/scene-laboratory.svg`
- `assets/sprites/scene-sarcophagus.svg`
- `assets/sprites/scene-swamp.svg`
- `assets/sprites/scene-tunnel.svg`
- `assets/sprites/scene-underground.svg`
- `assets/sprites/scene-village.svg`
- `config.js`
- `index.html`
- `manifest.webmanifest`
- `service-worker.js`
- `tests/art-pack.cjs`
- `tests/header-logo.cjs`
- `tests/hotfix-v1024.cjs`
- `tests/pwa.cjs`
- `tests/radiation-icons.cjs`
- `tests/seo.cjs`
- `tests/shortcut-icons.cjs`
- `tests/ui-v11.cjs`
- `ui-v11.css`
- `ui.js`
- `BRANDING_AUDIT.md`
- `tests/branding-references.tsv`
- `tests/branding.cjs`
- `tools/audit-branding.cjs`
