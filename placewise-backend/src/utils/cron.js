const cron = require('node-cron');
const axios = require('axios');
const { SkillTaxonomy } = require('../models');
const logger = require('../utils/logger');

const AI_URL    = process.env.AI_SERVICE_URL;
const AI_SECRET = process.env.AI_SERVICE_SECRET;

/**
 * Weekly market demand refresh.
 * Runs every Monday at 02:00 AM.
 * Calls AI service for fresh demand scores and bulk-upserts SkillTaxonomy.
 */
const runMarketDemandRefresh = async () => {
  logger.info('[CRON] Starting weekly market demand refresh...');

  try {
    const response = await axios.get(`${AI_URL}/ai/skill-gap/market-signals`, {
      headers: { 'x-api-secret': AI_SECRET },
      timeout: 60000,
    });

    const signals = response.data; // [{ skill_name, demand_score, demand_trend, category }]
    if (!Array.isArray(signals) || signals.length === 0) {
      logger.warn('[CRON] Market signals returned empty array. Skipping update.');
      return;
    }

    // Bulk upsert into SkillTaxonomy
    let updated = 0;
    for (const signal of signals) {
      const [skill, created] = await SkillTaxonomy.findOrCreate({
        where: { skill_name: signal.skill_name },
        defaults: {
          skill_name:    signal.skill_name,
          category:      signal.category || 'Backend',
          market_demand: signal.demand_score,
          demand_trend:  signal.demand_trend,
        },
      });

      if (!created) {
        await skill.update({
          market_demand: signal.demand_score,
          demand_trend:  signal.demand_trend,
        });
      }
      updated++;
    }

    logger.info(`[CRON] Market demand refresh complete. Updated ${updated} skills.`);

    // Invalidate stale SkillGapReports older than 7 days
    const { SkillGapReport } = require('../models');
    const { Op } = require('sequelize');
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const deleted = await SkillGapReport.destroy({
      where: { updated_at: { [Op.lt]: cutoff } },
    });
    logger.info(`[CRON] Invalidated ${deleted} stale SkillGapReports.`);

  } catch (err) {
    logger.error('[CRON] Market demand refresh failed:', err.message);
  }
};

/**
 * Close expired job listings.
 * Runs every day at midnight.
 */
const runJobDeadlineClose = async () => {
  try {
    const { Job } = require('../models');
    const { Op } = require('sequelize');
    const count = await Job.update(
      { status: 'closed' },
      {
        where: {
          status:   'active',
          deadline: { [Op.lt]: new Date() },
        },
      }
    );
    if (count[0] > 0) {
      logger.info(`[CRON] Closed ${count[0]} expired job listings.`);
    }
  } catch (err) {
    logger.error('[CRON] Job deadline close failed:', err.message);
  }
};

/**
 * Registers all cron jobs.
 * Called once from server.js on startup.
 */
const startCronJobs = () => {
  // Weekly market demand refresh — every Monday at 02:00
  cron.schedule('0 2 * * 1', runMarketDemandRefresh, {
    timezone: 'Asia/Kolkata',
  });

  // Daily job deadline close — every day at 00:00
  cron.schedule('0 0 * * *', runJobDeadlineClose, {
    timezone: 'Asia/Kolkata',
  });

  logger.info('[CRON] Scheduled: market demand (Mon 02:00), job deadline close (daily 00:00)');
};

module.exports = { startCronJobs, runMarketDemandRefresh, runJobDeadlineClose };