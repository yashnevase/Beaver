# Folder Structure

```
rent/
├── src/
│   ├── config/               # DB, logger, Razorpay, email, env toggles
│   ├── middleware/           # auth, permissions, validation, rate limiting
│   ├── routes/               # Top-level router that mounts module routers
│   ├── models/               # Sequelize bootstrap + shared models (AuditLog)
│   ├── lib/                  # Email service, PDF helpers, uploads
│   ├── jobs/                 # Cron jobs (dues, expiry, overdue, cleanup)
│   ├── utils/                # ApiResponse, pagination, cache, file upload
│   └── modules/
│       ├── auth/
│       │   ├── controllers/ (login, register, OTP)
│       │   ├── services/ (authService, tokenService)
│       │   ├── routes/ (auth endpoints + Swagger)
│       │   └── models/ (RefreshToken, Otp)
│       ├── user/             # profile, documents, admin user mgmt
│       │   ├── controllers/ (profileController, userController)
│       │   ├── services/ (profileService, userService)
│       │   ├── routes/ (profile routes under /users/me, admin CRUD)
│       │   ├── validators/ (Joi schemas)
│       │   └── models/ (User, Document)
│       ├── property/
│       │   ├── controllers/ (propertyController, propertyImageController)
│       │   ├── services/ (propertyService)
│       │   ├── routes/ (property + image routes + Swagger)
│       │   └── models/ (Property, PropertyImage)
│       ├── invite/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── routes/
│       │   └── models/ (Invite)
│       ├── agreement/
│       │   ├── controllers/ (agreementController, agreementDocController)
│       │   ├── services/ (agreementService, agreementPdfService)
│       │   ├── validators/ (agreementValidators)
│       │   ├── routes/ (agreement lifecycle, documents, pending-actions)
│       │   └── models/ (Agreement, AgreementEvent, AgreementDocument)
│       ├── payment/
│       │   ├── controllers/
│       │   ├── services/ (paymentService)
│       │   ├── validators/
│       │   └── routes/
│       ├── transaction/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── validators/
│       │   └── models/ (Transaction)
│       ├── notification/
│       │   ├── controllers/
│       │   ├── services/ (notificationService)
│       │   ├── routes/
│       │   └── models/ (Notification)
│       ├── chat/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── routes/
│       │   └── models/ (Chat)
│       └── dashboard/, admin/, etc. for stats + admin tooling
│
├── migrations/               # Sequelize migrations (timestamped)
├── seeders/                  # Demo data scripts
├── uploads/                  # Runtime-uploaded files (gitignored)
├── docs/                     # Documentation (this folder)
├── .env.example              # Sample environment config
├── package.json              # Scripts: dev, start, migrate, seed, lint
└── PROGRESS.md               # Implementation log
```

## Key Files
- `src/server.js` – Express bootstrap + Swagger + Socket.io + cron start.
- `src/routes/index.js` – Mounts module routers under `/api/v1/...`.
- `src/middleware/auth.js` – Auth + role/permission checks (`requirePermission`, `requireRole`).
- `src/utils/fileUpload.js` – Multer setup + compression hooks used by profile/property/agreement uploads.
- `src/jobs/index.js` – Registers cron jobs respecting `ENABLE_CRON` env flag.
- `src/models/index.js` – Registers Sequelize models + associations.
- `docs/beaver-backend/*.md` – Documentation set (overview, flows, API, schema, operations).
