const skillGapService = require('../services/skillGap.service');
const { success } = require('../utils/response');

const analyzeGap = async (req, res, next) => {
  try {
    const report = await skillGapService.analyzeGap(req.user.userId, req.params.jobId);
    return success(res, 200, 'Skill gap analysis complete.', report);
  } catch (err) { next(err); }
};

const getMarketTrends = async (req, res, next) => {
  try {
    const trends = await skillGapService.getMarketTrends(req.params.roleCategory);
    return success(res, 200, 'Market trends retrieved.', trends);
  } catch (err) { next(err); }
};

const getLearningPath = async (req, res, next) => {
  try {
    const path = await skillGapService.getLearningPath(req.user.userId, req.params.jobId);
    return success(res, 200, 'Learning path retrieved.', path);
  } catch (err) { next(err); }
};

const batchAnalyze = async (req, res, next) => {
  try {
    const results = await skillGapService.batchAnalyze(req.params.jobId);
    return success(res, 200, `Batch analysis complete for ${results.length} applicants.`, results);
  } catch (err) { next(err); }
};

module.exports = { analyzeGap, getMarketTrends, getLearningPath, batchAnalyze };