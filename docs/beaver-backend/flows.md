# Business Flows

This document captures the end-to-end flows Beaver supports today. Each flow calls out the involved APIs, lifecycle states, notifications, and dependencies.

## 1. User Onboarding & Authentication
1. **Registration** (`POST /api/v1/auth/register`)
   - Collects `full_name`, `email`, `phone`, password, role.
   - Sends OTP email (fail-soft if SMTP disabled).
2. **Verify OTP** (`POST /api/v1/auth/verify-otp`)
   - Confirms email, flips `email_verified`.
3. **Login** (`POST /api/v1/auth/login`)
   - Validates credentials, issues JWT access token + refresh token.
4. **Refresh** (`POST /api/v1/auth/refresh`)
   - Rotates refresh token, invalidates old session if token is revoked.
5. **Password flows** (`POST /auth/forgot-password`, `/reset-password`, `/change-password`)
   - OTP-based reset + logged-in change.

## 2. Tenant Self-Service Profile & KYC
1. **View profile** (`GET /users/me`)
2. **Update profile** (`PUT /users/me`)
   - Fields: name, phone, address, city/state/pincode, DOB, gender, bank account, IFSC, bank name.
3. **Upload profile photo** (`POST /users/me/photo`)
4. **Upload documents** (`POST /users/me/documents`)
   - Types: Aadhaar, PAN, Address Proof.
5. **Check completeness** (`GET /users/me/completeness`)
   - Returns missing fields, KYC doc count, boolean `is_complete`.

## 3. Property Management
1. **Owner creates property** (`POST /properties`)
   - Validates tier limits (free tier = 1 property).
2. **Upload property images** (`POST /properties/:id/images`)
   - Stores multiple photos (JPEG/PNG/WebP) with optional caption + sort order.
3. **Update/delete property** (`PUT` / `DELETE /properties/:id`)
   - Delete = soft delete (`is_active=false`).

## 4. Invite → Agreement Draft
1. **Create invite** (`POST /invites`)
   - Owner selects property + tenant email; system emails unique token.
2. **Inspect invite** (`GET /invites/:token`)
   - Prefills tenant onboarding form.
3. **Tenant accepts invite** (`POST /invites/:token/accept`)
   - Requires login; ensures invite email matches auth user.
   - Auto-creates **draft agreement** (no agreement number yet).
4. **Tenant sees bucket**
   - `GET /agreements?bucket=pending` lists drafts + pending deposits.
   - `GET /agreements/pending-actions` (future route) surfaces same data + action flags.

## 5. Agreement Lifecycle
| Stage | Trigger | Key fields | Notifications |
| --- | --- | --- | --- |
| Draft | Owner or invite acceptance | `status=draft` | Tenant notified | 
| Accept | Tenant accepts (`POST /agreements/:id/accept`) | Generates `agreement_number`, sets `accepted_at`, status = `pending_deposit` or `started` | Owner notified |
| Reject | Tenant rejects (`POST /agreements/:id/reject`) | `status=rejected`, `rejection_reason` | Owner notified |
| Deposit | Tenant pays deposit via Razorpay | `status=pending_deposit` → `started`, `started_at` | Tenant + owner notified |
| Renew | Owner creates renewal (`POST /agreements/:id/renew`) | Closes prior agreement (→ `ended`), creates new draft with `renewed_from` | Tenant notified |
| Revoke | Owner/admin closes early (`POST /agreements/:id/revoke`) | `status=closed`, `closed_reason` | Tenant notified |
| Settle | Owner processes deposit refund/deduction (`POST /agreements/:id/settle`) | Creates refund transaction, `status=closed`, `closed_at` | Tenant notified |

Timeline of each agreement is available via `GET /agreements/:id/timeline` (pulls `agreement_events`).

## 6. Payments & Transactions
1. **Initiate payment** (`POST /payments/initiate`)
   - Types: `rent`, `deposit`.
   - Validates user’s ownership/assignment and agreement status.
2. **Verify payment** (`POST /payments/verify`)
   - Confirms Razorpay signature, updates transaction hash chain.
3. **Webhooks** (`POST /payments/webhooks/razorpay`)
   - Reconciles asynchronous captures.
4. **Transaction listing/export** (`GET /transactions`, `/transactions/export/pdf`)
   - Supports filtering + PDF generation.

## 7. Cron-driven Automations
| Cron | Schedule (IST) | Action |
| --- | --- | --- |
| Dues job | `0 8 * * *` | Creates monthly rent transactions, sends notifications |
| Agreement expiry | `0 1 * * *` | Moves past-end-date agreements from `started` → `ended`, sets `ended_at` |
| Overdue reminder | `0 9 * * *` | Daily notifications for unpaid rent |
| Cleanup | `0 * * * *` | General housekeeping (expired tokens, temp files) |

## 8. Notifications & Chat
- Notifications stored in `notifications` table; email + in-app with fail-soft email fallback.
- Chat (`/chat`) ties to agreements; supports text + image attachments for tenant/owner conversation.

## 9. Admin Observability
- Admin role can view all users/properties/agreements but does not see private tenant-owner content (per business rule) except aggregated metrics.
- Action logs + audit tables capture sensitive events when `ENABLE_ACTION_LOGGING=true`.

## 10. Demo & Seed Data
- Seeder `20260307001000-seed-beaver-demo.js` provisions admin, owner, tenant, property, agreement lifecycle history, notifications, transactions.
- Demo credentials: `owner@beaver.rent`, `tenant@beaver.rent`, `admin@beaver.rent` (passwords: `Owner@123`, etc.).
