# Frontend StoreCustomer Architecture

- `StoreCustomer` is the primary customer identity inside a store.
- Regular storefront customer flows must rely on `/api/store-customer-auth`, not `/api/auth`.
- The frontend state for storefront work should be understood as:
  - `StoreCustomer`
  - `StoreId`
  - `StoreCustomer token`

## Required Rules

- Store cart and order requests must use `Authorization: Bearer <store-customer-token>`.
- `GET /api/Cart/{storeId}` accepts `storeId`, not `cartId`.
- `POST /api/Order` must send `storeId` and delivery fields only.
- Do not treat a storefront customer as a platform `User` from `/api/auth`.
- Google or social login is only a transitional step until the app obtains a `StoreCustomer token`.

## Frontend Surface

- `useAuth()` now exposes:
  - `storeCustomer`: registered customer inside the current store context
  - `storefrontCustomer`: any store-scoped customer session, including guest
  - `platformUser`: owner/super-admin style platform identity
- Storefront UI should prefer `storeCustomer` or `storefrontCustomer` instead of generic `user`.

## Error Checklist

- Is the current token a `StoreCustomer token`?
- Does the request use the correct `storeId`?
- Was `cartId` used by mistake instead of `storeId`?
- Is the customer signed in to the same store as the current page?
- Is the checkout payload complete?
