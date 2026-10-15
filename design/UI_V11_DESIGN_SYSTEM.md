# ZoneRPG v11 — Field terminal UI

## Integration

`ui-v11.css` loads after `style.css`. It is a presentation layer over the existing
renderers and action dispatch. Existing illustrations, character portraits,
enemy art, item icons and radiation branding remain the source artwork.
No external fonts, UI libraries or runtime dependencies were introduced.

## Tokens

| Role | Value |
| --- | --- |
| Background | `#0c130f` |
| Panel / raised / recessed | `#141e17` / `#1c2a1f` / `#0e1711` |
| Border / highlighted border | `#394c38` / `#596f4c` |
| Text / secondary text | `#e2e9d6` / `#a2ae98` |
| Primary accent | `#b6c783` |
| Success / warning / danger | `#a6cc9a` / `#d4b277` / `#e09b8c` |
| Information | `#9ebfc1` |

Spacing uses 4, 8, 12, 16, 24, 32 and 48 px tokens. Segoe UI/Tahoma is used
for readable body text; Consolas for compact telemetry. Heading sizes use
bounded responsive values. Thin stepped frames, inset edges and restrained
scanlines provide the PDA aesthetic without raster textures.

## Components

- Buttons share shape, spacing, focus outline and pressed feedback. Primary,
  danger, text, navigation and compact variants retain distinct emphasis.
  Pressing a control changes its surface, never its layout position.
- Disabled controls retain readable labels and use a muted hatched surface.
- Panels share borders, inset highlights and section dividers. Modal headers
  stay visible while their contents scroll.
- Item cards retain existing icons and add textual type/rarity badges.
- Event badges distinguish ordinary, dangerous, rare and story presentation.
  They are derived from existing event data and do not affect selection odds.
- Combat separates enemy identity/portrait, player telemetry, actions and log.
- Character equipment slots reuse existing item artwork.
- Map changes are decorative; graph geometry and route calculation are untouched.

## Glyphs

The 18 original 24×24 SVG glyphs live in `assets/ui/` and are reproducible with
`tools/build-ui-glyphs.py`: alert, back, check, coin, explore, fire, gear,
inventory, map, more, pause, person, quests, radio, reload, save, settings, shield.
CSS masks inherit the control foreground. Visible labels remain the accessible
action names; glyphs carry no separate game behavior.

## Responsive and accessibility rules

Breakpoints at 1000, 768, 600 and 479 px progressively stack panels and combat
content. At 360 px the six navigation actions use two rows of three; at 480 px
and above they use one row. Narrow shop controls keep quantity, price and buy
in a compact row. Long text can wrap; modals have bounded viewport height.

Keyboard focus is explicit. Close icons have an accessible name. Dialogs carry
their visible title as an accessible label. Reduced-motion and forced-colors
preferences have dedicated rules. Status and rarity use words as well as color.
Palette contrast checks cover six core text pairs, not a complete WCAG audit.

## Scope and maintenance

No new render loops, timers or state machines were added. `ui.js` changes are
render helpers, wrappers, badges and accessibility labels. Existing action
attributes and enabled/disabled conditions are protected by comparison tests.
PWA changes only precache the stylesheet/glyphs and advance the cache version.
The manifest, app icons, registration and caching strategy are unchanged.

Run `node tests/ui-v11.cjs` after changing the presentation layer. Its width
checks validate stylesheet contracts, not actual browser geometry. A real
browser review is still required before considering visual QA complete.
