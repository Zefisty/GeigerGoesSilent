> Historical audit of an earlier release/name. Current brand: Geiger Goes Silent. See GEIGER_REBRAND_AUDIT.md for current migration status.

# Last Cordon: repository rename migration

## Scope

Public repository: https://github.com/Zefisty/LastCordon

Canonical/game URL: https://zefisty.github.io/LastCordon/

Sitemap: https://zefisty.github.io/LastCordon/sitemap.xml

Only deployment URLs, documentation, regression tests and one worker cache version changed. No gameplay, UI, save schema, migration code, internal namespace or storage key changed.

## Reference inventory

The initial tracked-tree scan found **68 non-overlapping occurrences** of the requested old URL/path patterns: **28 class A references replaced**, **40 class B references retained**. Full per-occurrence file, original line, text, classification and reason: [tests/repo-rename-references.json](tests/repo-rename-references.json).

Class A: current HTML/SEO URLs and test deployment bases/path expectations.

Class B: archived branding/QA reports, the prior reference-audit TSV, and a technical regex that rejects the old brand in SVG accessible titles. Historical reports now explicitly identify themselves as snapshots. They are not runtime configuration. The new inventory itself and new negative/legacy-scope tests intentionally retain old strings as evidence and compatibility fixtures.

README now exposes the current repository and play links. SEO.md examples all use the current deployment. Local Git origin was updated to https://github.com/Zefisty/LastCordon.git without contacting or pushing to GitHub.

## Manifest and offline behavior

Manifest bytes unchanged: `id`, `start_url`, `scope` remain `./`. Launch/scope resolve to `/LastCordon/`; existing relative icon URLs resolve below that prefix. There are no shortcuts to migrate. Icon bytes, registration, precache list and worker strategy remain unchanged.

Worker cache version bumped exactly once: `v10-last-cordon` -> `v11-last-cordon-repo`. Worker base/cache scope derive from its own URL. The new deployment caches resources under its own prefix and does not intercept or delete the previous deployment's independent scope. Automatic cleanup remains restricted to obsolete versions of the current scope. Existing installed applications tied to the previous URL may need reinstalling from the new URL; this patch does not remotely alter installed app metadata.

## Save compatibility

`save.js` and `state.js` are byte-for-byte unchanged from HEAD, including schema, migrations, `zonerpg_manual_save`, `zonerpg_autosave` and every legacy key. `window.ZoneRPG*` namespaces remain unchanged. Both deployment paths share the same origin, so repository path does not itself change localStorage identity. Existing branding/save regression suites exercise old payload loading.

## Verification

- Public canonical, Open Graph, JSON-LD, sitemap and robots use the new URL.
- 506 local references resolve inside the project prefix; HTTP checks serve all 451 precache resources with matching bytes through `/LastCordon/`.
- Local test server supports `node tests/server.cjs --base=/LastCordon/`; root mode remains available. This is a QA fixture, not a production backend.
- PWA tests cover new-scope offline HTML/JS/icons, failed installs, cache replacement, registration and old/new scope isolation.
- Real in-app browser QA succeeded at `http://127.0.0.1:41736/LastCordon/` after restarting the server with local network permission. Start menu, new game, character selection, rendered header icon and event artwork loaded. Browser fixture `/LastCordon/tests/browser.html?scenario=polish` also rendered; no console warnings/errors observed. CSS styling was visually verified. Initial pre-permission browser attempt timed out.
- Production GitHub Pages deployment and installation/OS shortcut refresh were not tested; no files were published.
- Final automated results: 513 PASS across 37 Node suites, zero failed suites; node --check PASS for all 69 JS/CJS files; JSON validation PASS for 4 files; sitemap XML and HTML nesting PASS; git diff --check PASS.

## Files

Production/deployment: `index.html`, `robots.txt`, `sitemap.xml`, `service-worker.js`.

Documentation: `README.md`, `SEO.md`, `BRANDING_AUDIT.md`, `tests/PWA_QA.md`, `tests/HEADER_LOGO_QA.md`, this report.

Checks/fixture: `tests/branding.cjs`, `tests/seo.cjs`, `tests/pwa.cjs`, `tests/server.cjs`, `tests/repo-path.cjs`, `tests/repo-rename-references.json`.

No commit or push performed.
