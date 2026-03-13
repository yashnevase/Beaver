# Operations Playbook

This guide explains how to run, migrate, seed, and verify the Beaver backend locally (and in staging/production once infra is ready).

## 1. Setup & Installation
1. **Clone repo** and install deps:
   ```bash
   npm install
   ```
2. **Copy env template**:
   ```bash
   cp .env.example .env
   ```
   - Update DB creds, JWT secrets, Razorpay keys, SMTP credentials, `FRONTEND_URL`, etc.
3. **Create database** (MySQL):
   ```sql
   CREATE DATABASE beaver_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
4. **Run migrations**:
   ```bash
   npm run migrate
   ```
5. **Seed demo data (optional)**:
   ```bash
   npm run seed
   ```

## 2. Running the Server
- Dev mode (nodemon + socket + Swagger):
  ```bash
  npm run dev
  ```
- Production mode (single process):
  ```bash
  NODE_ENV=production npm start
  ```

### Health Checks
- `GET /health` – app status
- `GET /health/db` – Sequelize database connectivity check

## 3. Cron Jobs
Controlled by `ENABLE_CRON` and individual schedules in `.env`.
- Dues job (`DUES_CRON_SCHEDULE`)
- Agreement expiry (`AGREEMENT_EXPIRY_CRON_SCHEDULE`)
- Overdue reminders (`OVERDUE_REMINDER_CRON_SCHEDULE`)
- Cleanup job (hourly)

Logs show activation on boot. Disable by setting `ENABLE_CRON=false` for environments where external schedulers are used.

## 4. File Uploads & Storage
- All uploads go to `uploads/` relative to project root.
- Use `UPLOAD_DIR`, `MAX_FILE_SIZE`, and `IMAGE_*` env vars to tune behavior.
- For production, point uploads to persistent storage (S3, GCS) by swapping out `fileUpload` helper (future TODO).

## 5. Payment Integration (Razorpay)
- Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
- For local dev, use Razorpay test mode; webhook endpoint must be reachable (e.g., via ngrok) if you want async capture testing.

## 6. Email Delivery
- Requires SMTP creds (Gmail, SES, etc.).
- `ENABLE_SMTP=false` keeps flows non-blocking (emails logged but not sent).
- Fail-soft behavior ensures invites/notifications/auth flows don’t crash if SMTP errors occur.

## 7. Swagger Documentation
- Accessible at `/api-docs` when `ENABLE_SWAGGER=true`.
- Regenerate after edits by restarting server; JSDoc annotations live alongside route files.

## 8. Testing & QA Checklist
1. Run `npm run lint` (if configured) and `npm run test` (future enhancement) before deployments.
2. Manual smoke tests (post-migration):
   - Auth register/login/logout
   - Profile update + completeness
   - Invite acceptance + agreement accept/reject
   - Deposit payment (Razorpay sandbox) → agreement `started`
   - Rent payment flow + cron-generated dues (trigger via `node src/jobs/duesJob.js` manually if needed)
   - Notifications in app + email logs
3. Verify `/api-docs` loads without schema errors.

## 9. Deployment Considerations
- Use PM2 or systemd for multi-process (or enable Node cluster via `ENABLE_CLUSTER=true`).
- Ensure `.env` has production secrets and `NODE_ENV=production` to disable dev-only behavior (detailed logs, fail-soft relaxations).
- Set up log forwarding (Winston -> stdout, then ship via Docker/k8s or filebeat).
- Back up MySQL regularly; transaction hash chain guards data integrity but does not prevent loss.

## 10. Troubleshooting
| Symptom | Check |
| --- | --- |
| Cannot connect to DB | Confirm env vars, host firewall, run `npm run migrate` to ensure schema |
| Email errors | Log output will note SMTP failures; set `ENABLE_SMTP=false` temporarily |
| Razorpay signature mismatch | Ensure webhook secret matches Razorpay dashboard |
| Swagger not loading | Check `ENABLE_SWAGGER`, ensure route files have valid JSDoc |
| Cron not firing | Confirm `ENABLE_CRON=true` and server logs show cron startup |

## 11. Demo Credentials
```
owner@beaver.rent / Owner@123
tenant@beaver.rent / Tenant@123
admin@beaver.rent / Admin@123
```
Use these with seeded DB for product demos and manual QA.

---
This operations guide, combined with the other docs, allows any engineer to spin up, verify, and maintain the Beaver backend independently.
