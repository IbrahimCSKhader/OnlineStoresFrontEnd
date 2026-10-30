# Store shortcuts and installation

## Findings

The checked-in Vite frontend and its public directory contain no web app
manifest, service-worker registration, fetch handler, or PWA build plugin.
The live `/market/abu-al-adham-sweets/products` document returned HTTP 200 at
that URL during investigation, with no manifest link in its initial HTML.
React Router explicitly mounts `/market/:slug/products` under StoreLayout,
outside protected dashboard routes. Its custom-domain redirect removes the
`/market/:slug` prefix only on custom storefront domains. No current code
forces that Mawja store URL to `/`.

Therefore there was no store-specific installation contract in the current
application. An older WebAPK/shortcut with a root launch URL, cached older
deployment, browser-generated installation identity, or device link handling
can explain the reported launch. The affected Android device was not connected,
so its saved manifest, installed apps and link preferences could not be inspected;
the specific historical cause is not established.

## Implementation and deployment

Deploy the backend **first**, then this frontend. No migration, build-time store
list, service worker, hosting rewrite or new dependency is required.

`GET /api/store-install/{slug}/manifest.webmanifest?url=<encoded full launch URL>`
looks up the current active store and returns `application/manifest+json` with
`Cache-Control: no-store`. It validates the frontend origin with the existing
origin service and checks that a custom domain actually belongs to that store.
The manifest uses absolute URLs because the existing API is on another origin.
The existing CORS policy must permit the frontend origin; the link explicitly
uses anonymous CORS and needs no authentication or cookies.

`useStoreInstallManifest` attaches one manifest link from StoreLayout, updates
it on SPA navigation, and restores any pre-existing platform manifest on exit.
The manifest URL is durable HTTP(S), not a temporary blob/data URL. Store name
and logo come from existing store data, with the Mawja icon as fallback. The
logo must be publicly accessible; for good Android installation results use a
square raster logo at least 512px across. The manifest does not claim invented
192/512 dimensions for uploaded images. Browser install eligibility and UI vary
with browser version and actual logo suitability.

`start_url` is the selected public page, including supported query parameters
and fragment. `id` is that launch URL too: different stores **and different
pages of one store** have separate identities. This intentionally permits both
an About shortcut and a Products shortcut without a later manifest update
changing one into the other. Nested pages have `/market/{slug}/` scope;
the existing slashless store-root page requires `/market/{slug}` scope to
include its exact URL. Manifest scope is a URL prefix, so a slashless-root
installation can also match another slug beginning with the same text.
Prefer installing from `/market/{slug}/` or `/market/{slug}/products` for the
strict directory boundary. Changing store-root URL conventions is outside
this fix. Custom-domain stores have `/` scope on their own origin.

Public store root, products, about, contact, categories, product details, offers
and offer details are supported. Login, registration, profile, cart, checkout,
owner preview and URLs carrying unsupported query parameters do not advertise
a store installation. They retain normal routing. Supported query parameters
are `search`, `q`, `page`, `category`, `sort`, `language`, and `lang`.

The Mawja homepage, router, authentication and service workers are unchanged.
There was no regular Mawja manifest in this checkout to update or migrate.
No last-visited-store redirect is added: visiting `/` still means Mawja.
This change does not add offline browsing; cold launches need connectivity.

## Existing installations and caches

A website cannot rewrite an ordinary Android shortcut's saved target. Remove
and recreate affected store shortcuts after deploying both projects. If Android
offers **Open Mawja** instead of installing the store, open the link in a normal
browser tab; inspect Android Settings → Apps → Mawja → Open by default / supported
links. Temporarily disable supported-link handling or uninstall the old Mawja
WebAPK if it continues intercepting the store. Reinstall Mawja separately if
desired. Retest with an existing Mawja installation as well as without it.

`no-store` prevents HTTP reuse of these new manifest responses, but does not
erase an older WebAPK or force Chrome's manifest update schedule. Hard reload
the deployed page before recreating a shortcut. If DevTools shows an unexpected
old service worker, record its script/scope and inspect it before unregistering
it for this test. The application deliberately does not purge all origin caches
or unregister unknown workers, which could damage an existing installation.

## Verification

Automated checks cover exact manifest launch URLs across fresh calls, store/page
identity separation, allowed public routes, custom domains, rejected foreign
origins, inactive stores, private/preview URLs, SPA changes, StrictMode cleanup,
platform manifest restoration and existing store-preview generation.
They cannot simulate Android's launcher or WebAPK installation.

Local validation: all 217 frontend tests passed (40 files), including the new
shortcut tests and existing preview tests; all 15 new backend manifest cases
passed. Targeted frontend ESLint and the production build passed. The production
build successfully generated previews for 29 active stores. No deployment or
physical Android test was performed.

After deploying, use an Android tablet with internet access:

1. In **Chrome**, open `/market/<store-a>/products` directly in a normal tab.
   With USB remote debugging, inspect Application → Manifest: the linked API
   request must return JSON (200, CORS allowed), `start_url`/`id` must be the
   displayed URL, scope must end in `/market/<store-a>/`, and the logo must load.
   Check Application → Service Workers for any older controlling worker.
2. Use Add to Home screen → Create shortcut. Close all tabs and swipe the browser
   away. Tap the shortcut: it must show that store's products, not Mawja home.
3. Repeat using **Install app**, if offered. Close the app and browser completely,
   then launch the installed icon. Repeat after a device restart.
4. Repeat for a second store and a product-detail page; launch every saved icon
   after visiting the other stores. Each must retain its original destination.
5. Keep an existing Mawja installation and repeat. If the OS opens it, verify
   whether it receives the full store URL, and inspect supported-link settings.
   Repeat without that installation to isolate Android link interception.
6. Repeat steps 1–5 in **Samsung Internet**, including its Add page to/Home screen
   and installation options when available. Install UX can differ from Chrome.
7. Confirm `/` still shows Mawja, and test store login/logout, cart, checkout,
   back/forward navigation, a custom-domain store, and a normal Mawja shortcut.

References:
[Manifest URL/origin processing](https://www.w3.org/TR/appmanifest/),
[PWA identity](https://developer.chrome.com/docs/capabilities/pwa-manifest-id),
[Multiple PWAs and overlapping scopes](https://web.dev/articles/building-multiple-pwas-on-the-same-domain).
