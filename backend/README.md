# North & Pine Lab 7 Backend

This beginner-friendly NestJS API is separate from the existing storefront. It uses in-memory arrays, so added products and orders reset when the server restarts.

## Run the backend

Requires Node.js 22.13 or newer.

```sh
npm install
npm run start:dev
```

The API runs at `http://localhost:3000`. Keep the frontend running separately from `../frontend` with `npm run dev -- --port 5173`. The backend permits that frontend origin by default; set `FRONTEND_ORIGIN` to override it.

## Endpoints

- `GET /products` lists products.
- `POST /products` creates a product from `id`, `name`, `category`, `priceCents`, and `image`.
- `GET /orders` lists orders created since startup.
- `POST /orders` creates an order. It accepts the original `customerName`, `productId`, and `quantity` format or a multi-item `items` array.

Browser-test the GET endpoints at `http://localhost:3000/products` and `http://localhost:3000/orders`. Use Postman for POST requests with the `Content-Type: application/json` header.

Example product body:

```json
{
  "id": "desk-lamp",
  "name": "Desk Lamp",
  "category": "Home",
  "priceCents": 4500,
  "image": "/assets/desk-lamp.png"
}
```

Example order body:

```json
{
  "customerName": "Lab Student",
  "productId": "day-bottle",
  "quantity": 2
}
```

The storefront sends multiple cart lines as one order:

```json
{
  "customerName": "Lab Student",
  "email": "student@example.com",
  "items": [
    { "productId": "day-bottle", "quantity": 2 },
    { "productId": "field-pack", "quantity": 1 }
  ]
}
```

The response includes item details plus `subtotalCents`, `shippingCents`, `taxCents`, and `totalCents`.

## Verify

```sh
npm test
npm run build
```
