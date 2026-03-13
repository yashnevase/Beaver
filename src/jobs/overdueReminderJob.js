const cron = require('node-cron');
const { Op } = require('sequelize');
const db = require('../models');
const logger = require('../config/logger');
const notificationService = require('../modules/notification/services/notificationService');

const runOverdueReminderJob = async () => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const overdueTransactions = await db.Transaction.findAll({
      where: {
        type: 'rent',
        status: 'pending',
        due_date: { [Op.lt]: today }
      },
      include: [{
        model: db.Agreement,
        as: 'agreement',
        include: [
          { model: db.Property, as: 'property', attributes: ['property_id', 'name'] },
          { model: db.User, as: 'owner', attributes: ['user_id', 'full_name', 'email'] },
          { model: db.User, as: 'tenant', attributes: ['user_id', 'full_name', 'email'] }
        ]
      }]
    });

    let reminderCount = 0;

    for (const transaction of overdueTransactions) {
      const agreement = transaction.agreement;
      if (!agreement) {
        continue;
      }

      await notificationService.createNotification({
        user_id: agreement.tenant_id,
        type: 'due',
        title: 'Rent payment is overdue',
        message: `Your rent payment for ${agreement.property?.name || 'your property'} is overdue since ${transaction.due_date}. Please pay immediately.`,
        metadata: {
          agreement_id: agreement.agreement_id,
          transaction_id: transaction.transaction_id,
          due_date: transaction.due_date,
          amount: transaction.amount
        },
        sendEmail: true
      });

      await notificationService.createNotification({
        user_id: agreement.owner_id,
        type: 'due',
        title: 'Tenant rent is overdue',
        message: `Tenant ${agreement.tenant?.full_name || agreement.tenant_id} has an overdue rent payment for ${agreement.property?.name || 'property'}.`,
        metadata: {
          agreement_id: agreement.agreement_id,
          transaction_id: transaction.transaction_id,
          tenant_id: agreement.tenant_id,
          due_date: transaction.due_date,
          amount: transaction.amount
        },
        sendEmail: false
      });

      reminderCount += 1;
    }

    logger.info(`Overdue reminder job sent ${reminderCount} reminder set(s)`);
    return reminderCount;
  } catch (error) {
    logger.error('Error in overdue reminder job:', error);
    return 0;
  }
};

const startOverdueReminderJob = () => {
  if (process.env.ENABLE_CRON !== 'true') {
    logger.info('Overdue reminder cron job is disabled');
    return null;
  }

  const schedule = process.env.OVERDUE_REMINDER_CRON_SCHEDULE || '0 9 * * *';
  const timezone = process.env.CRON_TIMEZONE || 'Asia/Kolkata';

  const job = cron.schedule(schedule, runOverdueReminderJob, {
    scheduled: true,
    timezone
  });

  logger.info(`Overdue reminder cron job started with schedule: ${schedule} (${timezone})`);
  return job;
};

module.exports = {
  startOverdueReminderJob,
  runOverdueReminderJob
};
