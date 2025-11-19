**API Integration Guide**

This document describes the backend HTTP API endpoints and integration notes frontend engineers need to integrate the e-commerce features (products, cart, orders, coupons, wishlist, Instamojo payments) implemented in this repository.

**Base URL**: `/api/v1`

**Auth**
- All protected endpoints require authentication via JWT. Add the header:

  - `Authorization: Bearer <JWT_TOKEN>`

- The `protect` middleware will populate `req.user` with `{ id, email, name, isAdmin }`.

**Common Query / Response Patterns**
- Pagination: use `?page=<number>&limit=<number>`; responses include `count`, `total`, `currentPage`, `totalPages`.
- Search: use `?search=term` which performs a text search on name/description.
- Sorting: use `?sortBy=<field>&order=asc|desc` (default `createdAt` desc).
- Errors: API uses standard JSON error responses handled by `errorMiddleware`.

---

**Products**

- `GET /products`
  - Public listing (only active products).
  - Query params: `page`, `limit`, `search`, `category`, `material`, `metalType`, `tag`, `minPrice`, `maxPrice`, `inStock=true`, `sortBy`, `order`.
  - Response: `{ success, message, count, total, currentPage, totalPages, data: { products: [...] } }`.
  - Each product includes `outOfStock` boolean derived by backend.

- `GET /products/:id`
  - Public product detail (active only).

- Admin endpoints (require `isAdmin`):
  - `POST /admin/create-products` (multipart/form-data if uploading images) — create product.
  - `PATCH /admin/products/:id` — update product.
  - `PATCH /admin/products/:id/stock` — body: `{ stock: number }` or `{ delta: number }` to set/adjust stock.
  - `PATCH /admin/delete-products/:id` — soft delete (sets `isActive=false`).

Request/Response example (create product JSON body):

```json
{
  "name":"14k Gold Ring",
  "description":"Elegant ring with gemstone",
  "price":150.00,
  "currency":"USD",
  "sku":"RG-001",
  "category":"rings",
  "material":"gold",
  "metalType":"14k",
  "gemstones":["diamond"],
  "images":["https://.../img1.jpg"],
  "stock":10
}
```

---

**Cart**
- `POST /cart/add` (protected)
  - Body: `{ "productId": "<id>", "quantity": 2 }`
  - Adds to user's cart (creates cart if missing). Checks stock and prevents over-requesting.

- `GET /cart` (protected)
  - Returns cart items and `totalPrice`.

- `PATCH /cart/update` (protected)
  - Body: `{ "productId":"<id>", "quantity": <number> }` (set quantity; use 0 to remove)

- `DELETE /cart/remove/:productId` (protected)
  - Removes an item from cart.

- `DELETE /cart/clear` (protected)
  - Clears the cart.

Notes for frontend:
- Always present product `stock` and `outOfStock` to users. Disable checkout if any cart items are out of stock.
- On add/update, handle 400 responses that indicate `Requested quantity not available`.

---

**Orders & Checkout**

- `POST /orders/checkout` (protected)
  - Create order from cart and perform transaction-safe stock decrement.
  - Body (example):

```json
{
  "paymentMethod": "instamojo",
  "couponCode": "SPRING20",
  "redirectHost": "https://your-frontend.example.com"
}
```

  - Behavior:
    - Validates stock for every cart item inside a MongoDB transaction and decrements stock.
    - Applies coupon if provided (validated in transaction). Coupon discount and usage counters update inside the same transaction.
    - Creates `Order` with `meta` containing coupon info and, if payment requested, payment request metadata.
    - If `paymentMethod === "instamojo"`, server creates an Instamojo payment request after the DB transaction and returns payment info (the payment long URL) with the order. The order persists even if payment creation fails (client receives a warning in that case).

- Response: success returns `{ order, payment }` where `payment.payment_request.longurl` (or similar) is used to redirect the user to Instamojo's payment page.

- `GET /orders` (protected) — user order history.
- `GET /orders/:id` (protected) — order detail (users can access own orders; admins can access any).
- Admin: `PATCH /admin/orders/:id` to update `status` and `paymentStatus` (requires admin token).

Frontend checkout integration steps (Instamojo):
1. Create order via `POST /orders/checkout` with `paymentMethod: 'instamojo'` and your `redirectHost` (optional). Include `couponCode` if applicable.
2. Server returns `payment.payment_request.longurl` (if payment request created). Redirect the browser to that URL.
3. After payment, Instamojo will redirect the user to `redirect_url` and POST a webhook to your server (`/payments/webhook`).
4. The frontend can poll `GET /orders/:id` to detect `paymentStatus: 'paid'` or rely on server notifications or email.

Example checkout call (axios):

```js
const resp = await axios.post('/api/v1/orders/checkout', { paymentMethod: 'instamojo', couponCode: 'SPRING20' }, { headers: { Authorization: `Bearer ${token}` } });
if (resp.data.payment && resp.data.payment.longurl) {
  window.location.href = resp.data.payment.longurl; // redirect to Instamojo payment page
}
```

---

**Coupons**
- `POST /coupon/validate` (protected)
  - Body: `{ code: "SPRING20", subtotal: 120.0, items: [{ product: "<id>", category: "rings" }, ...] }`
  - Response: `{ coupon: { code, discount } }` on success.

- Admin endpoints:
  - `POST /admin/coupons` — create coupon.
  - `PATCH /admin/coupons/:id` — update.
  - `GET /admin/coupons` — list.

Coupon model notes for frontend:
- Coupons can be `percentage` or `fixed` and may include `minOrderAmount`, `maxDiscount`, `applicableProducts`, or `applicableCategories`.
- Frontend should call `POST /coupon/validate` before checkout to show the discount amount.

---

**Wishlist**
- `POST /wishlist/add` (protected) — add product to wishlist (`{ productId }`).
- `DELETE /wishlist/remove/:productId` (protected) — remove.
- `GET /wishlist` (protected) — list wishlist products.

---

**Payments (Instamojo)**

- Instamojo integration endpoints introduced:
  - `POST /orders/checkout` — if `paymentMethod: 'instamojo'`, server will create a payment request and return a payment object including `longurl`.
  - `POST /payments/webhook` — Instamojo webhook. Server verifies webhook HMAC signature using `INSTAMOJO_SALT` header; make sure webhook URL is public.
  - `GET /payments/confirm` — user redirect after payment — server tries to update order payment status.

Webhook verification notes:
- The server expects raw request body to compute HMAC using `INSTAMOJO_SALT` and compares against the `X-Instamojo-Signature` (or similar) header.
- For local testing, use `ngrok` or similar to expose your local server and configure that URL as the webhook in Instamojo dashboard.

Example: server returns payment `longurl` that the frontend opens in a new tab. After payment, redirect will return user to your frontend pages.

---

**Headers & Environment**
- Authentication: `Authorization: Bearer <JWT>` for protected endpoints.
- For file uploads (product images) use the `uploadImageToCloudinary` middleware — the admin route `POST /admin/create-courses` (note: products route `POST /admin/create-products`) accepts multipart form-data. Provide field name `images` for multiple files.
- Env variables used by payments:
  - `INSTAMOJO_API_KEY`
  - `INSTAMOJO_AUTH_TOKEN`
  - `INSTAMOJO_SALT` (used for webhook signature verification)
  - `INSTAMOJO_MODE` (`test` or `live`)

---

**Error handling & edge cases**
- Stock concurrency: checkout uses MongoDB transactions; ensure your database is configured for transactions (replica set).
- If payment creation fails after order creation, the order will remain in DB (server returns order with a warning). Frontend should handle this case and show appropriate UI (retry payment flow, manual payment link, contact support).
- Coupon validation should be performed both client-side (for quick feedback) and server-side (authoritative) prior to completing payment.

---

**Quick checklist for frontend implementer**
- [ ] Authenticate users and store JWT securely (httpOnly cookie or secure storage depending on your architecture).
- [ ] Implement product listing & detail UI using `/products` endpoints.
- [ ] Implement add-to-cart flows and show stock/outOfStock.
- [ ] Call `POST /coupon/validate` when users enter coupon codes and display discount.
- [ ] Checkout flow:
  - Call `POST /orders/checkout` (include `paymentMethod` and `couponCode` if applicable).
  - If payment info returned, redirect user to Instamojo `longurl`.
  - Show order confirmation after webhook/redirect confirms payment.
- [ ] Implement wishlist UI using wishlist endpoints.

---

If you want, I can also:
- Produce a Postman collection / OpenAPI spec for all these endpoints.
- Add small example React components that call these endpoints.

File created: `API_INTEGRATION.md` — tell me if you want it moved to `docs/` or turned into OpenAPI.
