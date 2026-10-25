# Store link previews on the existing Render Static Site

`npm run build` builds Vite and then fetches all public active stores from the
existing API. It writes the same React app shell with each store's name,
description, logo, canonical URL, and Open Graph/Twitter metadata already in the
HTML. No JavaScript execution is needed to read the preview. React assets,
routes, and the main Mawja homepage remain in place.

## Render settings

Keep the existing **Static Site**, build command `npm ci && npm run build`, and
publish directory `dist`. In **Redirects/Rewrites**, add these rules **before**
the existing SPA fallback. Use **Rewrite**, not Redirect:

| Source | Destination | Action |
| --- | --- | --- |
| `/market/:slug` | `/store-previews/:slug.html` | Rewrite |
| `/market/:slug/*` | `/store-previews/:slug.html` | Rewrite |
| `/*` | `/index.html` | Rewrite |

The generated directory index also provides a store-specific document for
`/market/<slug>/`. A nested product/category link deliberately uses its store's
preview and canonical store URL; this feature does not produce product cards.
The rules do not alter the visible URL or redirect visitors away from the SPA.

Environment settings (defaults match the current platform):

| Variable | Default |
| --- | --- |
| `VITE_API_BASE_URL` | `https://mawja.premiumasp.net` |
| `VITE_ASSET_BASE_URL` | same as the API base |
| `VITE_FRONTEND_BASE_URL` | `https://mawja.site` |

## Updates and limits

This is build-time generation. **After creating a store or changing its name,
description, logo, or active state, redeploy the static site.** There is no
runtime server, new paid service, API credential, or additional dependency.
If the API cannot be reached after two attempts, or returns no active stores,
the build fails instead of deploying generic or missing previews. Render keeps
the last successful deployment.

Logo URLs are absolute and public. If a store has no usable logo, its cover is
used; if both are missing, no share image is declared. Store content is escaped
before insertion in HTML. Store names and logos are never hardcoded.

## Dedicated custom-domain Static Site

If a store has its own Render Static Site, set `STOREFRONT_DOMAIN` on **that
service only** to its domain, for example `alakhwa.store`, then rebuild/deploy.
The build finds the unique active store assigned that `customDomain` in the
API and generates `dist/index.html` with its name, logo, description, and
`https://alakhwa.store/` canonical URL. The existing `/*` → `/index.html` Rewrite
also serves the correct store metadata for nested routes. React still resolves
the store from the visitor's hostname as before.

Do not set `STOREFRONT_DOMAIN` on the shared Mawja Static Site. Without it, the
platform homepage stays unchanged. A single static service serving several
domains cannot vary its root HTML by hostname; those domains need separate
publishes or a server/edge proxy. A separate domain registrar does not imply a
separate Render service. The build fails if the configured domain is invalid,
unassigned, inactive, or assigned to more than one active store.

After deployment, inspect the raw source for two different store links: each
must contain its own `og:title` and `og:image`, and still reference Vite's JS/CSS.
Existing social previews can remain cached by Meta. Use the official Sharing
Debugger to request a fresh scrape where supported, and test a new share.

References: [Render rewrite rules](https://render.com/docs/redirects-rewrites),
[Render static deployments](https://render.com/docs/static-sites),
[Open Graph](https://ogp.me/).
