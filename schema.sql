-- Beaver Rental SaaS - MySQL Schema Snapshot
-- Core schema aligned with Sequelize models and Beaver MVP

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS action_logs;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS chats;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS agreements;
DROP TABLE IF EXISTS invites;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS otps;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NULL,
  role ENUM('owner','tenant','admin') NOT NULL DEFAULT 'tenant',
  tier ENUM('free','pro') NOT NULL DEFAULT 'free',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  email_verified TINYINT(1) NOT NULL DEFAULT 0,
  last_login_at DATETIME NULL,
  password_reset_token VARCHAR(255) NULL,
  password_reset_token_expires_at DATETIME NULL,
  refresh_token_version INT NOT NULL DEFAULT 0,
  profile_photo VARCHAR(500) NULL,
  deleted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_tier (tier),
  INDEX idx_users_is_active (is_active),
  INDEX idx_users_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refresh_tokens (
  token_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  is_revoked TINYINT(1) NOT NULL DEFAULT 0,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_refresh_tokens_user_id (user_id),
  INDEX idx_refresh_tokens_expires_at (expires_at),
  INDEX idx_refresh_tokens_is_revoked (is_revoked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE otps (
  otp_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  purpose ENUM('REGISTRATION','PASSWORD_RESET','EMAIL_VERIFICATION','OTHER') NOT NULL DEFAULT 'REGISTRATION',
  expires_at DATETIME NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_otps_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_otps_user_id (user_id),
  INDEX idx_otps_expires_at (expires_at),
  INDEX idx_otps_is_used (is_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE properties (
  property_id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(200) NOT NULL,
  type ENUM('house','flat','shop','land') NOT NULL,
  address_line VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  rent_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  deposit_amount DECIMAL(12,2) NULL DEFAULT 0,
  description TEXT NULL,
  photos JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_properties_owner FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_properties_owner_id (owner_id),
  INDEX idx_properties_type (type),
  INDEX idx_properties_city (city),
  INDEX idx_properties_pincode (pincode),
  INDEX idx_properties_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE invites (
  invite_id INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(500) NOT NULL UNIQUE,
  property_id INT NOT NULL,
  email VARCHAR(255) NOT NULL,
  invited_by INT NOT NULL,
  used_by INT NULL,
  status ENUM('pending','used','expired','revoked') NOT NULL DEFAULT 'pending',
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_invites_property FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_invites_invited_by FOREIGN KEY (invited_by) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_invites_used_by FOREIGN KEY (used_by) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_invites_property_id (property_id),
  INDEX idx_invites_email (email),
  INDEX idx_invites_status (status),
  INDEX idx_invites_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE agreements (
  agreement_id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT NOT NULL,
  owner_id INT NOT NULL,
  tenant_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rent_amount DECIMAL(12,2) NOT NULL,
  deposit_amount DECIMAL(12,2) NULL DEFAULT 0,
  rent_due_day INT NOT NULL DEFAULT 1,
  gst_rate DECIMAL(5,2) NULL DEFAULT 0,
  status ENUM('draft','active','expired','revoked') NOT NULL DEFAULT 'draft',
  terms JSON NULL,
  pdf_url VARCHAR(500) NULL,
  revoked_at DATETIME NULL,
  revoke_reason TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_agreements_property FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_agreements_owner FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_agreements_tenant FOREIGN KEY (tenant_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_agreements_property_id (property_id),
  INDEX idx_agreements_owner_id (owner_id),
  INDEX idx_agreements_tenant_id (tenant_id),
  INDEX idx_agreements_status (status),
  INDEX idx_agreements_start_date (start_date),
  INDEX idx_agreements_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE transactions (
  transaction_id INT AUTO_INCREMENT PRIMARY KEY,
  agreement_id INT NOT NULL,
  paid_by INT NOT NULL,
  type ENUM('rent','deposit','expense','refund') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  gst_amount DECIMAL(12,2) NULL DEFAULT 0,
  razorpay_order_id VARCHAR(255) NULL,
  razorpay_payment_id VARCHAR(255) NULL,
  razorpay_signature VARCHAR(500) NULL,
  status ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
  due_date DATE NULL,
  paid_at DATETIME NULL,
  description VARCHAR(500) NULL,
  hash VARCHAR(64) NULL,
  previous_hash VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_transactions_agreement FOREIGN KEY (agreement_id) REFERENCES agreements(agreement_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_transactions_paid_by FOREIGN KEY (paid_by) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_transactions_agreement_id (agreement_id),
  INDEX idx_transactions_paid_by (paid_by),
  INDEX idx_transactions_type (type),
  INDEX idx_transactions_status (status),
  INDEX idx_transactions_due_date (due_date),
  INDEX idx_transactions_razorpay_order_id (razorpay_order_id),
  INDEX idx_transactions_razorpay_payment_id (razorpay_payment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chats (
  chat_id INT AUTO_INCREMENT PRIMARY KEY,
  agreement_id INT NOT NULL,
  sender_id INT NOT NULL,
  message TEXT NULL,
  image_url VARCHAR(500) NULL,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_chats_agreement FOREIGN KEY (agreement_id) REFERENCES agreements(agreement_id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_chats_sender FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_chats_agreement_id (agreement_id),
  INDEX idx_chats_sender_id (sender_id),
  INDEX idx_chats_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  notification_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('due','chat','expiry','invite','payment','system') NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  metadata JSON NULL,
  read_at DATETIME NULL,
  sent_via ENUM('inapp','email','both') NOT NULL DEFAULT 'inapp',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_notifications_user_id (user_id),
  INDEX idx_notifications_type (type),
  INDEX idx_notifications_read_at (read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE action_logs (
  log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action_type VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NULL,
  entity_id INT NULL,
  request_method VARCHAR(10) NOT NULL,
  request_path VARCHAR(500) NOT NULL,
  request_body JSON NULL,
  request_query JSON NULL,
  response_status INT NULL,
  response_message TEXT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  execution_time_ms INT NULL,
  error_message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_action_logs_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_action_logs_user_id (user_id),
  INDEX idx_action_logs_module (module),
  INDEX idx_action_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_logs (
  audit_log_id INT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  actor_id INT NULL,
  actor_type VARCHAR(50) NULL,
  resource VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INT NOT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  request_body TEXT NULL,
  response_body TEXT NULL,
  correlation_id VARCHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_logs_action (action),
  INDEX idx_audit_logs_actor_id (actor_id),
  INDEX idx_audit_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (user_id, email, password_hash, full_name, phone, role, tier, is_active, email_verified, refresh_token_version, created_at, updated_at)
VALUES
  (1, 'owner@beaver.rent', '$2b$12$placeholder.owner.hash', 'Demo Owner', '9876543210', 'owner', 'pro', 1, 1, 0, NOW(), NOW()),
  (2, 'tenant@beaver.rent', '$2b$12$placeholder.tenant.hash', 'Demo Tenant', '9123456780', 'tenant', 'free', 1, 1, 0, NOW(), NOW());

INSERT INTO properties (property_id, owner_id, name, type, address_line, city, state, pincode, rent_amount, deposit_amount, description, photos, is_active, created_at, updated_at)
VALUES
  (1, 1, 'Green Residency Flat 302', 'flat', 'MG Road, Pune', 'Pune', 'Maharashtra', '411001', 25000.00, 50000.00, 'Furnished 2BHK flat', JSON_ARRAY(), 1, NOW(), NOW());

INSERT INTO invites (invite_id, token, property_id, email, invited_by, used_by, status, expires_at, created_at, updated_at)
VALUES
  (1, 'demo-invite-token-beaver', 1, 'tenant@beaver.rent', 1, 2, 'used', DATE_ADD(NOW(), INTERVAL 7 DAY), NOW(), NOW());

INSERT INTO agreements (agreement_id, property_id, owner_id, tenant_id, start_date, end_date, rent_amount, deposit_amount, rent_due_day, gst_rate, status, terms, pdf_url, revoked_at, revoke_reason, created_at, updated_at)
VALUES
  (1, 1, 1, 2, '2026-03-01', '2027-02-28', 25000.00, 50000.00, 5, 18.00, 'active', JSON_OBJECT('template', 'rera-basic', 'noticePeriodDays', 30), NULL, NULL, NULL, NOW(), NOW());

INSERT INTO transactions (transaction_id, agreement_id, paid_by, type, amount, gst_amount, razorpay_order_id, razorpay_payment_id, razorpay_signature, status, due_date, paid_at, description, hash, previous_hash, created_at, updated_at)
VALUES
  (1, 1, 2, 'rent', 25000.00, 4500.00, 'order_demo_001', 'pay_demo_001', 'sig_demo_001', 'completed', '2026-03-05', NOW(), 'March rent payment', 'demo_hash_001', NULL, NOW(), NOW());

INSERT INTO chats (chat_id, agreement_id, sender_id, message, image_url, read_at, created_at, updated_at)
VALUES
  (1, 1, 2, 'Hi, I have completed the rent payment.', NULL, NULL, NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;
