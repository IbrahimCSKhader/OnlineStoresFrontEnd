# Storefront bundle offers

## Merchant workflow

Open `/owner/offers` from **عروضات المتجر** in the owner dashboard. Choose one or
more products, set each required quantity, enter one total package price, then
save. Existing packages can be edited, enabled, disabled or soft-deleted. Existing
subscription permissions still apply on the backend.

## Storefront

**عروضات المتجر** appears immediately after **مختارات المتجر**. Every offer card
shows all included product images/names and required quantities, the fixed price,
regular total when discounted, and an add-package button. The yellow hexagonal
badge has a red outline and red text; it shows savings on packages. Products that
belong to active packages carry the same badge in the carousel and product cards.
Catalogs show packages without purchase buttons; owner preview disables purchase.
Loading, empty, error and success states are translated into Arabic, English and
Hebrew. Merchant-authored names/descriptions retain the existing content policy.

## Cart and checkout

Registered shoppers use the atomic bundle API. Guest shoppers keep a package as
one local line, with all component details, until login. Guest-cart merge sends a
single package request and clears each successfully merged local package to avoid
replaying it after a later merge failure. Server validation controls actual
availability and pricing.

Server inventory-bearing component rows are grouped into one cart display line.
Quantity controls change the number of packages, and removal removes the whole
package. All components remain visible in the cart. Regular purchases of the same
product remain distinct. Order details show a package summary (name, number of
packages, exact price and components); order cards identify package-containing
orders. The backend retains historical snapshots after offer changes/deletion.

The default active variant of each product is selected when adding a package.
The backend API also supports explicit per-component variant selection.

## Verification

`npm test` covers all existing tests plus component image rendering, badges,
registered/guest purchase paths, catalog restrictions, owner editor payloads,
exact grouped totals, idempotent normalization and local quantity/removal.
`npm run build` produces the production bundle. The repository-wide lint currently
has existing errors in unrelated code and existing owner/router modules; new
package components and hooks pass targeted ESLint.

The backend must be deployed with the package snapshot migration before this
frontend. No production deploy is performed by this feature commit.
