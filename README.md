# North & Pine E-Commerce Store

North & Pine is a full-stack university e-commerce project. The existing Vinext/Next.js storefront loads products from a beginner-friendly NestJS REST API, keeps the shopping cart in browser storage, and submits complete single- or multi-item orders to the backend.

## Technologies

- **Frontend:** Next.js, Vinext/Vite, React, TypeScript, Bootstrap, Cloudflare Workers
- **Backend:** NestJS, TypeScript, Jest
- **Storage:** In-memory backend arrays and browser `localStorage`

## Project Structure

```text
.
├── frontend/              # Vinext storefront and same-origin Nest API proxy
│   ├── app/               # Next routes, layout, and session helper
│   ├── lib/               # Nest proxy and connector support
│   ├── public/            # Store HTML, JavaScript, styles, images, Bootstrap
│   ├── scripts/           # Vinext/Sites development and build helpers
│   └── worker/            # Cloudflare Worker entry point
├── backend/               # NestJS API
│   └── src/
│       ├── products/      # Product module, controller, service, and tests
│       └── orders/        # Order module, controller, service, and tests
└── outputs/               # Local backups or generated deliverables
```

Generated directories such as `node_modules/`, `dist/`, `.next/`, `.vinext/`, `.wrangler/`, and coverage output are intentionally ignored and can be recreated.

## Installation

Requires Node.js 22.13 or newer. From the repository root:

```powershell
cd frontend
npm.cmd ci
cd ..\backend
npm.cmd ci
```

Use `npm` instead of `npm.cmd` on systems where PowerShell script execution is not restricted.

## Run Locally

Start NestJS in the first terminal:

```powershell
cd backend
npm.cmd run start:dev
```

Start the storefront in a second terminal:

```powershell
cd frontend
npm.cmd run dev -- --port 5173
```

Open `http://127.0.0.1:5173/store.html`. NestJS runs at `http://localhost:3000`. The frontend calls same-origin `/api/backend/*` proxy routes, which forward to `NEST_API_URL` (default `http://127.0.0.1:3000`). Copy `frontend/.env.example` to `.env.local` only when an override is needed.

## API Endpoints

- `GET /products` — list products
- `POST /products` — add a product
- `GET /orders` — list orders created since backend startup
- `POST /orders` — create a single- or multi-item order

See [backend/README.md](backend/README.md) for request examples and response behavior.

## Checks and Tests

```powershell
cd frontend
node --check public\assets\app.js
npm.cmd run lint
npm.cmd run build

cd ..\backend
npm.cmd test
npm.cmd run build
```

Backend product and order data resets whenever the NestJS process restarts. The browser cart persists locally until checkout or browser storage is cleared.
