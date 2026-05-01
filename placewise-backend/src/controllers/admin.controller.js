const adminService = require('../services/admin.service');
const { success, paginated } = require('../utils/response');
const { getPaginationParams } = require('../utils/paginate');

const listUsers = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query);
    const { rows, pagination: meta } = await adminService.listUsers(req.query, pagination);
    return paginated(res, rows, meta, 'Users retrieved.');
  } catch (err) { next(err); }
};

const setUserActive = async (req, res, next) => {
  try {
    const updated = await adminService.setUserActive(
      req.params.id,
      req.body.is_active,
      req.user.userId
    );
    return success(res, 200, `User ${req.body.is_active ? 'activated' : 'suspended'}.`, updated);
  } catch (err) { next(err); }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query);
    const { rows, pagination: meta } = await adminService.getAuditLogs(req.query, pagination);
    return paginated(res, rows, meta, 'Audit logs retrieved.');
  } catch (err) { next(err); }
};

const upsertSkill = async (req, res, next) => {
  try {
    const skill = await adminService.upsertSkill(req.body);
    return success(res, 200, 'Skill saved to taxonomy.', skill);
  } catch (err) { next(err); }
};

const deleteSkill = async (req, res, next) => {
  try {
    await adminService.deleteSkill(req.params.id);
    return success(res, 200, 'Skill deleted from taxonomy.');
  } catch (err) { next(err); }
};

const getSkillTaxonomy = async (req, res, next) => {
  try {
    const pagination = getPaginationParams(req.query);
    const { rows, pagination: meta } = await adminService.getSkillTaxonomy(req.query, pagination);
    return paginated(res, rows, meta, 'Skill taxonomy retrieved.');
  } catch (err) { next(err); }
};

module.exports = {
  listUsers,
  setUserActive,
  getAuditLogs,
  upsertSkill,
  deleteSkill,
  getSkillTaxonomy,
};