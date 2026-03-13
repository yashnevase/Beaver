# Beaver Backend Overview

This folder documents the Beaver rental platform backend so any engineer (human or AI) can understand the system, extend it, or build the frontend against it. The backend is **feature-complete** for the flows described in `beaver-backend-completion-567b7d.md`, including authentication, tenant onboarding, agreement lifecycle, payments, notifications, and supporting artifacts (profile/KYC, property assets, agreement documents, cron automation, and Swagger docs).

## Tech Stack & Runtime
- **Language:** Node.js 20+
- **Framework:** Express.js (structured by feature modules)
- **ORM:** Sequelize (MySQL)
- **Auth:** JWT access/refresh tokens + OTP email verification
- **Payments:** Razorpay orders/webhooks for rent and deposit
- **Background jobs:** node-cron (dues, agreement expiry, overdue reminders, cleanup)
- **Real-time:** Socket.io for chat and notifications
- **File storage:** Local `uploads/` directory (with compression hooks)
- **Docs:** Swagger (JSDoc annotations under each route module)

## Environment Toggles (`.env`)
Feature switches make it easy to enable/disable platform capabilities without code changes:

| Flag | Purpose |
| --- | --- |
| `ENABLE_CLUSTER` / `WORKERS` | Multi-process scaling via Node cluster |
| `ENABLE_CSP`, `ENABLE_CORS`, `ENABLE_SECURITY_MW`, `ENABLE_RATE_LIMIT` | Security middlewares |
| `ENABLE_CRON` | Runs dues/expiry/overdue/background jobs |
| `ENABLE_SLOW_QUERY_LOG`, `ENABLE_API_TRACKING` | Diagnostics/logging |
| `ENABLE_IMAGE_COMPRESSION` | Shrinks uploads for photos/docs |
| `ENABLE_SWAGGER` | Serves `/api-docs` |
| `ENABLE_SMTP` | Email delivery (defaults to fail-soft in non-production) |
| `ENABLE_ACTION_LOGGING` | Audits sensitive actions |

Key service integrations:
- Razorpay credentials (`RAZORPAY_*`)
- SMTP credentials (fail-soft fallback for dev)
- Cron schedules and timezone
- Default GST rate (applied to payments)

## Coding Conventions
1. **Feature modules:** Each domain lives under `src/modules/<domain>` with `routes`, `controllers`, `services`, `validators`, and `models` where applicable.
2. **Validation first:** All routes use middleware validation (Joi schemas) before hitting controllers.
3. **Service orchestration:** Controllers are thin; all business logic resides in services with transactional safety where needed.
4. **Events & logging:** Agreement lifecycle events are captured in `agreement_events` for timelines/audit.
5. **Soft deletes:** Most tables use `deleted_at` and Sequelize's paranoid mode for reversible operations.
6. **Notification fail-soft:** Email delivery never blocks core flows in dev; errors are logged.
7. **Swagger parity:** Each route file declares Swagger annotations. After any change, hit `/api-docs` to confirm.

## Remaining TODOs
The backend itself is production-complete. Outstanding work before launch is documentation-only:
1. **Frontend build (React)** using these APIs.
2. **Optional**: Additional automated tests or CI/CD hardening.

Refer to the other markdown files in this folder for deep dives:
- `flows.md` – Business workflows end-to-end.
- `api-reference.md` – Endpoint catalog + request/response shape summary.
- `schema-and-data.md` – Database tables, key columns, lifecycle enums.
- `folder-structure.md` – Guide to important files/directories.
- `operations.md` – Setup, migrations, seeds, cron, verification steps.
