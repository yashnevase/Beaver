const cron = require('node-cron');
const { Op } = require('sequelize');
const db = require('../models');
const logger = require('../config/logger');
const notificationService = require('../modules/notification/services/notificationService');

const runDuesJob = async () => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const agreements = await db.Agreement.findAll({
      where: {
        status: 'started',
        end_date: { [Op.gte]: today }
      },
      include: [
        { model: db.User, as: 'tenant', attributes: ['user_id', 'full_name', 'email'] },
        { model: db.Property, as: 'property', attributes: ['property_id', 'name'] }
      ]
    });

    let createdTransactions = 0;

    for (const agreement of agreements) {
      const dueDay = agreement.rent_due_day || 1;
      const currentDate = new Date();
      if (currentDate.getDate() !== dueDay) {
        continue;
      }

      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      const existing = await db.Transaction.findOne({
        where: {
          agreement_id: agreement.agreement_id,
          type: 'rent',
          due_date: { [Op.like]: `${monthKey}%` }
        }
      });

      if (existing) {
        continue;
      }

      const transaction = await db.Transaction.create({
        agreement_id: agreement.agreement_id,
        paid_by: agreement.tenant_id,
        type: 'rent',
        amount: agreement.rent_amount,
        gst_amount: 0,
        status: 'pending',
        due_date: today,
        description: `Monthly rent due for ${agreement.property?.name || 'property'}`
      });

      await notificationService.createNotification({
        user_id: agreement.tenant_id,
        type: 'due',
        title: 'Monthly rent due generated',
        message: `Your rent for ${agreement.property?.name || 'your property'} is now due. Please pay on time to avoid overdue reminders.`,
        metadata: {
          agreement_id: agreement.agreement_id,
          transaction_id: transaction.transaction_id,
          due_date: today
        },
        sendEmail: true
      });

      await notificationService.createNotification({
        user_id: agreement.owner_id,
        type: 'due',
        title: 'Tenant rent due generated',
        message: `A rent due has been generated for tenant ${agreement.tenant?.full_name || agreement.tenant_id} on property ${agreement.property?.name || 'property'}.`,
        metadata: {
          agreement_id: agreement.agreement_id,
          transaction_id: transaction.transaction_id,
          tenant_id: agreement.tenant_id,
          due_date: today
        },
        sendEmail: false
      });

      createdTransactions += 1;
    }

    logger.info(`Dues job created ${createdTransactions} pending rent transactions`);
    return createdTransactions;
  } catch (error) {
    logger.error('Error in dues job:', error);
    return 0;
  }
};

const startDuesJob = () => {
  if (process.env.ENABLE_CRON !== 'true') {
    logger.info('Dues cron job is disabled');
    return null;
  }

  const schedule = process.env.DUES_CRON_SCHEDULE || '0 8 * * *';
  const timezone = process.env.CRON_TIMEZONE || 'Asia/Kolkata';

  const job = cron.schedule(schedule, runDuesJob, {
    scheduled: true,
    timezone
  });

  logger.info(`Dues cron job started with schedule: ${schedule} (${timezone})`);
  return job;
};

module.exports = {
  startDuesJob,
  runDuesJob
};
