# ZoneRPG v11 — menu and character polish

## Scope

Presentation-only changes over v11. No game calculations, attribute-point
handling, save format, economy, combat, audio, map or world data changed.
No commit or push was performed.

## Menus

The shared overlay renderer now gives every window a consistent inner body.
Save picker, rest picker, pause, More, credits and delete confirmation use a
560px maximum width; settings uses 660px. Other content-heavy screens keep
their existing widths. Confirmation uses the shared overlay header as well.
Panels, fieldsets, headings and action groups use the existing spacing tokens.
Encyclopedia, statistics/achievements and the other overlays inherit the same
frame, header, section spacing and inner-body rules.

Save/rest cards have 12px separation and Back has a further 8px top margin.
Internal card text/button margins no longer accumulate inconsistently.
More still contains six buttons ending Save / Pause. Manual and autosave
behavior and all rest conditions are unchanged.

## Character

Attribute cells use a grid instead of wrapping flex rows. The old growing
label and inherited large details margins/padding no longer inflate them.
Cells are capped at 240px wide, with a 50px minimum height and 6px vertical
padding. They may grow for unusually long text rather than clip it.
The Plus control is 36×36px in both enabled and disabled states. It stays
visible when no points remain, and is disabled for a capped attribute.
Existing investAttribute actions and engine calculations are retained.

There are three columns on desktop, two at 768/480px, and one compact column
at 360px. Mastery, equipment, reputation and profile spacing is gently reduced.

## Cache

Only the service-worker cache version advances to `v9-menu-polish`, so the
already precached UI/CSS can update. Strategy, app icons, manifest and PWA
registration are unchanged. The PWA test includes cleanup of the v11 cache.

## QA

- 17 UI tests cover the original v11 contracts plus menu framing, save/rest
  spacing, bounded stat grids, square controls, zero-point/capped states and
  a real investment through the existing engine.
- Responsive stylesheet contracts cover 1280, 768, 480 and 360px. The 360px
  cell-width budget is checked; this is not computed browser layout testing.
- All 63 JS/CJS files pass `node --check`.
- `git diff --check` passes.
- Regression coverage: **470 PASS across 32 suites**, including the rerun of
  `hotfix-v1024.cjs` (15 PASS). The initial batch reported 469 PASS and one
  failed source-preservation assertion caused solely by LF/CRLF conversion
  in `ui.js`. Original LF endings were restored; that suite then passed.
  The complete batch was not run a second time. No failing check remains.

The local server started successfully on port 41736, but opening it in the
in-app browser failed with `ERR_CONNECTION_TIMED_OUT`. Actual visual layout,
overlaps, touch use and browser Console therefore remain unverified. The
automated render tests do not substitute for those manual checks.

## Files

- `ui.js`: shared overlay body/kind, common confirmation and Plus presentation.
- `ui-v11.css`: compact windows, consistent spacing and compact character grids.
- `service-worker.js`: cache-version string only.
- `tests/pwa.cjs`: expected cache version and old-v11 cache cleanup fixture.
- `tests/ui-v11.cjs`: five additional regression groups (17 total).
- `tests/UI_V11_POLISH_QA.md`: this report.
