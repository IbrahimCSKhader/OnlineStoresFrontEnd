# Product quantities and mobile filters

ProductCard now displays minus, selected quantity and plus controls. The count
starts at zero, cannot go below zero or above the displayed variant's tracked
stock, and is independent for every card. Add is disabled until a quantity is
selected. While a request is pending, the card prevents duplicate submissions
and editing the count. A successful add resets the count to zero; a failed add
keeps the count and displays a translated retry message.

Store home, Products, Category and related-product grids pass the quantity and
return the existing cart mutation's promise, so reset waits for actual success.
Guest and signed-in carts retain the existing cart hook and stock validation.
Catalogs omit buying controls and merchant previews keep them disabled.
Product-details main quantity controls and bundle purchasing remain unchanged.

At 1199px or narrower, Products search and all existing filters move into a
drawer opened by **البحث والفلاتر**. It closes with its close button, Show results,
Escape or the backdrop. Parent-held filter values survive closing/reopening.
Desktop screens retain the existing sidebar. The drawer follows storefront
language direction; new text uses the existing Arabic/English/Hebrew dictionary.

Verification: component tests cover quantity submission, success/failure reset,
pending requests, stock limits, catalogs and previews; page tests cover home
and Products mutation payloads, desktop filters, mobile search persistence and
drawer dismissal. The full frontend suite and production build were run, plus
targeted ESLint. A browser check on a real store added two units and observed
the cart badge become 2 while the card reset to 0. At a 390px iframe viewport,
the mobile drawer opened, searching مارشميلو returned seven products, and closing
the drawer retained those filtered results. This is browser viewport testing,
not a physical Android device test.

No backend, database, authentication or PWA changes are required.
