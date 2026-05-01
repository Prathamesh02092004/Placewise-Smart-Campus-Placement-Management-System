const applicationService = require('../services/application.service');
const { success, paginated, error } = require('../utils/response');
const { getPaginationParams } = require('../utils/paginate');

const apply = async (req, res, next) => {
  try {
    const application = await applicationService.apply(req.user.userId, req.body.job_id);
    return success(res, 201, 'Application submitted successfully.', application);
  } catch (err) { next(err); }
};

const getMyApplications = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query);
    const { rows, pagination: meta } = await applicationService.getMyApplications(req.user.userId, pagination);
    return paginated(res, rows, meta, 'Applications retrieved.');
  } catch (err) { next(err); }
};

const getApplication = async (req, res, next) => {
  try {
    const application = await applicationService.getApplication(req.params.id, req.user);
    return success(res, 200, 'Application retrieved.', application);
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    req.auditOldValue = { status: req.body._oldStatus };
    const updated = await applicationService.updateStatus(req.params.id, req.body.status, req.user);
    return success(res, 200, 'Application status updated.', updated);
  } catch (err) { next(err); }
};

const uploadOfferLetter = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 400, 'No file uploaded.');
    const result = await applicationService.uploadOfferLetter(
      req.params.id,
      req.file.buffer,
      req.file.originalname,
      req.user.userId
    );
    return success(res, 200, 'Offer letter uploaded.', result);
  } catch (err) { next(err); }
};

module.exports = { apply, getMyApplications, getApplication, updateStatus, uploadOfferLetter };