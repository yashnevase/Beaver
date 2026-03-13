const { startCleanupJob } = require('./cleanupJob');
const { startDuesJob } = require('./duesJob');
const { startAgreementExpiryJob } = require('./agreementExpiryJob');
const { startOverdueReminderJob } = require('./overdueReminderJob');
const logger = require('../config/logger');

const startAllJobs = () => {
  logger.info('Initializing cron jobs...');

  const jobs = {
    cleanup: startCleanupJob(),
    dues: startDuesJob(),
    agreementExpiry: startAgreementExpiryJob(),
    overdueReminder: startOverdueReminderJob()
  };

  const activeJobs = Object.entries(jobs)
    .filter(([, job]) => job !== null)
    .map(([name]) => name);

  logger.info(`Active cron jobs: ${activeJobs.join(', ') || 'none'}`);

  return jobs;
};

module.exports = {
  startAllJobs
};
