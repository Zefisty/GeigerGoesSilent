# ZoneRPG field art — direction and production prompt set

## Direction
Original post-Soviet exclusion-zone pixel art for the existing ZoneRPG PDA interface. Charcoal green shadows, desaturated olive/sage midtones, muted rust and small amber/cyan light accents. Detailed readable silhouettes and deliberate pixel clusters, no official franchise images, no outside image downloads or runtime API. Illustration and portrait atlases generated using the built-in image_gen tool, not CLI/API. Existing SVG application icon is unchanged.

## Production prompt set (normalized)
Each prompt requested a single regularly divided atlas with independent cells, no gutters/frames, no labels, text, logos or UI. Landscape atlases use a 4x4 grid and cinematic misty surroundings (3:2 whole atlas, 3:2 cells). Portrait/enemy atlases use a 4x4 square grid, head/shoulders or whole creature kept within cell with margins, matching low-resolution pixel-art treatment. The item atlas uses a strict 8x8 square grid, one centered distinct item per cell, dark green backgrounds and readable 32px silhouettes. All subject orders below are row-major and correspond to the original production prompts.

- Locations: abandoned village; cordon road; scrapyard with cranes; dark valley factory; agricultural research complex; military checkpoint; overgrown railway; red forest; flooded tunnel; underground lab; campfire/tent; anomalous field; ruined city; pumping station; reed swamp; reactor sarcophagus.
- Events: campfire conversation; stash under roots; medical crate; green anomaly; muddy mutant tracks; roadside ambush; narrow safe passage; destroyed camp; battlefield aftermath; wounded bandaged traveler; old radio; paper dossiers; artifact discovery; bunker trader; mechanic workshop; night signal at tower.
- Portraits: young hooded rookie; former soldier; goggled technician; fur-hooded hunter; beanie scavenger; field medic; older stout trader; grey-bearded mechanic; hooded veteran; ecological researcher; radio operator; masked stranger; armored defender; forest scout; field biologist; unique friendly three-legged pig Bandit with scarf.
- Enemies: feral dog; blind hound; boar; armored old boar; tentacled humanoid predator; crouching gas-mask mutant; psychic hermit; massive brute; ghostly anomalous dog; armored swamp leech; long-limbed forest lurker; electro-mutant; hooded bandit; soldier; mercenary; armored sentinel.
- Supplemental enemies/quest portraits: tunnel rat swarm; reed amphibian; quarry hound; ash walker; mirror-faced traveler; scarred elite boar; armored bandit; veteran gas-mask mutant; Gromova (female commander); Orlov (older military liaison); Motyl (courier); Rada (field medic); Zhdan (broker); Serov (cartographer); Dron (former guard); Veres (female radio engineer).
- Items: eight rows of eight category silhouettes and distinctive artifacts; exact ordered subject list is included below. Medical case, bandage, injector and pills must differ; water and food must differ; knife, pistol, rifle and shotgun must differ. Artifacts use separate forms and limited luminous accents. No product branding.

## Local processing
Only technical cell slicing, one-pixel divider trim, nearest-neighbor resizing and indexed PNG palette optimization. No generated source atlas is downloaded by the game. Final dimensions: scenes 384x256, portraits/enemies 160x160, items 64x64. 144 PNGs total, 3,360,693 bytes. Nine original editable SVG field patches add distinct faction symbols. No repeated PNG hashes. Large original atlases stay in Codex generated_images; final runtime files are all inside the repository.

Rebuild optimized assets using tools/build-art-pack.py and explicit --locations/--events/--portraits/--enemies/--items/--special source paths. This developer-only tool requires Pillow; the game requires no new package, build tool or backend. assets/art/catalog.json records source filenames/hashes, grid ordering, final dimensions, byte counts and hashes. Art paths and fallbacks are centralized in art.js; no save schema or entity ID changes.

## Source atlas provenance / row-major output names

### locations

Source: `exec-11850c23-9f61-4a4c-9fc4-56d09f0b7f12.png`

SHA-256: `495446eae409386a8209dd846e12e180944442e6333f08ceebdb23e2ac660d0a`

Grid: 4x4

village, cordon, scrapyard, dark-valley, agro, checkpoint, railway, red-forest, tunnel, laboratory, camp, anomaly, ruins, industrial, swamp, reactor

### events

Source: `exec-79c34066-4ac7-49ad-8caa-64a96d9aa740.png`

SHA-256: `afa0c4bcd3da2cfa39c9847a37649102e1f50106ad6c10ecc324b3f580caa5e0`

Grid: 4x4

campfire, stash, medical-crate, anomaly, tracks, ambush, passage, abandoned-camp, battlefield, wounded, radio, documents, artifact, trader, workshop, night-signal

### portraits

Source: `exec-2370cd18-d400-4ecd-bc86-6c0eafb30817.png`

SHA-256: `39d74e9ccfd21a2eb632d784ae1e57ccadc6314b9968c79cde81e2db5219d283`

Grid: 4x4

rookie, soldier, technician, hunter, scavenger, medic, trader, mechanic, veteran, researcher, radio, stranger, defender, scout, biologist, pig-bandit

### enemies

Source: `exec-7c1d8304-8a37-4984-a511-0c89c28333d9.png`

SHA-256: `580e3c2bbb6572b30cce806a54cddfd158c224edf34ee26e6d168a0f6a20774a`

Grid: 4x4

feral-dog, blind-hound, boar, alpha-boar, bloodsucker, snork, controller, giant, anomalous-dog, leech, lurker, electro-snork, bandit, soldier, merc, sentinel

### items

Source: `exec-875957fe-be99-4a47-9bad-74c55fb26f91.png`

SHA-256: `5736fd6a49d6d2dd4b8031109ab326f589477e0c7537c60ef33089840225f0ed`

Grid: 8x8

pistol, pistol-heavy, rifle, smg, sniper, shotgun, sawedoff, knife, armor-light, armor-vest, armor-suit, armor-exo, helmet, gas-mask, backpack, detector, medkit, bandage, antirad, pills, canned, ration, water, energy-drink, ammo-pistol, ammo-rifle, ammo-shells, mutant-parts, tools, parts, electronics, wires, artifact-medusa, artifact-stoneflower, artifact-spark, artifact-shell, artifact-nightstar, artifact-needle, artifact-moonlight, artifact-meatchunk, artifact-gravi, artifact-goldfish, artifact-flash, artifact-fireball, artifact-bubble, artifact-beads, artifact-battery, artifact-soul, quest-document, map, journal, rare-box, sample, valuables, detector-pro, military-pack, food, medical, artifact-rare, artifact-dark, radio, key, fuse, salvage

### special

Source: `exec-816a5b93-9027-4c57-8ff7-7fdd3f900584.png`

SHA-256: `868b1fc6e6ad5edebcd5a973cece0a9ff9c1656142929ffce97000ed424c53e0`

Grid: 4x4

rat-swarm, reed-crawler, quarry-dog, ash-walker, mirror-stalker, elite-boar, armored-bandit, snork-veteran, gromova, orlov, motyl, rada, zhdan, serov, dron, veres
