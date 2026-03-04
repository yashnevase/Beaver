# Express Production Starter 🚀

**Production-ready Express.js backend boilerplate** with enterprise-grade security, RBAC, caching, and scalability built-in.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-blue)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-blue)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## ⚡ Quick Start

### Option 1: Use CLI (Recommended)

```bash
npx exnj my-backend
cd my-backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run migrate
npm run dev
```

### Option 2: Clone & Install

```bash
git clone https://github.com/yashnevase/express-backend-boilerplate.git my-backend
cd my-backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run migrate
npm run dev
```

## 🎯 What's Included

### ✅ **Security (Enterprise-Grade)**
- **JWT Authentication** with configurable expiry
- **RBAC** (Role-Based Access Control) with granular permissions
- **CSP** (Content Security Policy) with nonce-based inline script protection
- **CSRF** protection (cookie-based double-submit pattern)
- **Rate Limiting** (per-IP and per-user)
- **Input Sanitization** (XSS and NoSQL injection prevention)
- **Bcrypt** password hashing (12 rounds)
- **Audit Logging** for sensitive operations
- **Helmet** security headers
- **CORS** with strict origin validation

### ✅ **Scalability**
- **Cluster Mode** with worker processes
- **Connection Pooling** (configurable per environment)
- **In-memory Cache** (Redis-ready)
- **Graceful Shutdown** (30s timeout)
- **Auto-restart** dead workers
- **Health Checks** endpoint

### ✅ **Observability**
- **Winston Logger** with file rotation
- **Request Correlation IDs** (UUID v4)
- **Slow Query Detection** (>500ms)
- **System Health Monitoring**
- **Structured Logging** (JSON format)
- **Error Tracking** with stack traces

### ✅ **Developer Experience**
- **Clean Architecture** (MVC + Service Layer)
- **Separation of Concerns**
- **Reusable Utilities**
- **Standardized API Responses**
- **Centralized Error Handling**
- **Hot Reload** (nodemon)
- **Sample CRUD** operations included

### ✅ **Database**
- **Sequelize ORM** (PostgreSQL)
- **Migrations** support
- **Model Associations** examples
- **Query Optimization** patterns
- **Transaction Support**

## 📁 Project Structure

```
my-backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── db.js            # Database connection & pooling
│   │   ├── logger.js        # Winston logger setup
│   │   ├── security.js      # JWT, bcrypt, CSP, sanitization
│   │   └── rateLimiters.js  # Rate limiting configs
│   │
│   ├── constants/           # Application constants
│   │   ├── index.js
│   │   ├── permissions.js   # RBAC permissions
│   │   ├── roles.js         # User roles
│   │   └── httpStatus.js    # HTTP status codes
│   │
│   ├── middleware/          # Express middleware
│   │   ├── auth.js          # JWT authentication & RBAC
│   │   ├── errorHandler.js  # Centralized error handling
│   │   ├── validate.js      # Joi validation
│   │   ├── auditLog.js      # Audit logging
│   │   └── initMiddleware.js # Global middleware setup
│   │
│   ├── routes/              # API route definitions
│   │   ├── auth.js          # Authentication routes
│   │   ├── users.js         # User CRUD (example)
│   │   └── index.js         # Route aggregator
│   │
│   ├── services/            # Business logic layer
│   │   ├── authService.js   # Authentication logic
│   │   ├── userService.js   # User operations (example)
│   │   └── emailService.js  # Email sending (example)
│   │
│   ├── models/              # Sequelize models
│   │   ├── index.js         # Model associations
│   │   ├── User.js          # User model (example)
│   │   └── AuditLog.js      # Audit log model
│   │
│   ├── utils/               # Utility functions
│   │   ├── ApiResponse.js   # Standardized responses
│   │   ├── cache.js         # Caching abstraction
│   │   ├── fileUpload.js    # File upload handling
│   │   └── validators.js    # Custom validators
│   │
│   ├── migrations/          # Database migrations
│   ├── seeders/             # Database seeders
│   ├── app.js               # Express app configuration
│   └── server.js            # Server entry point (cluster mode)
│
├── tests/                   # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── logs/                    # Application logs
├── uploads/                 # User uploads
├── .env.example             # Environment template
├── .gitignore
├── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

```bash
# Server
NODE_ENV=development
PORT=3001
ENABLE_CLUSTER=false
WORKERS=4

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false

# Security
JWT_SECRET=your-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Features (true/false)
ENABLE_CSP=true
ENABLE_CORS=true
ENABLE_CSRF=false
ENABLE_SECURITY_MW=true
ENABLE_RATE_LIMIT=true
ENABLE_CRON=true
ENABLE_SLOW_QUERY_LOG=true

# Rate Limiting
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX=200
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=10

# Frontend
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging
LOG_LEVEL=info
```

## 🚀 Usage Examples

### 1. Authentication

```javascript
// Register
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}

// Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

// Response
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "user_id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "USER"
    }
  }
}
```

### 2. Protected Routes

```javascript
// Get user profile (requires authentication)
GET /api/users/profile
Headers: {
  "Authorization": "Bearer <token>"
}

// Admin-only route (requires permission)
GET /api/admin/users
Headers: {
  "Authorization": "Bearer <admin-token>"
}
```

### 3. Creating New Routes

```javascript
// src/routes/products.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requirePermission } = require('../middleware/auth');
const productService = require('../services/productService');
const ApiResponse = require('../utils/ApiResponse');

// Public route
router.get('/', async (req, res, next) => {
  try {
    const products = await productService.getAll(req.query);
    return ApiResponse.success(res, products);
  } catch (error) {
    next(error);
  }
});

// Protected route
router.post('/',
  authenticateToken,
  requirePermission('products.create'),
  async (req, res, next) => {
    try {
      const product = await productService.create(req.body);
      return ApiResponse.created(res, product);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
```

### 4. Creating Services

```javascript
// src/services/productService.js
const db = require('../models');
const cache = require('../utils/cache');
const { ApiError } = require('../middleware/errorHandler');

const getAll = async (filters = {}) => {
  const cacheKey = `products:${JSON.stringify(filters)}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;
  
  const products = await db.Product.findAll({
    where: filters,
    order: [['created_at', 'DESC']]
  });
  
  await cache.set(cacheKey, products, 300);
  return products;
};

const create = async (data) => {
  const product = await db.Product.create(data);
  await cache.clear('products:*');
  return product;
};

module.exports = { getAll, create };
```

### 5. Adding RBAC Permissions

```javascript
// src/constants/permissions.js
const PERMISSIONS = {
  // Products
  'products.view': 'View products',
  'products.create': 'Create products',
  'products.update': 'Update products',
  'products.delete': 'Delete products',
  
  // Add your permissions here
};

const ROLES = {
  ADMIN: {
    name: 'Admin',
    permissions: Object.keys(PERMISSIONS)
  },
  MANAGER: {
    name: 'Manager',
    permissions: [
      'products.view',
      'products.create',
      'products.update'
    ]
  },
  USER: {
    name: 'User',
    permissions: ['products.view']
  }
};
```

## 📊 Performance Benchmarks

### Current Capacity (8 cores, 16GB RAM, 6 workers)

| Metric | Capacity |
|--------|----------|
| Concurrent Requests | 3,000-5,000 |
| Throughput | ~10,000 req/min |
| DB Connections | 720 (120×6 workers) |
| Concurrent Users | 1,000-2,000 |
| API Response Time (p95) | <200ms |

## 🔒 Security Features

### OWASP Top 10 Coverage

| Threat | Status | Mitigation |
|--------|--------|-----------|
| A01: Broken Access Control | ✅ | RBAC, JWT, permissions |
| A02: Cryptographic Failures | ✅ | bcrypt, HTTPS, secure cookies |
| A03: Injection | ✅ | Parameterized queries, sanitization |
| A04: Insecure Design | ✅ | Security by design |
| A05: Security Misconfiguration | ✅ | Helmet, CSP, secure defaults |
| A06: Vulnerable Components | ⚠️ | Manual npm audit |
| A07: Auth Failures | ✅ | Rate limiting, strong passwords |
| A08: Data Integrity | ✅ | Audit logs, checksums |
| A09: Logging Failures | ✅ | Comprehensive logging |
| A10: SSRF | ⚠️ | Partial (URL validation) |

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# With coverage
npm test -- --coverage
```

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong `JWT_SECRET` (32+ chars)
- [ ] Configure production database
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Enable cluster mode (`ENABLE_CLUSTER=true`)
- [ ] Set up process manager (PM2)
- [ ] Configure log rotation
- [ ] Set up monitoring (APM)
- [ ] Configure backups
- [ ] Run security audit (`npm audit`)

### PM2 Deployment

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start src/server.js -i max --name "backend"

# Save PM2 config
pm2 save

# Setup PM2 startup
pm2 startup

# Monitor
pm2 monit

# Logs
pm2 logs backend
```

## Documentation

- [Quick Start Guide](docs/QUICK_START.md)
- [API Documentation](docs/API.md)
- [Code Examples](docs/EXAMPLES.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Swagger Guide](docs/SWAGGER_GUIDE.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)

## Contributing

Contributions are welcome! Please read the [Contributing Guide](./docs/CONTRIBUTING.md).

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Author

Created by [Yash Nevase](https://yashnevase-website.vercel.app) - Contact: yashnevase2727@gmail.com

## 🙏 Acknowledgments

Built with industry best practices and production-grade patterns suitable for:
- ✅ Government Applications
- ✅ Enterprise ERP/HRM/CRM Systems
- ✅ Large-scale SaaS Platforms
- ✅ Financial Applications
- ✅ Healthcare Systems
- ✅ E-commerce Platforms

## 📞 Support

- Documentation: [docs/](./docs)
- Issues: [GitHub Issues](https://github.com/your-org/express-production-starter/issues)
- Discussions: [GitHub Discussions](https://github.com/your-org/express-production-starter/discussions)

---

**Made with ❤️ for production-ready backends**
