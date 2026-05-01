const studentService = require('../services/student.service');
const { success, paginated } = require('../utils/response');
const { getPaginationParams } = require('../utils/paginate');

const getProfile = async (req, res, next) => {
  try {
    const profile = await studentService.getProfile(req.params.id, req.user.role);
    return success(res, 200, 'Profile retrieved.', profile);
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    req.auditOldValue = await studentService.getProfile(req.params.id, 'owner');
    const updated = await studentService.updateProfile(req.params.id, req.body);
    return success(res, 200, 'Profile updated.', updated);
  } catch (err) { next(err); }
};

const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      const { error } = require('../utils/response');
      return error(res, 400, 'No file uploaded. Please attach a PDF resume.');
    }
    const result = await studentService.uploadResume(
      req.params.id,
      req.file.buffer,
      req.file.originalname
    );
    return success(res, 200, `Resume uploaded. ${result.skills_extracted} skills extracted.`, result);
  } catch (err) { next(err); }
};

const listStudents = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query);
    const { rows, pagination: meta } = await studentService.listStudents(req.query, pagination);
    return paginated(res, rows, meta, 'Students retrieved.');
  } catch (err) { next(err); }
};

const verifyStudent = async (req, res, next) => {
  try {
    const updated = await studentService.verifyStudent(req.params.id, req.user.userId);
    return success(res, 200, 'Student profile verified.', updated);
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile, uploadResume, listStudents, verifyStudent };