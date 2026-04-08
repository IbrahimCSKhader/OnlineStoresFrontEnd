# Frontend Cart And Order Rules

## Core Principle

- The app is multi-store.
- The cart is store-scoped, not global.
- The current cart always means: the current `StoreCustomer` inside the current `StoreId`.

## Cart

- Use `GET /api/Cart/{storeId}` to fetch the current cart.
- The route parameter is `storeId`, not `cartId`.
- Never use `cart.id` in the cart fetch URL.
- `CartDto.id` is only the cart identifier in the response model.
- Add items with `POST /api/Cart/add` and body:

```json
{
  "productId": "GUID",
  "variantId": null,
  "quantity": 1,
  "storeId": "GUID"
}
```

- Update items with `PUT /api/Cart/item/{cartItemId}`.
- Remove items with `DELETE /api/Cart/item/{cartItemId}`.
- Clear the cart with `DELETE /api/Cart/clear/{storeId}`.

## Orders

- Create orders with `POST /api/Order`.
- Do not send `cartId`.
- The order is created from the current store-scoped cart.
- The request body must be:

```json
{
  "storeId": "GUID",
  "couponCode": "optional",
  "customerNotes": "optional",
  "deliveryAddress": "required",
  "deliveryCity": "required",
  "deliveryPhone": "required"
}
```

## Auth Expectations

- Cart and order endpoints require a Bearer token for `StoreCustomer`.
- `storeId` in the route or request body must match `store_id` inside the token.
- Expect `401` when the token is missing or invalid.
- Expect `403` when the token store does not match the requested store.

## Debug Checklist

1. Did we send the correct `storeId` for the current store?
2. Did we accidentally use `cartId` where `storeId` is required?
3. Is the token a valid `StoreCustomer` token?
4. Does the token `store_id` match the request `storeId`?
5. Are delivery fields complete when creating the order?
