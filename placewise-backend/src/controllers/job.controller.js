const jobService = require('../services/job.service');
const { success, paginated } = require('../utils/response');
const { getPaginationParams } = require('../utils/paginate');

const listJobs = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query)
    // Pass req.user so the service knows whether to show draft jobs
    const { rows, pagination: meta } = await jobService.listJobs(
      req.query,
      pagination,
      req.user  
    )
    return paginated(res, rows, meta, 'Jobs retrieved.')
  } catch (err) { next(err) }
}

const getJob = async (req, res, next) => {
  try {
    const job = await jobService.getJob(req.params.id);
    return success(res, 200, 'Job retrieved.', job);
  } catch (err) { next(err); }
};

const createJob = async (req, res, next) => {
  try {
    const job = await jobService.createJob(req.user.userId, req.body);
    return success(res, 201, 'Job created successfully as draft.', job);
  } catch (err) { next(err); }
};

const updateJob = async (req, res, next) => {
  try {
    const { old, updated } = await jobService.updateJob(req.params.id, req.body, req.user);
    req.auditOldValue = old;
    return success(res, 200, 'Job updated.', updated);
  } catch (err) { next(err); }
};

const getApplicants = async (req, res, next) => {
  try {
    const applicants = await jobService.getApplicants(req.params.id, req.user);
    return success(res, 200, `${applicants.length} applicants retrieved.`, applicants);
  } catch (err) { next(err); }
};

const getMyJobs = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query);
    const { rows, pagination: meta } = await jobService.getRecruiterJobs(
      req.user.userId,
      req.query,
      pagination
    );
    return paginated(res, rows, meta, 'Your jobs retrieved.');
  } catch (err) { next(err); }
};

module.exports = { listJobs, getJob, createJob, updateJob, getApplicants, getMyJobs };