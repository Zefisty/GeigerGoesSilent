# Geiger Goes Silent — indexing and social metadata

SEO brand: **Geiger Goes Silent by Zefisty**.

## Deployment status

Repository rename: active. GitHub returned 404 for the expected repository on 2026-10-15; the current repository name was confirmed through the integration. The repository rename was subsequently verified; these URLs now use the destination:

- Current repository: https://github.com/Zefisty/GeigerGoesSilent
- Current canonical: https://zefisty.github.io/GeigerGoesSilent/
- Current sitemap: https://zefisty.github.io/GeigerGoesSilent/sitemap.xml

Prepared destination:

- Expected repository: https://github.com/Zefisty/GeigerGoesSilent
- Expected Pages/canonical: https://zefisty.github.io/GeigerGoesSilent/
- Expected sitemap: https://zefisty.github.io/GeigerGoesSilent/sitemap.xml

`deployment.json` records the current and expected endpoints. Run `node tools/finalize-repository-rename.cjs --apply` after renaming the GitHub repository. It verifies the expected repository's stable ID, changes active deployment references and origin, and never commits or pushes. Running without --apply is read-only.

## Public metadata

The title, description, application labels, Open Graph, Twitter, JSON-LD and visible H1 identify Geiger Goes Silent by Zefisty. The Russian introduction matches the game UI. The existing square green radiation asset is retained for social previews; no reviews, price or publication dates are invented.

Manifest id/start_url/scope remain relative `./`. Scripts, CSS, icons and artwork remain relative and work under either deployment prefix. No backend or external runtime service was added.

## Indexing after deployment

The project robots.txt is below the project prefix. Host-wide robots policy belongs to https://zefisty.github.io/robots.txt and is outside this repository. After publication, inspect the canonical, sitemap, social image and host-root policy, and submit the current sitemap in the appropriate Search Console property. Metadata does not guarantee indexing or cache refresh timing.

Official reference: https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec

## Compatibility

Public labels change; established window.ZoneRPG* APIs, zonerpg storage keys, save schema and migrations stay compatible. Runtime icon bytes and gameplay remain unchanged. Browser and automated QA results are recorded in GEIGER_REBRAND_AUDIT.md.
