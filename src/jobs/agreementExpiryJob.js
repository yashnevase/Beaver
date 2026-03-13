const cron = require('node-cron');
const { Op } = require('sequelize');
const db = require('../models');
const logger = require('../config/logger');

const runAgreementExpiry = async () => {
  try {
    const [updatedCount] = await db.Agreement.update(
      { status: 'ended', ended_at: new Date() },
      {
        where: {
          status: 'started',
          end_date: { [Op.lt]: new Date().toISOString().slice(0, 10) }
        }
      }
    );

    logger.info(`Agreement expiry job updated ${updatedCount} agreements`);
    return updatedCount;
  } catch (error) {
    logger.error('Error in agreement expiry job:', error);
    return 0;
  }
};

const startAgreementExpiryJob = () => {
  if (process.env.ENABLE_CRON !== 'true') {
    logger.info('Agreement expiry cron job is disabled');
    return null;
  }

  const schedule = process.env.AGREEMENT_EXPIRY_CRON_SCHEDULE || '0 1 * * *';
  const timezone = process.env.CRON_TIMEZONE || 'Asia/Kolkata';

  const job = cron.schedule(schedule, runAgreementExpiry, {
    scheduled: true,
    timezone
  });

  logger.info(`Agreement expiry cron job started with schedule: ${schedule} (${timezone})`);
  return job;
};

module.exports = {
  startAgreementExpiryJob,
  runAgreementExpiry
};
