const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Beaver Rental API',
      version: '1.0.0',
      description: 'India-specific rental SaaS backend for owner-tenant property management',
      contact: {
        name: 'Beaver API Support',
        email: 'support@beaver.rent'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Local development'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            user_id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'owner@beaver.rent' },
            full_name: { type: 'string', example: 'Yash Owner' },
            phone: { type: 'string', example: '9876543210', nullable: true },
            role: { type: 'string', enum: ['owner', 'tenant', 'admin'] },
            tier: { type: 'string', enum: ['free', 'pro'] },
            is_active: { type: 'boolean', example: true },
            email_verified: { type: 'boolean', example: true }
          }
        },
        Property: {
          type: 'object',
          properties: {
            property_id: { type: 'integer', example: 1 },
            owner_id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Green Residency Flat 302' },
            type: { type: 'string', enum: ['house', 'flat', 'shop', 'land'] },
            address_line: { type: 'string', example: 'MG Road, Pune' },
            city: { type: 'string', example: 'Pune' },
            state: { type: 'string', example: 'Maharashtra' },
            pincode: { type: 'string', example: '411001' },
            rent_amount: { type: 'number', example: 25000 },
            deposit_amount: { type: 'number', example: 50000 }
          }
        },
        Agreement: {
          type: 'object',
          properties: {
            agreement_id: { type: 'integer', example: 1 },
            property_id: { type: 'integer', example: 1 },
            owner_id: { type: 'integer', example: 1 },
            tenant_id: { type: 'integer', example: 2 },
            start_date: { type: 'string', format: 'date' },
            end_date: { type: 'string', format: 'date' },
            rent_amount: { type: 'number', example: 25000 },
            deposit_amount: { type: 'number', example: 50000 },
            status: { type: 'string', enum: ['draft', 'active', 'expired', 'revoked'] }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            transaction_id: { type: 'integer', example: 1 },
            agreement_id: { type: 'integer', example: 1 },
            type: { type: 'string', enum: ['rent', 'deposit', 'expense', 'refund'] },
            amount: { type: 'number', example: 25000 },
            gst_amount: { type: 'number', example: 4500 },
            status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
            razorpay_order_id: { type: 'string', nullable: true },
            razorpay_payment_id: { type: 'string', nullable: true },
            hash: { type: 'string', nullable: true }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            notification_id: { type: 'integer', example: 1 },
            user_id: { type: 'integer', example: 2 },
            type: { type: 'string', enum: ['due', 'chat', 'expiry', 'invite', 'payment', 'system'] },
            title: { type: 'string', example: 'Rent Due Reminder' },
            message: { type: 'string', example: 'Your rent is due today.' },
            read_at: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Validation failed' },
            correlationId: { type: 'string', example: 'uuid-value' }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' }
            }
          }
        },
        ForbiddenError: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: [
    './src/routes/*.js',
    './src/modules/*/routes/*.js'
  ]
};

const specs = swaggerJsdoc(options);

const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Beaver API Docs'
};

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions
};
