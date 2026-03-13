const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const logger = require('../../config/logger');

// Configure email transporter using environment variables

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

const commonStyles = `
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111827; margin: 0; padding: 0; background-color: #f9fafb; }
  .wrapper { background-color: #f9fafb; padding: 40px 0; width: 100%; }
  .container { max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e5e7eb; }
  .header { padding: 32px 32px 24px; text-align: left; border-bottom: 1px solid #f3f4f6; }
  .header h1 { margin: 0; font-size: 20px; font-weight: 600; color: #111827; letter-spacing: -0.01em; }
  .content { padding: 32px; color: #374151; font-size: 15px; }
  .content h2 { font-size: 16px; font-weight: 500; color: #111827; margin-top: 0; }
  .button { display: inline-block; padding: 12px 24px; background-color: #000000; color: #ffffff; font-weight: 500; font-size: 14px; text-decoration: none; border-radius: 6px; margin: 24px 0; transition: background-color 0.2s; }
  .button:hover { background-color: #374151; }
  .notice { background: #f9fafb; border-left: 3px solid #d1d5db; padding: 16px; margin: 24px 0; font-size: 14px; color: #4b5563; }
  .footer { text-align: center; padding: 32px; color: #6b7280; font-size: 13px; border-top: 1px solid #f3f4f6; background-color: #f9fafb;}
  .logo { height: 32px; width: auto; margin-bottom: 24px; display: block; }
  .otp-code { font-size: 32px; font-weight: 700; color: #111827; letter-spacing: 6px; text-align: center; padding: 24px; background: #f3f4f6; border-radius: 6px; margin: 24px 0; }
`;

const emailTemplates = {
  welcome: (data) => `
    <!DOCTYPE html>
    <html>
    <head><style>${commonStyles}</style></head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <img src="${process.env.BASE_URL}/logo.png" alt="Beaver Logo" class="logo" onerror="this.style.display='none'" />
            <h1>Welcome to Beaver</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.name},</h2>
            <p>Welcome! Your account has been successfully created with the email address <strong>${data.email}</strong>.</p>
            <p>We're thrilled to have you here. You can now access your dashboard and start managing your properties and agreements securely.</p>
            <a href="${data.loginUrl}" class="button">Go to Dashboard</a>
            <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">If you have any questions, reply to this email to get in touch with our team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Beaver. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
  
  passwordReset: (data) => `
    <!DOCTYPE html>
    <html>
    <head><style>${commonStyles}</style></head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <img src="${process.env.BASE_URL}/logo.png" alt="Beaver Logo" class="logo" onerror="this.style.display='none'" />
            <h1>Reset your password</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.name},</h2>
            <p>We received a request to reset the password for your account. Click the button below to proceed.</p>
            <a href="${data.resetUrl}" class="button">Reset Password</a>
            <div class="notice">
              This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Beaver. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
  
  otp: (data) => `
    <!DOCTYPE html>
    <html>
    <head><style>${commonStyles}</style></head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <img src="${process.env.BASE_URL}/logo.png" alt="Beaver Logo" class="logo" onerror="this.style.display='none'" />
            <h1>Your secure authentication code</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.name},</h2>
            <p>Please enter the following verification code to complete your login securely. This code will expire in ${data.expiryMinutes} minutes.</p>
            <div class="otp-code">${data.otp}</div>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, no further action is required.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Beaver. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `,
  
  notification: (data) => `
    <!DOCTYPE html>
    <html>
    <head><style>${commonStyles}</style></head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <img src="${process.env.BASE_URL}/logo.png" alt="Beaver Logo" class="logo" onerror="this.style.display='none'" />
            <h1>${data.title}</h1>
          </div>
          <div class="content">
            <h2>Hi ${data.name},</h2>
            <p>${data.message}</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Beaver. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
};

const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    const smtpEnabled = process.env.ENABLE_SMTP !== 'false';

    if (!smtpEnabled) {
      logger.info(`[SMTP DISABLED] Email would be sent to ${to}: ${subject}`);
      logger.info(`[SMTP DISABLED] Email content logged to console`);
      console.log('\n=== EMAIL CONTENT (SMTP DISABLED) ===');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`HTML: ${html.substring(0, 200)}...`);
      console.log('=====================================\n');
      
      return { 
        success: true, 
        messageId: 'dev-mode-' + Date.now(),
        smtpDisabled: true 
      };
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      attachments
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    logger.info(`Email sent to ${to}: ${subject} (${info.messageId})`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);

    if ((process.env.NODE_ENV || 'development') !== 'production') {
      logger.warn(`[SMTP FALLBACK] Continuing without email delivery for ${to}: ${subject}`);
      return {
        success: true,
        messageId: 'fallback-' + Date.now(),
        smtpDisabled: true,
        deliveryFailed: true
      };
    }

    throw error;
  }
};

const sendWelcomeEmail = async (user, loginUrl) => {
  const html = emailTemplates.welcome({
    name: user.full_name,
    email: user.email,
    loginUrl: loginUrl || process.env.FRONTEND_URL || 'http://localhost:3000'
  });
  
  return await sendEmail(user.email, 'Welcome to Our Platform!', html);
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const html = emailTemplates.passwordReset({
    name: user.full_name,
    resetUrl
  });
  
  return await sendEmail(user.email, 'Password Reset Request', html);
};

const sendOTPEmail = async (user, otp, expiryMinutes = 5) => {
  const html = emailTemplates.otp({
    name: user.full_name,
    otp,
    expiryMinutes
  });
  
  const result = await sendEmail(user.email, 'Your Verification Code', html);
  
  if (result.smtpDisabled) {
    result.otp = otp;
  }
  
  return result;
};

const sendNotificationEmail = async (user, title, message) => {
  const html = emailTemplates.notification({
    name: user.full_name,
    title,
    message
  });
  
  return await sendEmail(user.email, title, html);
};

const sendBulkEmail = async (recipients, subject, html) => {
  const promises = recipients.map(recipient => 
    sendEmail(recipient, subject, html).catch(err => ({
      email: recipient,
      error: err.message
    }))
  );
  
  const results = await Promise.all(promises);
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => r.error);
  
  logger.info(`Bulk email sent: ${successful} successful, ${failed.length} failed`);
  
  return { successful, failed };
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOTPEmail,
  sendNotificationEmail,
  sendBulkEmail,
  emailTemplates
};
