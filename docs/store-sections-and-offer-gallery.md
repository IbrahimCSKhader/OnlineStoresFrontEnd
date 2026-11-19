# Store sections and offer galleries

Owners manage the feature at `/owner/premium`; administrators use a store workspace's Premium tab. Images are uploaded before saving and the first image is the main image. Translated headings and badges support A/E/I. An optional title color overrides the theme. An existing bundle supplies the price, inventory, cart action and actual availability dates.

The backend exposes ownership-checked GET/PUT `/api/Store/{id}/sections-settings` and POST `images` under that route. Settings are persisted in the existing StoreAppearance JSON row, separately from theme overrides. Theme saves and resets preserve section settings. No schema migration is required. Deploy the backend before the frontend.

`showCover`, `showFeaturedProducts`, and `premiumEnabled` default to true. The featured toggle hides both the highlights carousel and the featured products section. Store-specific changes belong in persisted settings, never slug checks in React. Offer presentation images and translated titles are shared by the premium section, offer cards and detail page. Expired/future/sold-out premium bundles remain unavailable.

Validated uploads accept JPG/PNG/WebP up to 5 MB each, with up to 12 images per offer. Settings are limited by the existing 16,000-character JSON column; an oversized request returns an actionable error rather than a database failure.
