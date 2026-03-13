# Database Schema & Data Notes

> The Sequelize models live under `src/modules/**/models`. Below is a distilled reference of the most relevant tables and columns.

## Users (`users`)
| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | PK | Auto increment |
| `email` | unique | Login identifier |
| `password_hash` | string | Bcrypt hash |
| `full_name` | string | Required |
| `phone` | string(15) | Optional (must be 10 digits for profile completeness) |
| `address_line`, `city`, `state`, `pincode` | strings | Soft-required before agreement acceptance |
| `bank_account_number`, `bank_ifsc`, `bank_name` | strings | Required for payouts/refunds (IFSC validated) |
| `date_of_birth`, `gender` | Additional KYC fields |
| `role` | enum(`owner`,`tenant`,`admin`) | Code-driven RBAC |
| `tier` | enum(`free`,`pro`) | Controls property limits |
| `profile_photo` | url | Stored as Document entry too |

## Documents (`documents`)
Tracks user uploads (profile photo, Aadhaar, PAN, address proof).

| Column | Notes |
| --- | --- |
| `doc_type` | `photo`, `aadhaar`, `pan`, `address_proof` |
| `doc_number` | Optional metadata |
| `file_url` | Path under `/uploads` |
| `verified` | Placeholder for manual verification |

## Properties (`properties`)
| Column | Notes |
| --- | --- |
| `property_id` | PK |
| `owner_id` | FK → users |
| `name`, `type`, `address_line`, `city`, `state`, `pincode` |
| `rent_amount`, `deposit_amount`, `rent_due_day` |
| `photos` (JSON) | Legacy array; superseded by `property_images` table |

## Property Images (`property_images`)
New table for multiple photos.
| Column | Notes |
| --- | --- |
| `image_id` | PK |
| `property_id` | FK |
| `file_url`, `caption`, `sort_order` |

## Invites (`invites`)
| Column | Notes |
| --- | --- |
| `token` | JWT-backed opaque string |
| `property_id`, `email`, `invited_by`, `used_by` |
| `status` | `pending`, `used`, `expired` |
| `expires_at` | 7-day TTL |

## Agreements (`agreements`)
| Column | Notes |
| --- | --- |
| `agreement_id` | PK |
| `agreement_number` | Generated on first tenant acceptance (format: `BVR-YY-MM-DD-O{owner}-T{tenant}-P{property}-A{id}`) |
| `property_id`, `owner_id`, `tenant_id`, `invite_id` |
| `start_date`, `end_date`, `rent_amount`, `deposit_amount`, `rent_due_day`, `gst_rate`, `terms` (JSON) |
| `status` | Enum: `draft`, `pending_deposit`, `started`, `ended`, `closed`, `rejected` |
| Timestamps | `accepted_at`, `rejected_at`, `started_at`, `ended_at`, `closed_at`, `revoked_at` |
| `renewed_from` | Self FK to previous agreement |
| `certificate_number` | Official doc reference |

## Agreement Events (`agreement_events`)
Append-only log of lifecycle events with metadata; powers timeline and audit exports.

## Agreement Documents (`agreement_documents`)
Stores certificates/photos uploaded by owner/admin for legal verification.

## Transactions (`transactions`)
Immutable ledger with hash chaining (`previous_hash`, `hash`). Types: `rent`, `deposit`, `refund`. Links to Razorpay order/payment IDs.

## Notifications (`notifications`)
| Column | Notes |
| --- | --- |
| `type` | `system`, `payment`, etc. |
| `title`, `message`, `metadata` |
| `read_at` | Null until user acknowledges |

## Chat (`chats`)
| Column | Notes |
| --- | --- |
| `agreement_id`, `sender_id`, `message`, `attachment_url` |

## Seed Data
Seeder `20260307001000-seed-beaver-demo.js` provisions:
- Admin, owner, tenant test users
- Sample property + images
- Invite, agreement with lifecycle events
- Transactions (deposit + rent), notifications, chat history
- Ensures demo accounts have completed profiles/KYC for realistic flows.

## Lifecycle Enums & States
- **Agreement status:** `draft → pending_deposit → started → ended/closed/rejected`
- **Invite status:** `pending`, `used`, `expired`
- **Transaction status:** `pending`, `completed`

## Integrity Constraints
- Most relations have `ON DELETE CASCADE` (documents/images/events) or `SET NULL` (optional references).
- Sequelize associations defined in `src/models/index.js` ensure eager-loading convenience.
