const placementService = require('../services/placement.service');
const { success, paginated } = require('../utils/response');
const { getPaginationParams } = require('../utils/paginate');

const getStats = async (req, res, next) => {
  try {
    const stats = await placementService.getStats();
    return success(res, 200, 'Placement statistics retrieved.', stats);
  } catch (err) { next(err); }
};

const getRecords = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query);
    const { rows, pagination: meta } = await placementService.getRecords(req.query, pagination);
    return paginated(res, rows, meta, 'Placement records retrieved.');
  } catch (err) { next(err); }
};

const getPendingCompanies = async (req, res, next) => {
  try {
    const companies = await placementService.getPendingCompanies();
    return success(res, 200, `${companies.length} pending approvals.`, companies);
  } catch (err) { next(err); }
};

const approveCompany = async (req, res, next) => {
  try {
    const updated = await placementService.approveCompany(
      req.params.recruiterId,
      req.user.userId
    );
    return success(res, 200, 'Company approved successfully.', updated);
  } catch (err) { next(err); }
};

module.exports = { getStats, getRecords, getPendingCompanies, approveCompany };