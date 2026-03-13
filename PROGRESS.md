# Beaver Backend Progress

This file tracks implementation progress so any agent can continue safely.

## Completed

- Cleaned large parts of generic boilerplate not needed for Beaver MVP.
- Simplified auth model from DB-driven RBAC to enum roles: `owner`, `tenant`, `admin`.
- Updated:
  - `package.json`
  - `src/config/db.js`
  - `src/middleware/auth.js`
  - `src/modules/auth/services/authService.js`
  - `src/modules/auth/validators/authValidators.js`
  - `src/app.js`
  - `src/server.js`
  - `.env.example`
- Added Beaver domain models:
  - `Property`
  - `Invite`
  - `Agreement`
  - `Transaction`
  - `Chat`
  - `Notification`
- Rebuilt `src/models/index.js` with Beaver associations.
- Added config:
  - `src/config/razorpay.js`
  - `src/config/socket.js`
- Replaced route registry with Beaver `/api/v1` modules.
- Added top-level webhook alias: `/api/v1/webhooks/razorpay`.
- Implemented real foundation for:
  - `property` service/controller/validators/routes
  - `invite` service/controller/validators/routes
  - `agreement` service/controller/validators/routes
  - `agreement` PDF generation endpoint using PDFKit
  - `payment` service/controller/validators/routes
  - Beaver cron jobs: cleanup, dues, agreement expiry
  - `chat` service/controller/validators/routes
  - chat image upload endpoint
  - `notification` service/controller/routes
  - `dashboard` service/controller/routes
- Rewrote Sequelize CLI DB config for Beaver MySQL.
- Replaced old migrations with Beaver-specific migration set.
- Added Beaver demo seeder for owner/property/invite/agreement/transaction/chat/notification.
- Rewrote `schema.sql` and `README.md` to Beaver-specific artifacts.
- Fixed middleware response wrappers to always return the original `send`/`json` result.
- Updated Razorpay webhook verification to use captured raw request bodies.
- Replaced transaction export placeholder behavior with real PDF export/download flow.
- Added request validation for active transaction list/detail routes.
- Removed remaining placeholder wording from generated agreement PDFs.

## Recently Completed (Mar 7, 2026)

- **Removed stale DB-managed RBAC admin module** — rewrote to simple admin panel with code-level role checks
- **Rewrote userService/userExportService** — removed db.Role refs, fixed PostgreSQL `iLike` → MySQL `LIKE`
- **Fixed ActionLog model** — changed JSONB to JSON for MySQL compatibility
- **Added soft-delete support** — `deleted_at` column + Sequelize `paranoid: true` on all domain models (Property, Invite, Agreement, Transaction, Chat, Notification)
- **Added user management permissions** to `src/constants/permissions.js`
- **Wired user and admin routes** into main router (`/api/v1/users`, `/api/v1/admin`)
- **Enhanced logger** — debug file transport in dev, performance logger, durationMs in console output
- **Updated migrations** — added `deleted_at` columns to properties, invites, agreements, transactions, chats, notifications tables
- **Updated seeder** — added admin user (`admin@beaver.rent` / `Admin@123`)
- **Added sharp dependency** for image processing
- **Added public `/health/db` endpoint** — returns DB connection status, latency, dialect, and table stats
- **Fixed AuditLog association** — corrected `user_id` → `actor_id` foreign key
- **Updated `.env.example`** — added `LOG_LEVEL` var
- **Implemented self-service profile APIs** — `/api/v1/users/me`, profile update, profile photo upload, KYC document upload/list
- **Added user profile fields + KYC persistence** — `address_line`, `city`, `state`, `pincode`, and new `documents` table/model
- **Implemented agreement lifecycle** — owner creates draft, tenant can reject and re-accept, status moves to `pending_deposit`, and timeline is tracked
- **Added system-generated agreement numbers** — format like `BVR-YY-MM-DD-Ox-Tx-Px-Ax`
- **Added agreement event trail** — new `agreement_events` table/model and timeline endpoint
- **Linked invite acceptance to draft agreement creation** — accepting invite now auto-creates a draft agreement for that property-owner-tenant relationship
- **Implemented settlement/close flow** — owner can settle deposit refund/deduction and close agreement
- **Implemented deposit-gated activation logic** — completed deposit payments auto-activate agreements in `pending_deposit`
- **Implemented dues + overdue notification automation** — cron-generated dues now notify tenant/owner and new overdue reminder cron job added
- **Made email delivery fail-soft in development** — auth, invite, and notification flows continue even if SMTP is misconfigured
- **Live smoke-tested new flows** — verified `/users/me`, profile update, invite creation, invite acceptance, agreement reject, re-accept, and agreement timeline endpoints

## In Progress

- Swagger route documentation (`@swagger` JSDoc comments) across modules

## Known Blockers

- No backend blocker currently
- Full deposit-payment activation path is implemented but still depends on valid Razorpay credentials for live end-to-end payment verification

## Next Recommended Steps

1. Add complete Swagger JSDoc docs for all route files so `/api-docs` becomes frontend-ready
2. Refresh and rerun the demo seed from a clean DB to align seeded rows with the new lifecycle fields
3. Add integration tests for the invite → agreement → reject/re-accept → deposit/payment lifecycle
4. Test the live deposit activation path with valid Razorpay sandbox credentials
5. After API docs are complete, prepare frontend integration handoff

## Important Architectural Decisions

- Roles are code-level enum roles, not DB-managed RBAC.
- MySQL is the default and expected DB.
- Socket.io is initialized in `server.js` and authenticated with JWT.
- In-memory cache is the existing custom cache utility.
- Transaction immutability uses SHA-256 hash chaining.
- Cron jobs are simple `node-cron` jobs; no Redis/BullMQ for MVP.
