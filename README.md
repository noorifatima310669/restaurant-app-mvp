# Urban Fork — MAD Assignment 2

**Restaurant App with Server and Database**

Assignment 2 extends the existing Assignment 1 frontend with **React Native + Expo**, **Node.js + Express**, **MongoDB Atlas**, **Mongoose**, and **JWT Authentication**. Customers and managers share server-backed menu data, orders, and reservations.

## 🎥 Assignment 2 Demo Video

[Watch Assignment 2 Demo Video](https://drive.google.com/file/d/1XNdnmZnqBL7HFeOmcs_VECZ5fO9W0Zkm/view?usp=sharing)

The video demonstrates the Assignment 2 app/server workflow.

## Assignment 2 status

The table records implemented work; screenshot availability and previously executed checks are documented separately below.

| Question | Deliverable | Status |
|---|---|---|
| Q1 | SRS v2, API/database design, order-sequence and deployment diagrams | Complete; documents in `A2/` |
| Q2 | Express server and `/api/health` | Implemented; health screenshots present |
| Q3 | MongoDB Atlas integration, Mongoose models, seed data | Implemented; Atlas MenuItems screenshot present |
| Q4 | Menu CRUD API | Implemented; success/failure screenshots present |
| Q5 | Signup/login, bcrypt, JWT, protected manager routes | Implemented; 401/201 screenshots linked; 403 image needs token redaction |
| Q6 | Backend-connected app, persisted auth, server menu, manager updates | Implemented; manager/customer price screenshots present |
| Q7 | Orders, reservations, server validation, 10-second order polling | Implemented; demo video linked above |

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React Native, Expo, JavaScript, AsyncStorage, React Navigation |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Authentication | bcryptjs, jsonwebtoken / JWT |
| Testing | Node.js test runner, Supertest, mongodb-memory-server, react-test-renderer; Thunder Client/Postman for manual API checks |

## Project structure

```text
restaurant-app-mvp/
|-- A1/                         # Original Assignment 1 SRS and UML
|-- A2/                         # Assignment 2 documents and evidence images
|   |-- diagrams/
|   |-- verification/
|   |-- SRS_v2.md
|   |-- SRS_v2.pdf
|   |-- TEST_RESULTS.md
|   `-- restaurant-api.postman_collection.json
|-- server/
|   |-- config/
|   |-- controllers/
|   |-- data/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- scripts/
|   |-- tests/
|   |-- server.js
|   |-- seed.js
|   `-- .env.example
|-- src/
|   |-- api/
|   |-- components/
|   |-- context/
|   |-- data/
|   |-- hooks/
|   |-- navigation/
|   |-- reducers/
|   |-- screens/
|   `-- theme/
|-- assets/menu/
|-- screenshots/                # Original A1 evidence; also a duplicate Q5 image
|-- scripts/
|-- tests/
|-- App.js
|-- package.json
`-- README.md
```

## Backend setup

Install Node.js and npm, then use Windows PowerShell:

```powershell
cd C:\Users\LENOVO\Desktop\MAD1\restaurant-app-mvp\server
npm.cmd install
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

Copy [server/.env.example](server/.env.example) to `server/.env` only if that private file does not already exist. Edit it locally with your own configuration. The example file leaves secrets blank; the values below are documentation placeholders only:

```dotenv
PORT=5000
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
JWT_SECRET=YOUR_32_PLUS_CHARACTER_SECRET
```

Use `restaurant_app` as the database name in your private Atlas connection string. Configure Atlas database-user permissions and network access for your laptop. Set a random JWT secret of at least 32 characters.

**DO NOT commit server/.env.**

```powershell
npm.cmd run seed
npm.cmd run dev
```

Seed creates missing demo accounts, 20 original menu items, and seven tables while preserving existing data, manager edits, and passwords.

Expected successful startup with `PORT=5000`:

```text
MongoDB connected
Urban Fork API listening on port 5000
```

Health endpoint: `GET http://localhost:5000/api/health`

Expected response format:

```json
{
  "status": "ok",
  "time": "<ISO timestamp>"
}
```

## Frontend setup and BASE_URL

From the project root, in a separate terminal:

```powershell
cd C:\Users\LENOVO\Desktop\MAD1\restaurant-app-mvp
npm.cmd install
npx.cmd expo start
```

`BASE_URL` is configured in [src/api/client.js](src/api/client.js). Replace the local development address for your environment, or use its optional `EXPO_PUBLIC_API_URL` override.

| Environment | Example API base URL |
|---|---|
| Physical phone | `http://YOUR_LAPTOP_IP:5000/api` |
| Android emulator | `http://10.0.2.2:5000/api` |

For physical phone testing, the phone and laptop must be on the same Wi-Fi. Find your laptop's IPv4 address using `ipconfig`, allow Node.js through the firewall on the trusted network, and restart Expo after changing the address. Open the app in Expo Go. The laptop IP is environment-specific.

## Demo / seeded assignment credentials

These are **DEMO / SEEDED ASSIGNMENT CREDENTIALS**, verified against `server/data/a1-seed.json`.

| Role | Email | Demo password |
|---|---|---|
| Customer | `customer@urbanfork.com` | `Urban123` |
| Manager | `manager@urbanfork.com` | `Manager123` |

Public signup creates customer accounts only; the seed provisions the manager. Login returns a one-day JWT and public user data. AsyncStorage persists the session; logout clears it. Seeding an existing database does not reset changed passwords.

## API endpoints

Protected requests use `Authorization: Bearer <YOUR_JWT_TOKEN>`. Customer and manager access is enforced by server middleware; customer `/my` routes return only that customer's records.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/health` | Public | Server health and ISO timestamp |
| POST | `/api/auth/register` | Public | Register a customer |
| POST | `/api/auth/login` | Public | Authenticate and return session |
| GET | `/api/auth/me` | Authenticated customer or manager | Current public user |
| GET | `/api/menu` | Public | List menu; optional category/search filters |
| GET | `/api/menu/:id` | Public | Read one menu item |
| POST | `/api/menu` | Manager JWT | Create menu item |
| PUT | `/api/menu/:id` | Manager JWT | Update menu fields, price, or availability |
| DELETE | `/api/menu/:id` | Manager JWT | Delete menu item |
| GET | `/api/tables` | Public | List tables |
| GET | `/api/tables/availability` | Public | Available tables for date, time, and party size |
| POST | `/api/orders` | Customer JWT | Place an order with server-calculated totals |
| GET | `/api/orders/my` | Customer JWT | List own orders |
| GET | `/api/orders` | Manager JWT | List all orders |
| PATCH | `/api/orders/:id/status` | Manager JWT | Apply a permitted status transition |
| POST | `/api/reservations` | Customer JWT | Create a validated reservation |
| GET | `/api/reservations/my` | Customer JWT | List own reservations |
| GET | `/api/reservations` | Manager JWT | List all reservations |
| PATCH | `/api/reservations/:id` | Manager JWT | Accept or decline a pending reservation |
| PATCH | `/api/reservations/:id/cancel` | Customer JWT; owner only | Cancel an active own reservation |

### Q4 / Q5 API evidence

These are expected outcomes from the implemented routes, assuming the server/database are available and create requests have valid required fields.

| Question | Request | Expected status |
|---|---|---|
| Q4 | `GET /api/menu` | 200 |
| Q4 | `GET /api/menu/not-a-valid-id` | 400 |
| Q5 | `POST /api/menu` without a token | 401 |
| Q5 | `POST /api/menu` with a customer token | 403 |
| Q5 | `POST /api/menu` with a manager token and valid body | 201 |

A valid but nonexistent menu ObjectId returns 404. Use Thunder Client or import the [Postman collection](A2/restaurant-api.postman_collection.json). Keep runtime tokens private.

## Database and shared behavior

The assignment database is **`restaurant_app`**, shown in the Atlas evidence. The models explicitly use these collection names:

| Collection | Data |
|---|---|
| Users | Customer/manager accounts and bcrypt password hashes |
| MenuItems | Shared menu, prices, categories, availability |
| Tables | Table names, seating capacities, areas |
| Reservations | Customer bookings and manager decisions |
| Orders | Items, server-calculated receipt totals, order status |

Menu data is shared through MongoDB. Manager price/availability changes become visible to customers when the menu is fetched again or pulled to refresh. Orders and reservations are stored server-side.

The server validates quantities, menu availability, order type, booking date/time, capacity, and ownership. It calculates order totals from current database prices. A unique active reservation index prevents simultaneous double-booking. JWT protects authenticated and manager operations.

Customer Orders fetches immediately and polls every **10 seconds**, with interval cleanup. Manager Dashboard also refreshes every 10 seconds. Order transitions are Pending → Preparing → Ready → Served, with cancellation allowed from Pending.

## Assignment Evidence

Existing Assignment 2 files are in `A2/`; there is no `A2/screenshots/` directory. Links below use their actual names and extensions.

| Question | Existing evidence |
|---|---|
| Q2 | [Thunder Client health and server startup](A2/q2-health-thunder.png) |
| Q2 | [Browser health response](A2/q2-health-phone.png) — despite its filename, this is a desktop browser capture |
| Q3 | [Atlas restaurant_app / MenuItems](A2/q3-mongodb-menuitems.png) |
| Q4 | [Menu success: 200](A2/q4-menu-success.png) · [Invalid ID: 400](A2/q4-menu-failure.png) |
| Q5 | [No token: 401](A2/q5-no-token-401.png) · [Manager create: 201](A2/q5-manager-201.png) |
| Q5 | `A2/q5-customer-403.png` exists but displays a Bearer JWT; omitted from links until redacted |
| Q6 | [Manager new price](A2/q6-manager-new-price.jpeg) · [Customer new price](A2/q6-customer-new-price.jpeg) |

The Q6 captures both show Truffle Parmesan Fries at PKR 1,000. All ten named evidence captures exist, with Q6 using `.jpeg` instead of `.png`. A duplicate customer-403 file also exists at `screenshots/q5-customer-403.png`; neither 403 file is linked here.

Screenshot: Add a genuine phone health capture here; the current `q2-health-phone.png` is desktop evidence.

Screenshot: Add a redacted customer-403 capture here before linking it. Existing screenshot files are unchanged.

## Testing and verification

According to [A2/TEST_RESULTS.md](A2/TEST_RESULTS.md), dated 11 October 2026, **110 automated tests passed**: 81 backend and 29 frontend, with zero failures. These are previously recorded results, not a new test run for this README update.

| Recorded check | Result |
|---|---|
| Backend integration/startup tests | 81 passed using disposable MongoDB |
| Frontend tests | 29 passed with mocked transport/native primitives |
| ESLint | Passed |
| JavaScript syntax/import checks | Passed; 59 files |
| Expo dependency check | Passed |
| Expo Doctor | 21/21 checks passed |
| Web export | Passed; `dist/web` |
| Android export | Passed; Hermes bundle in `dist/android` |
| Expo/server startup smoke checks | Passed |

Run the existing checks from the project root:

```powershell
npm.cmd run lint
npm.cmd run check:syntax
npm.cmd run test:frontend
npm.cmd test --prefix server
npm.cmd run check
npm.cmd run build:web
npm.cmd run build:android
```

[Raw verification outputs](A2/verification/results.json) support the report. Automated verification used disposable MongoDB and mocked frontend I/O; an Android export is bundle verification, not an APK installation. The report's manual-evidence notes predate the currently present screenshots and supplied video link. Evidence availability is recorded above; no new live Atlas/device verification is claimed.

`A2/IMPLEMENTATION_REPORT.md` is absent, so no implementation-report link or claims are included.

## SRS and documents

- [Assignment 2 SRS v2 (PDF)](A2/SRS_v2.pdf) · [Markdown source](A2/SRS_v2.md)
- [Test results](A2/TEST_RESULTS.md)
- [Postman API collection](A2/restaurant-api.postman_collection.json)
- [Combined diagrams (PDF)](A2/diagrams/A2_Diagrams.pdf)
- [Order sequence (SVG)](A2/diagrams/order-sequence.svg) · [Mermaid source](A2/diagrams/order-sequence.mmd)
- [Deployment (SVG)](A2/diagrams/deployment.svg) · [Mermaid source](A2/diagrams/deployment.mmd)

## Security notes

- `server/.env` must never be pushed; it is ignored by Git.
- Never commit a MongoDB URI/password, `JWT_SECRET`, or real JWT tokens.
- `.env.example` contains blank secret fields for local configuration; README values are placeholders only.
- Passwords stored in MongoDB are bcrypt hashes; API responses exclude password fields.
- Protected endpoints use Bearer JWT tokens and server-side role/ownership checks.
- Keep secrets out of frontend variables, exported Postman collections, screenshots, and videos. Redact tokens before publishing evidence.

## Quick Start

Complete the private environment setup and configure `BASE_URL` first.

**Terminal 1 — Backend**

```powershell
cd C:\Users\LENOVO\Desktop\MAD1\restaurant-app-mvp
cd server
npm.cmd install
npm.cmd run seed
npm.cmd run dev
```

**Terminal 2 — Expo**

```powershell
cd C:\Users\LENOVO\Desktop\MAD1\restaurant-app-mvp
npm.cmd install
npx.cmd expo start
```

1. Keep the backend running.
2. Open the app in Expo Go.
3. Log in using the demo customer or manager account.

## Assignment 1 — historical frontend work

Assignment 1 is the original frontend baseline: menu browsing/search, cart and receipts, reservations, role-based navigation, and themes. Assignment 2 extends it with server authentication and shared database storage.

- [Original SRS](A1/SRS.pdf)
- [Original UML diagrams](A1/UML_Diagrams.pdf)
- [Original screenshots](screenshots/) — numbered A1 captures remain historical evidence
- [Assignment 1 demo video](https://drive.google.com/file/d/19JWpzNvg2EJ85vGqjBb7cAhwE_Q8F0P9/view?usp=drive_link)

Assignment 1's frontend-only authentication/storage descriptions do not describe the current Assignment 2 server-backed behavior.
