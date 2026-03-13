# Beaver Backend

Beaver is an India-specific rental SaaS backend for owner-tenant property management across houses, flats, shops, and land.

## Stack

- Node.js
- Express
- Sequelize
- MySQL
- Razorpay
- Nodemailer
- Socket.io
- Joi
- Winston
- Helmet
- node-cron

## Current MVP Scope

- Hybrid auth with OTP
- Owner and tenant roles
- Property CRUD
- Invite-based tenant onboarding
- Agreements
- Transactions and Razorpay payment initiation/verification
- Chat rooms per agreement
- Notifications
- Owner/Tenant dashboards
- Cron jobs for cleanup, dues, and agreement expiry

## API Base

- `http://localhost:3001/api/v1`
- Swagger docs: `http://localhost:3001/api-docs`

## Main Routes

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/verify-otp`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /properties`
- `POST /properties`
- `POST /invites`
- `GET /invites/:token`
- `POST /invites/:token/accept`
- `GET /agreements`
- `POST /agreements`
- `GET /transactions`
- `POST /payments/initiate`
- `POST /payments/verify`
- `POST /webhooks/razorpay`
- `GET /chat/:agreementId`
- `POST /chat/:agreementId`
- `GET /notifications`
- `GET /dashboard`

## Setup

```bash
npm install
cp .env.example .env
npm run migrate
npm run seed
npm start
```

## Environment

Important variables are documented in `.env.example`.

Required for payments:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

Required for email:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`

Required for auth:

- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `INVITE_TOKEN_SECRET`

## Demo Seed Data

After seeding, the demo records include:

- Owner: `owner@beaver.rent`
- Tenant: `tenant@beaver.rent`
- One property
- One invite
- One active agreement
- One completed transaction
- One chat message

## Notes

- Current boot sanity checks are blocked until dependencies like `mysql2` are installed locally.
- Agreement PDF generation is still a stub.
- Chat image upload route is still a stub.
- Redis/BullMQ are intentionally not used in MVP.

## Project Tracking

See `PROGRESS.md` for the current implementation state and next steps.
