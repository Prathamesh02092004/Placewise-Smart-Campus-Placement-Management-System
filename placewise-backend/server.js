// Step 1: Load .env FIRST, before any other require
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const http = require('http');
const app = require('./src/app');
const { initSocket } = require('./src/sockets');
const { sequelize } = require('./src/models');
const logger = require('./src/utils/logger');
const { startCronJobs } = require('./src/utils/cron');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

initSocket(server);

(async () => {
  try {
    await sequelize.authenticate();
    logger.info('MySQL connection established successfully.');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      logger.info('Sequelize models synced.');
    }

    startCronJobs();
    logger.info('Cron jobs started.');

    server.listen(PORT, () => {
      logger.info(`PlaceWise backend running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
})();

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});