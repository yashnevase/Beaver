# API Reference (Summary)

> Full Swagger documentation is served from `/api-docs`. This file is a quick human-readable index grouped by domain.

## Auth
| Endpoint | Method | Description | Notes |
| --- | --- | --- | --- |
| `/auth/register` | POST | Create account (owner/tenant) | Sends OTP email |
| `/auth/verify-otp` | POST | Verify registration/login OTP | Required before login |
| `/auth/login` | POST | Issue JWT + refresh token | Requires verified email |
| `/auth/refresh` | POST | Rotate refresh token | Uses token versioning |
| `/auth/logout` | POST | Revoke refresh token | Device-specific |
| `/auth/forgot-password` | POST | Initiate password reset | Sends OTP |
| `/auth/reset-password` | POST | Complete password reset | OTP validated |
| `/auth/change-password` | POST | Authenticated change | Requires current password |

## Users & Profile
| Endpoint | Method | Description |
| --- | --- | --- |
| `/users/me` | GET | Fetch current user profile + documents |
| `/users/me` | PUT | Update profile (contact + address + bank + DOB/gender) |
| `/users/me/photo` | POST | Upload profile photo |
| `/users/me/documents` | GET | List uploaded KYC documents |
| `/users/me/documents` | POST | Upload KYC document (Aadhaar/PAN/address proof) |
| `/users/me/completeness` | GET | Returns profile + KYC completeness checklist |
| `/users` (admin) | CRUD endpoints for managing users |

## Properties
| Endpoint | Method | Description |
| --- | --- | --- |
| `/properties` | GET | List properties (filtered by owner/role) |
| `/properties` | POST | Create property (owners/admin) |
| `/properties/{id}` | GET | Property details |
| `/properties/{id}` | PUT | Update property |
| `/properties/{id}` | DELETE | Soft-delete property |
| `/properties/{id}/images` | GET | List property images |
| `/properties/{id}/images` | POST | Upload property image |
| `/properties/{id}/images/{imageId}` | DELETE | Remove property image |

## Invites
| Endpoint | Method | Description |
| --- | --- | --- |
| `/invites` | POST | Owner sends tenant invite for property |
| `/invites/{token}` | GET | Prefill invite details (unauthenticated) |
| `/invites/{token}/accept` | POST | Logged-in tenant accepts invite; creates draft agreement |

## Agreements
| Endpoint | Method | Description |
| --- | --- | --- |
| `/agreements/pending-actions` | GET | Returns profile completeness + drafts + deposit/rent pending actions |
| `/agreements` | GET | List agreements (filter by status/bucket) |
| `/agreements` | POST | Owner/admin creates draft agreement |
| `/agreements/{id}` | GET | Agreement details |
| `/agreements/{id}` | PUT | Update draft agreement |
| `/agreements/{id}/accept` | POST | Tenant accepts (enforces profile/KYC) |
| `/agreements/{id}/reject` | POST | Tenant rejects with reason |
| `/agreements/{id}/revoke` | POST | Owner/admin closes agreement early |
| `/agreements/{id}/renew` | POST | Create renewal draft (new agreement) |
| `/agreements/{id}/settle` | POST | Process deposit refund/deduction, close agreement |
| `/agreements/{id}/timeline` | GET | Event log of lifecycle |
| `/agreements/{id}/pdf` | GET | Generate/download agreement PDF |
| `/agreements/{id}/documents` | GET/POST | List or upload official agreement docs |
| `/agreements/{id}/documents/{docId}` | DELETE | Remove uploaded agreement doc |

## Payments & Transactions
| Endpoint | Method | Description |
| --- | --- | --- |
| `/payments/initiate` | POST | Start Razorpay order (rent/deposit) |
| `/payments/verify` | POST | Verify signature post-payment |
| `/payments/webhooks/razorpay` | POST | Handle webhook events |
| `/transactions` | GET | List transactions (filters, pagination) |
| `/transactions/{id}` | GET | Transaction detail |
| `/transactions/export/pdf` | GET | Export filtered transactions as PDF |

## Notifications
| Endpoint | Method | Description |
| --- | --- | --- |
| `/notifications` | GET | List notifications |
| `/notifications/{id}/read` | POST | Mark single notification read |
| `/notifications/read-all` | POST | Bulk mark read |

## Chat
| Endpoint | Method | Description |
| --- | --- | --- |
| `/chat` | GET/POST | Agreement-scoped messaging (also mirrored via Socket.io) |

## Dashboard & Analytics
- `/dashboard/owner`, `/dashboard/tenant`, `/dashboard/admin` provide aggregate stats per role (existing endpoints in project). They read from agreements, transactions, invites, and notifications.

Refer to `Swagger UI` for request/response schemas, enums, and full parameter listings. This document is meant as a table-of-contents for API discovery.
