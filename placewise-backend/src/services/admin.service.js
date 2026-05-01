const { Op } = require('sequelize');
const { User, Student, Recruiter, AuditLog, SkillTaxonomy, PlacementOfficer } = require('../models');
const { paginate } = require('../utils/paginate');
const { v4: uuidv4 } = require('uuid');

const createAppError = (msg, code) => {
  const e = new Error(msg); e.statusCode = code; return e;
};

/**
 * List all users with filters.
 */
const listUsers = async (filters, pagination) => {
  const where = {};
  if (filters.role)      where.role      = filters.role;
  if (filters.is_active !== undefined) where.is_active = filters.is_active;

  return paginate(User, {
    where,
    attributes: { exclude: ['password_hash', 'refresh_token', 'email_verification_token', 'password_reset_token'] },
    order: [['created_at', 'DESC']],
  }, pagination);
};

/**
 * Suspend or reactivate a user account.
 */
const setUserActive = async (userId, isActive, adminUserId) => {
  if (userId === adminUserId) throw createAppError('You cannot suspend your own account.', 400);
  const user = await User.findByPk(userId);
  if (!user) throw createAppError('User not found.', 404);
  await user.update({ is_active: isActive });
  return user.reload({ attributes: { exclude: ['password_hash', 'refresh_token'] } });
};

/**
 * Get paginated audit logs with filters.
 */
const getAuditLogs = async (filters, pagination) => {
  const where = {};
  if (filters.user_id) where.user_id = filters.user_id;
  if (filters.entity)  where.entity  = filters.entity;
  if (filters.action)  where.action  = filters.action;
  if (filters.from && filters.to) {
    where.created_at = {
      [Op.between]: [new Date(filters.from), new Date(filters.to)],
    };
  } else if (filters.from) {
    where.created_at = { [Op.gte]: new Date(filters.from) };
  }

  return paginate(AuditLog, {
    where,
    include: [{
      model: User,
      as: 'user',
      attributes: ['email', 'role'],
      required: false,
    }],
    order: [['created_at', 'DESC']],
  }, pagination);
};

/**
 * Upsert a skill in the SkillTaxonomy table.
 */
const upsertSkill = async (skillData) => {
  const [skill, created] = await SkillTaxonomy.findOrCreate({
    where: { skill_name: skillData.skill_name },
    defaults: { id: uuidv4(), ...skillData },
  });

  if (!created) await skill.update(skillData);
  return skill.reload();
};

/**
 * Delete a skill from taxonomy.
 */
const deleteSkill = async (skillId) => {
  const skill = await SkillTaxonomy.findByPk(skillId);
  if (!skill) throw createAppError('Skill not found.', 404);
  await skill.destroy();
};

/**
 * Get all skills in taxonomy, filterable by category.
 */
const getSkillTaxonomy = async (filters, pagination) => {
  const where = {};
  if (filters.category) where.category = filters.category;

  return paginate(SkillTaxonomy, {
    where,
    order: [['market_demand', 'DESC']],
  }, pagination);
};

module.exports = { listUsers, setUserActive, getAuditLogs, upsertSkill, deleteSkill, getSkillTaxonomy };