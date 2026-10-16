# UI button consistency — QA

## Root cause and changes

The class cards already had equal row heights. However, the v11 generic button
rule (`#app :is(...) { margin:0 }`) overrode the older, less specific
`.background-card button { margin-top:auto }`. The soldier description occupied
less height, placing its button about 11.2 px above the neighboring button at
1280 px. There was no soldier-specific position override.

The scoped `#app .background-card>button` rule restores the flexible top margin.
Cards use a shared gap, uniform grid row heights, nonshrinking portraits/buttons,
and normal paragraph margins/minimum heights. All six origins have the same
card and button dimensions at each tested width. No offset hacks were added.

Removed the bottom-dock-only Explore highlight. It now inherits the same normal,
hover, active and disabled rules as its neighbors. The primary location Explore
keeps its existing light gradient. The disabled dock label uses the same local
Explore SVG instead of a separate text glyph; it remains disabled with the same
title and no enabled gameplay action.

Shared control gap/icon/height tokens cover sibling action groups. More has six
equal-height rows with a fixed icon column. Existing monochrome 24×24 SVGs are
reused for main-menu, load, settings, More, PDA, journal/archive, statistics,
faction and expedition navigation. Text and accessible action names remain.
No new image assets, external framework or precache entries were added.

## Regression coverage

`tests/button-consistency.cjs`: seven new render/style/resource checks. Existing
`tests/ui-v11.cjs` still compares action/data/disabled/label matrices; its label
normalizer strips only the old decorative leading `⌕` when comparing the old
renderer. The new check separately prohibits that glyph in the updated disabled
Explore button and requires the SVG hook.

Gameplay, storage, equipment, world, PWA configuration and cache strategy are
unchanged. `ui.js` changes only the disabled navigation button's presentation.

## Real browser QA

Local base path `/GeigerGoesSilent/`, real in-app browser:

- Main menu, all six origins, save picker, location/navigation, More, settings,
  inventory, quests, profile and PDA at 1280 / 768 / 480 / 360 px: 40 successful
  geometry checks. No page/panel horizontal overflow or overlap in tested button
  groups; no broken loaded images.
- Equal card heights and aligned action bottoms were measured for all six
  origins at all four widths. Buttons remained 44 px high.
- Computed bottom Explore background, border and text color match neighboring
  buttons; the upper primary Explore retains its light gradient.
- More displays an icon on every one of its six controls, including Pause.
- An isolated field event additionally verified disabled Explore with a visible
  SVG, and PDA with NEW markers at all four widths without overflow.
- Keyboard focus has a visible solid 2 px outline. Hover/pressed/disabled CSS
  contracts retain dimensions and prohibit layout transforms.
- Console: no errors/warnings, including no reported failed resource loads.
  Resource existence and precache membership are also checked by Node tests.

Proof screenshots and geometry output are in the neighboring
`GeigerGoesSilent-QA` folder: `buttons-origins-1280.jpg`,
`buttons-more-360.jpg`, `buttons-more-1280.jpg`, `buttons-responsive.json`.

## Validation

- Full Node suite: **602 PASS, 0 FAIL, 43 suites**.
- New button checks: **7 PASS**; existing v11 UI checks: **23 PASS**;
  navigation checks: **6 PASS**.
- `node --check`: **78 JS/CJS files, no syntax errors**.
- `git diff --check`: **PASS**.
- Files: `ui-v11.css`, `ui.js`, `tests/ui-v11.cjs`, new
  `tests/button-consistency.cjs`, and this report. No icon assets changed.
