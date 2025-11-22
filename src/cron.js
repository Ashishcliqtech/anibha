const cron = require('node-cron');
const axios = require('axios');
const logger = require('./utils/logger');

const setupCronJobs = () => {
  cron.schedule('*/13 * * * *', async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/v1/health');
      logger.info('Health check successful:', response.data);
    } catch (error) {
      logger.error('Health check failed:', error.message);
    }
  });
};

module.exports = setupCronJobs;
