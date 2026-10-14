# ZoneRPG — Field Art / visual polish

## Summary

Presentation-only expansion of the existing 1D/PDA game. No engine, economy, combat rules, entity IDs, travel graph, quests, saves, reputation or audio changes. Save schema stays unchanged. No commit, push or deployment.

## Asset packs

| Pack | Count | Runtime format |
|---|---:|---|
| Locations / biomes | 16 | PNG 384x256 |
| Event categories | 16 | PNG 384x256 |
| Origin / NPC portraits | 24 | PNG 160x160 |
| Enemy portraits | 24 | PNG 160x160 |
| Item / artifact icons | 64 | PNG 64x64 |
| Original faction patches | 9 | SVG 64x64 |

Total: 153 runtime artworks. The 144 PNGs occupy 3,360,693 bytes and have distinct hashes. Scenes/portraits use at most 112 colors; item icons at most 64. No source atlas is loaded by the game. All final assets are local. Metadata, dimensions, byte counts, source provenance and SHA-256 are in assets/art/catalog.json. Six original atlases were generated with the built-in image_gen tool, not CLI/API; faction SVGs are original editable designs. Prompt direction and ordered subjects: design/field-art-direction.md. Final optimized preview: design/field-art-preview.png. tools/build-art-pack.py only slices, trims divider pixels, resizes and optimizes palettes; Pillow is a developer-only dependency.

## UI integration

- art.js centralizes location, scene, event, role/named-NPC, origin, enemy, item and faction mapping. Every unknown entity has a suitable category fallback; arbitrary asset paths are not interpolated from state. It changes no game data.
- ui.js uses the resolver in location/event cards, combat, player profile, six origins, NPC/story portraits, inventory/shop icons, codex and factions. Trader panel has a compact portrait strip. All existing actions remain.
- Dynamic NPC scenes/story contacts retain portraits, including the unique three-legged pig. Combat identity stays canonical; boar, bloodsucker, dogs, rodents and human enemies have suitable art.
- zone-ui.js maps POI illustrations through the same resolver.
- style.css adds restrained image frames, spacing, larger readable portraits, rarity borders and desktop/mobile dimensions. Header/map/navigation controls and survival alerts are unchanged.
- index.html loads art.js before zone-ui.js/ui.js. No new runtime package, API, backend, timers or render loop.
- Precache adds art.js and the new art files; version advances to v7-field-art. Fetch/install/activation strategy and registration are unchanged. Manifest, favicon and app/ICO icons are unchanged. Full precache: 432 resources, approximately 4.37 MB, below a 5 MiB budget.

## Style notes

Muted olive/sage and charcoal shadows; amber camp/workshop lights; limited cyan anomaly accents. Distinct environmental silhouettes, character faces/clothes and enemy anatomies. Separate medical/food/water/weapon silhouettes; artifacts use distinct shapes and glows. No external franchise images. Old lightweight SVGs are retained for compatibility and diagnostic checks; new PNGs do not duplicate each other.

## Automated tests

Final full run: **453 PASS across 31 suites, zero failures**. Ten dedicated art groups cover all asset paths/hashes/dimensions, 29 location renders, every enemy identity/path, six origins/all NPC roles/pig, items/fallbacks, every event/stage, panel renders, nonmutation/save-load, boot/precache and the real index script chain including game.js with start/new-game click dispatch in a VM.

All **62 JS/CJS** pass node --check. Pillow decoded all 144 optimized PNGs; nine SVGs parsed as XML; index/browser/enemy/art-gallery HTML parsed; Python builder syntax parsed; git diff --check passed. Legacy SVG snapshot expectations were updated to PNG paths/content while keeping behavior assertions. Historical header comparison normalizes only the already-approved badge. Core gameplay/save/manifest/registration files are compared to HEAD and unchanged.

## Browser QA

The local HTTP server started on port 41736. Real in-app browser attempts at both http://127.0.0.1:41736/ and http://localhost:41736/ failed with ERR_CONNECTION_TIMED_OUT, including after network permission. No security workaround was attempted. Thus **new layouts and live browser console are not browser-verified**. Automated VM boot/render/navigation/playthrough and source-image inspection are not a browser playthrough. Public Pages remains the previously published build and cannot validate these unpushed changes.

For manual review: run node tests/server.cjs and inspect the game plus tests/art-gallery.html. Check menu, origins, location/event, inventory/shop/character, combat, save/reload and console at desktop and 320/390px. Existing tests/browser.html fixtures and tests/enemies.html were updated to load the new art resolver. Art gallery displays loaded/broken image counts.

## Remaining limitations

Biomes/event categories are shared masters, not unique illustrations for every event. Ordinary NPCs share role archetypes; key story portraits and six origins are distinct. Some rare enemy definitions share a suitable base portrait; major elite boars, armored bandits and veteran mutants have distinct art. These are static portraits rather than animated sprite sheets. Actual mobile layout, device PWA update and live console remain unverified.

## Exact working-tree file list

- `M` `index.html`
- `M` `pwa-assets.js`
- `M` `service-worker.js`
- `M` `style.css`
- `M` `tests/browser.html`
- `M` `tests/enemies.html`
- `M` `tests/hotfix-v1024.cjs`
- `M` `tests/pwa.cjs`
- `M` `tests/quality-v72.cjs`
- `M` `tests/regressions.cjs`
- `M` `tests/runtime.cjs`
- `M` `tests/stories.cjs`
- `M` `tests/ux-v102.cjs`
- `M` `ui.js`
- `M` `zone-ui.js`
- `??` `art.js`
- `??` `assets/art/catalog.json`
- `??` `assets/art/enemies/alpha-boar.png`
- `??` `assets/art/enemies/anomalous-dog.png`
- `??` `assets/art/enemies/armored-bandit.png`
- `??` `assets/art/enemies/ash-walker.png`
- `??` `assets/art/enemies/bandit.png`
- `??` `assets/art/enemies/blind-hound.png`
- `??` `assets/art/enemies/bloodsucker.png`
- `??` `assets/art/enemies/boar.png`
- `??` `assets/art/enemies/controller.png`
- `??` `assets/art/enemies/electro-snork.png`
- `??` `assets/art/enemies/elite-boar.png`
- `??` `assets/art/enemies/feral-dog.png`
- `??` `assets/art/enemies/giant.png`
- `??` `assets/art/enemies/leech.png`
- `??` `assets/art/enemies/lurker.png`
- `??` `assets/art/enemies/merc.png`
- `??` `assets/art/enemies/mirror-stalker.png`
- `??` `assets/art/enemies/quarry-dog.png`
- `??` `assets/art/enemies/rat-swarm.png`
- `??` `assets/art/enemies/reed-crawler.png`
- `??` `assets/art/enemies/sentinel.png`
- `??` `assets/art/enemies/snork-veteran.png`
- `??` `assets/art/enemies/snork.png`
- `??` `assets/art/enemies/soldier.png`
- `??` `assets/art/events/abandoned-camp.png`
- `??` `assets/art/events/ambush.png`
- `??` `assets/art/events/anomaly.png`
- `??` `assets/art/events/artifact.png`
- `??` `assets/art/events/battlefield.png`
- `??` `assets/art/events/campfire.png`
- `??` `assets/art/events/documents.png`
- `??` `assets/art/events/medical-crate.png`
- `??` `assets/art/events/night-signal.png`
- `??` `assets/art/events/passage.png`
- `??` `assets/art/events/radio.png`
- `??` `assets/art/events/stash.png`
- `??` `assets/art/events/tracks.png`
- `??` `assets/art/events/trader.png`
- `??` `assets/art/events/workshop.png`
- `??` `assets/art/events/wounded.png`
- `??` `assets/art/factions/bandits.svg`
- `??` `assets/art/factions/duty.svg`
- `??` `assets/art/factions/ecologists.svg`
- `??` `assets/art/factions/freedom.svg`
- `??` `assets/art/factions/loners.svg`
- `??` `assets/art/factions/mercs.svg`
- `??` `assets/art/factions/military.svg`
- `??` `assets/art/factions/monolith.svg`
- `??` `assets/art/factions/mutants.svg`
- `??` `assets/art/items/ammo-pistol.png`
- `??` `assets/art/items/ammo-rifle.png`
- `??` `assets/art/items/ammo-shells.png`
- `??` `assets/art/items/antirad.png`
- `??` `assets/art/items/armor-exo.png`
- `??` `assets/art/items/armor-light.png`
- `??` `assets/art/items/armor-suit.png`
- `??` `assets/art/items/armor-vest.png`
- `??` `assets/art/items/artifact-battery.png`
- `??` `assets/art/items/artifact-beads.png`
- `??` `assets/art/items/artifact-bubble.png`
- `??` `assets/art/items/artifact-dark.png`
- `??` `assets/art/items/artifact-fireball.png`
- `??` `assets/art/items/artifact-flash.png`
- `??` `assets/art/items/artifact-goldfish.png`
- `??` `assets/art/items/artifact-gravi.png`
- `??` `assets/art/items/artifact-meatchunk.png`
- `??` `assets/art/items/artifact-medusa.png`
- `??` `assets/art/items/artifact-moonlight.png`
- `??` `assets/art/items/artifact-needle.png`
- `??` `assets/art/items/artifact-nightstar.png`
- `??` `assets/art/items/artifact-rare.png`
- `??` `assets/art/items/artifact-shell.png`
- `??` `assets/art/items/artifact-soul.png`
- `??` `assets/art/items/artifact-spark.png`
- `??` `assets/art/items/artifact-stoneflower.png`
- `??` `assets/art/items/backpack.png`
- `??` `assets/art/items/bandage.png`
- `??` `assets/art/items/canned.png`
- `??` `assets/art/items/detector-pro.png`
- `??` `assets/art/items/detector.png`
- `??` `assets/art/items/electronics.png`
- `??` `assets/art/items/energy-drink.png`
- `??` `assets/art/items/food.png`
- `??` `assets/art/items/fuse.png`
- `??` `assets/art/items/gas-mask.png`
- `??` `assets/art/items/helmet.png`
- `??` `assets/art/items/journal.png`
- `??` `assets/art/items/key.png`
- `??` `assets/art/items/knife.png`
- `??` `assets/art/items/map.png`
- `??` `assets/art/items/medical.png`
- `??` `assets/art/items/medkit.png`
- `??` `assets/art/items/military-pack.png`
- `??` `assets/art/items/mutant-parts.png`
- `??` `assets/art/items/parts.png`
- `??` `assets/art/items/pills.png`
- `??` `assets/art/items/pistol-heavy.png`
- `??` `assets/art/items/pistol.png`
- `??` `assets/art/items/quest-document.png`
- `??` `assets/art/items/radio.png`
- `??` `assets/art/items/rare-box.png`
- `??` `assets/art/items/ration.png`
- `??` `assets/art/items/rifle.png`
- `??` `assets/art/items/salvage.png`
- `??` `assets/art/items/sample.png`
- `??` `assets/art/items/sawedoff.png`
- `??` `assets/art/items/shotgun.png`
- `??` `assets/art/items/smg.png`
- `??` `assets/art/items/sniper.png`
- `??` `assets/art/items/tools.png`
- `??` `assets/art/items/valuables.png`
- `??` `assets/art/items/water.png`
- `??` `assets/art/items/wires.png`
- `??` `assets/art/locations/agro.png`
- `??` `assets/art/locations/anomaly.png`
- `??` `assets/art/locations/camp.png`
- `??` `assets/art/locations/checkpoint.png`
- `??` `assets/art/locations/cordon.png`
- `??` `assets/art/locations/dark-valley.png`
- `??` `assets/art/locations/industrial.png`
- `??` `assets/art/locations/laboratory.png`
- `??` `assets/art/locations/railway.png`
- `??` `assets/art/locations/reactor.png`
- `??` `assets/art/locations/red-forest.png`
- `??` `assets/art/locations/ruins.png`
- `??` `assets/art/locations/scrapyard.png`
- `??` `assets/art/locations/swamp.png`
- `??` `assets/art/locations/tunnel.png`
- `??` `assets/art/locations/village.png`
- `??` `assets/art/portraits/biologist.png`
- `??` `assets/art/portraits/defender.png`
- `??` `assets/art/portraits/dron.png`
- `??` `assets/art/portraits/gromova.png`
- `??` `assets/art/portraits/hunter.png`
- `??` `assets/art/portraits/mechanic.png`
- `??` `assets/art/portraits/medic.png`
- `??` `assets/art/portraits/motyl.png`
- `??` `assets/art/portraits/orlov.png`
- `??` `assets/art/portraits/pig-bandit.png`
- `??` `assets/art/portraits/rada.png`
- `??` `assets/art/portraits/radio.png`
- `??` `assets/art/portraits/researcher.png`
- `??` `assets/art/portraits/rookie.png`
- `??` `assets/art/portraits/scavenger.png`
- `??` `assets/art/portraits/scout.png`
- `??` `assets/art/portraits/serov.png`
- `??` `assets/art/portraits/soldier.png`
- `??` `assets/art/portraits/stranger.png`
- `??` `assets/art/portraits/technician.png`
- `??` `assets/art/portraits/trader.png`
- `??` `assets/art/portraits/veres.png`
- `??` `assets/art/portraits/veteran.png`
- `??` `assets/art/portraits/zhdan.png`
- `??` `design/field-art-direction.md`
- `??` `design/field-art-preview.png`
- `??` `tests/ART_POLISH_QA.md`
- `??` `tests/art-gallery.html`
- `??` `tests/art-pack.cjs`
- `??` `tools/build-art-pack.py`
