const interviewService = require('../services/interview.service');
const { success } = require('../utils/response');

const scheduleInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.scheduleInterview(
      req.body.application_id,
      req.body,
      req.user.userId
    );
    return success(res, 201, 'Interview scheduled successfully.', interview);
  } catch (err) { next(err); }
};

const updateInterview = async (req, res, next) => {
  try {
    const updated = await interviewService.updateInterview(req.params.id, req.body, req.user.userId);
    return success(res, 200, 'Interview updated.', updated);
  } catch (err) { next(err); }
};

const getInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.getInterview(req.params.applicationId);
    return success(res, 200, 'Interview retrieved.', interview);
  } catch (err) { next(err); }
};

module.exports = { scheduleInterview, updateInterview, getInterview };