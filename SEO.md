# Last Cordon — indexing and social metadata

Canonical public homepage: https://zefisty.github.io/LastCordon/

## Included in this patch

- Russian title/description identifying **Last Cordon by Zefisty**.
- Explicit `index, follow`, canonical URL and sitemap link.
- Open Graph and Twitter metadata using the existing 512×512 green radiation
  icon. Twitter uses `summary`, matching the square artwork; no new image.
- Minimal schema.org `VideoGame` JSON-LD, without invented reviews, prices or dates.
- Readable ordinary HTML introduction and a single H1 before JavaScript runs.
  The normal JS start menu retains the same introduction, rather than serving
  search-only hidden text. Its actions and in-game branding are unchanged.
- `robots.txt` allowing crawling and `sitemap.xml` containing only the homepage.

## GitHub Pages root-host limitation

This project publishes under `/LastCordon/`. Its robots file therefore appears at
https://zefisty.github.io/LastCordon/robots.txt. Google reads robots rules from the
host root, https://zefisty.github.io/robots.txt, not a project subdirectory.
The project file alone cannot control the host-wide policy or guarantee that
Google discovers its Sitemap directive.

After publishing, submit https://zefisty.github.io/LastCordon/sitemap.xml in the
verified Search Console URL-prefix property for this project. If you also
manage the root `zefisty.github.io` repository/site, add the same Sitemap line
to its root robots.txt and verify that it does not block `/LastCordon/` or assets.
No changes to that other repository or Search Console were made here.

Official reference:
https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec

## Deployment verification

This patch remains local and uncommitted. After the user publishes it, verify
the homepage, sitemap, host-root robots policy and social image return usable
responses at their public URLs. Then use Search Console URL inspection and
sitemap submission. Metadata makes the content understandable; it does not
guarantee indexing, rankings, the chosen search snippet or refresh timing of
third-party link-preview caches.

Public homepage/root-robots reads were attempted during implementation, but
the web tool could not access them. Their current remote status is unverified.
Local checks validate files, metadata, JSON-LD and unchanged PWA/game paths.
XML and HTML parsing are checked separately. No PWA strategy, manifest, icon
files, saves, game mechanics or navigation architecture changed.

## Validation results

498 PASS across 35 suites, including 7 SEO checks. All 66 JS/CJS files passed node --check. HTML tag nesting, sitemap XML and JSON-LD JSON parsed successfully; git diff --check passed. No commit or push was performed.


## Public brand and search intent

Last Cordon by Zefisty is a free browser survival RPG set in an anomalous exclusion zone. Its expeditions, factions, artifacts and living-world encounters provide a stalker-like browser RPG experience. Public branding uses Last Cordon; the repository and deployment path now use LastCordon; JavaScript APIs and storage identifiers deliberately retain their compatible technical names.
