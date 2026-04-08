# Frontend StoreCustomer Auth Checklist

## Rule

- `AppUser` auth from `/api/auth` is not enough for cart and order.
- Cart and order must use a `StoreCustomer` token for the same store.

## Correct Store Login

1. Resolve the current `storeId`.
2. Login with:

```http
POST /api/store-customer-auth/store/{storeId}/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "12345678"
}
```

3. Store the returned `StoreCustomer` token.
4. Use that token for:
   - `GET /api/Cart/{storeId}`
   - `POST /api/Cart/add`
   - `POST /api/Order`

## Correct Google Flow For A Store

1. Start Google with:

```http
GET /api/auth/google?storeId={storeId}
```

2. After callback, keep the returned `AppUser` token only as a temporary step.
3. Call:

```http
POST /api/store-customer-auth/store/{storeId}/set-password-from-auth-user
Authorization: Bearer <app-user-token>
Content-Type: application/json

{
  "newPassword": "12345678",
  "confirmPassword": "12345678"
}
```

4. Then call:

```http
POST /api/store-customer-auth/store/{storeId}/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "12345678"
}
```

5. Replace the temporary flow with the returned `StoreCustomer` token.

## Cart And Order Rules

- Cart fetch route uses `storeId`, not `cartId`.
- Do not send `cartId` in order creation.
- Order creation depends on the current cart inside the same store.

## Error Checklist

1. Did we send the current `storeId`?
2. Did we accidentally use `cartId` instead of `storeId`?
3. Is the token a `StoreCustomer` token?
4. Does token `store_id` match request `storeId`?
5. Are delivery fields complete?
