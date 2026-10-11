# Assignment 2 — executed verification

Date: 11 October 2026 (Asia/Karachi). Existing project: restaurant-app-mvp. The adjacent restaurant-app-mvp-final copy was not changed.

| Check | Actual result |
|---|---|
| Backend integration/startup tests | 81 passed, 0 failed; real disposable MongoDB 8.2.6 |
| Frontend tests | 29 passed, 0 failed; actual contexts/hooks/checkout UI with mocked transport/native primitives |
| Total automated tests | 110 passed |
| ESLint | Passed; no lint errors |
| JavaScript syntax/import checks | Passed; 59 frontend/server JavaScript files |
| Expo dependency check | Passed; dependencies up to date |
| Expo Doctor | 21/21 checks passed after adding expo-font |
| Web export | Passed; dist/web |
| Android export | Passed; Hermes bundle in dist/android; this is not an APK/device installation |
| Expo start | Passed; offline Metro on port 8089; /status returned packager-status:running |
| Server startup | Passed; actual start() binds 0.0.0.0; health 200; missing JWT/Mongo config and unreachable database fail cleanly |
| Document validation | SRS PDF 12 pages; A2 diagrams PDF 2 pages; sections/FR IDs and all 45 Postman bodies validated |
| A1 preservation | Original A1 docs/assets, components, navigation, themes, reducers, data, form/debounce hooks and every screen style definition unchanged; old README preserved verbatim |
| Secret handling | Real .env not created; .env/.env.* ignored except .env.example; exported Postman token variables blank; no real tokens/credentials committed |

Temporary disposable API/MongoDB and Expo smoke-test services were stopped after verification; start them with the README commands when needed.

Raw final outputs are in verification/. Reproduce them with node scripts/verify-a2.cjs. results.json records exit codes and counts. Build outputs/dependencies/PDF helper libraries are ignored by Git.

Backend coverage: health/404/CORS/JSON errors; schema constraints; non-destructive seed; menu CRUD/filtering/invalid IDs/validation; bcrypt/register/duplicate/login/1-day JWT/401/403; database-calculated order prices and ignored forged totals; unavailable items/ownership/manager access/legal transitions; reservation capacity/date/phone/lead time/ownership/Accept/Decline/cancellation; simultaneous conflict index; actual server startup and sanitized failure paths.

Frontend coverage: JSON/Bearer transport and server/network/parse errors; session persistence/restore/expiry/logout; public signup body; existing menu loading and protected mutations/refetch; useApi retry/stale result handling; authoritative order POST response; immediate/exact 10-second Orders polling and interval cleanup; actual checkout cart retained on failure and cleared after success; reservation hook validation/POST; A1 cart/order reducers.

## Actual dependency audit limits

A nonbreaking npm audit fix removed the reported critical shell-quote issue. Final frontend audit reports 22 remaining transitive advisories (15 high, 7 moderate) in the existing Expo/Metro toolchain. Server full audit reports 3 high advisories in nodemon/chokidar/braces development tooling; server runtime-only audit reports 0 vulnerabilities. npm's suggested forced fixes downgrade Expo/React Native/nodemon across major versions; these were not applied because they would disrupt the existing A1 app. These are recorded dependency audit findings, not a claim that submission/device evidence exists.

## Still manual

- Real MongoDB Atlas credentials, connection and collection verification: pending.
- Q2–Q6 genuine screenshots: pending; no new app screenshots were fabricated or relabeled.
- Q6 real two-client same-price evidence: pending.
- Q7 physical two-device full flow and <=4-minute recording: pending.
- Real Q7 demo URL in README: pending; required placeholder remains.

Automated tests used local disposable MongoDB and mocked frontend I/O. They do not prove physical devices, Atlas connectivity, production deployment or a full browser visual review. Existing A1 screenshots/video remain historical evidence. Assignment 2 is not submission-complete until the manual evidence above is supplied.
