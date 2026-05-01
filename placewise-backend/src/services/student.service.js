const { Student, User, Application, SkillGapReport } = require('../models');
const { uploadFile, deleteFile } = require('../config/storage');
const axios = require('axios');
const { paginate } = require('../utils/paginate');
const logger = require('../utils/logger');

const AI_URL    = process.env.AI_SERVICE_URL;
const AI_SECRET = process.env.AI_SERVICE_SECRET;

const createAppError = (msg, code) => {
  const e = new Error(msg); e.statusCode = code; return e;
};

/**
 * Get a student's full profile.
 * If the requesting user is the student themselves — return full data.
 * If recruiter — return a redacted version (no phone, no internal flags).
 */
const getProfile = async (studentId, requestingRole) => {
  const student = await Student.findByPk(studentId, {
    include: [{ model: User, as: 'user', attributes: ['email', 'created_at'] }],
  });
  if (!student) throw createAppError('Student not found.', 404);

  if (requestingRole === 'recruiter') {
    // Return only publicly relevant fields
    const { id, name, cgpa, branch, year_of_study, skills, projects,
            certifications, internships, resume_url } = student;
    return { id, name, cgpa, branch, year_of_study, skills, projects,
             certifications, internships, resume_url };
  }

  return student;
};

/**
 * Update a student's editable profile fields.
 */
const updateProfile = async (studentId, updates) => {
  const student = await Student.findByPk(studentId);
  if (!student) throw createAppError('Student not found.', 404);

  const allowedFields = [
    'name', 'phone', 'cgpa', 'branch', 'year_of_study',
    'backlogs', 'skills', 'internships', 'projects', 'certifications',
  ];

  const safeUpdates = {};
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) safeUpdates[field] = updates[field];
  });

  // Check profile completeness
  const updated = { ...student.dataValues, ...safeUpdates };
  const isComplete = !!(updated.name && updated.cgpa && updated.branch && updated.year_of_study);
  safeUpdates.profile_complete = isComplete;

  await student.update(safeUpdates);
  return student.reload();
};

/**
 * Handle resume upload:
 * 1. Forward PDF buffer to AI service for parsing
 * 2. Save file to local disk
 * 3. Update student skills and resume_url
 */
const uploadResume = async (studentId, fileBuffer, originalName) => {
  const student = await Student.findByPk(studentId);
  if (!student) throw createAppError('Student not found.', 404);

  // Step 1: AI parse
  let parsedSkills = [];
  try {
    const formData = new (require('form-data'))();
    formData.append('resume', fileBuffer, {
      filename: originalName,
      contentType: 'application/pdf',
    });

    const aiResponse = await axios.post(`${AI_URL}/ai/resume/parse`, formData, {
      headers: {
        ...formData.getHeaders(),
        'x-api-secret': AI_SECRET,
      },
      timeout: 30000,
    });

    parsedSkills = aiResponse.data?.skills || [];
    logger.info(`Resume parsed for student ${studentId}: ${parsedSkills.length} skills extracted`);
  } catch (err) {
    logger.warn(`AI resume parse failed for student ${studentId}:`, err.message);
    // Continue — save file even if AI parsing fails
  }

  // Step 2: Save to local disk
  const fileUrl = await uploadFile(fileBuffer, originalName);

  // Delete old resume if it exists
  if (student.resume_url) {
    deleteFile(student.resume_url).catch(() => {});
  }

  // Step 3: Update student record
  await student.update({
    resume_url: fileUrl,
    skills: parsedSkills,
  });

  return {
    resume_url: fileUrl,
    skills_extracted: parsedSkills.length,
    skills: parsedSkills,
  };
};

/**
 * Get paginated list of all students (placement officer / admin only).
 */
const listStudents = async (filters, pagination) => {
  const where = {};
  if (filters.branch)       where.branch       = filters.branch;
  if (filters.year_of_study) where.year_of_study = parseInt(filters.year_of_study);
  // is_verified comes in as string from query params — convert properly
  if (filters.is_verified !== undefined && filters.is_verified !== '') {
    where.is_verified = filters.is_verified === 'true' || filters.is_verified === true;
  }

  return paginate(Student, {
    where,
    include: [{
      model: User,
      as: 'user',
      attributes: ['email', 'is_active', 'created_at'],
    }],
    order: [['created_at', 'DESC']],
  }, pagination);
};

/**
 * Verify a student profile (placement officer action).
 */
const verifyStudent = async (studentId, officerUserId) => {
  const student = await Student.findByPk(studentId);
  if (!student) throw createAppError('Student not found.', 404);

  await student.update({ is_verified: true, verified_by: officerUserId });
  return student.reload();
};

module.exports = { getProfile, updateProfile, uploadResume, listStudents, verifyStudent };