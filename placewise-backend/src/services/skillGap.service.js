'use strict'

const { Op }          = require('sequelize')
const { v4: uuidv4 }  = require('uuid')
const axios           = require('axios')
const { SkillGapReport, Student, Job, SkillTaxonomy } = require('../models')
const logger          = require('../utils/logger')

const AI_URL    = process.env.AI_SERVICE_URL    || 'http://localhost:8000'
const AI_SECRET = process.env.AI_SERVICE_SECRET || ''

const CACHE_TTL_HOURS = 24

const createAppError = (msg, code) => {
  const e = new Error(msg)
  e.statusCode = code
  return e
}

const flattenSkills = (skills) => {
  if (!Array.isArray(skills)) return []
  return skills.map((s) =>
    typeof s === 'string' ? s : (s?.skill_name ?? '')
  ).filter(Boolean)
}

// ── Main analysis ─────────────────────────────────────────────────
const analyzeGap = async (studentUserId, jobId) => {
  const student = await Student.findOne({ where: { user_id: studentUserId } })
  if (!student) throw createAppError('Student profile not found.', 404)

  const job = await Job.findByPk(jobId)
  if (!job) throw createAppError('Job not found.', 404)

  // Cache check — return existing report if fresh enough
  const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000)
  const cached = await SkillGapReport.findOne({
    where: {
      student_id: student.id,
      job_id:     jobId,
      updated_at: { [Op.gte]: cutoff },
    },
  })
  if (cached) {
    logger.info(`SkillGap cache hit: student=${student.id} job=${jobId}`)
    return cached
  }

  // Call AI service
  const studentSkillNames = flattenSkills(student.skills)
  let aiResponse

  try {
    const response = await axios.post(
      `${AI_URL}/ai/skill-gap/analyze`,
      {
        student_id:     student.id,
        job_id:         jobId,
        role_category:  job.role_category || 'software_engineer',
        student_skills: studentSkillNames,
        job_skills:     job.required_skills || [],
        student_cgpa:   student.cgpa    || 0,
        student_branch: student.branch  || '',
      },
      {
        headers: { 'x-api-secret': AI_SECRET },
        timeout: 30000,
      }
    )
    aiResponse = response.data
  } catch (err) {
    const status  = err.response?.status
    const detail  = err.response?.data?.detail || err.message
    logger.error(`AI skill-gap analysis failed [${status}]: ${detail}`)
    throw createAppError(
      `Skill gap analysis is temporarily unavailable: ${detail}`,
      503
    )
  }

  // Enrich with local taxonomy URLs and demand scores
  const enrichedMissing = await enrichSkillsWithTaxonomy(aiResponse.missing_skills || [])
  const enrichedMarket  = await enrichSkillsWithTaxonomy(aiResponse.market_demand  || [])

  // ── Upsert report ────────────────────────────────────────────────
  // MySQL's INSERT ... ON DUPLICATE KEY UPDATE does not return the row,
  // so Sequelize's upsert() resolves to [null, created] on MySQL.
  // We always do a findOne immediately after to get the actual record.
  await SkillGapReport.upsert({
    id:                 uuidv4(),
    student_id:         student.id,
    job_id:             jobId,
    missing_skills:     enrichedMissing,
    weak_skills:        aiResponse.weak_skills     || [],
    market_demand_data: enrichedMarket,
    severity:           aiResponse.severity,
    overall_match:      aiResponse.overall_match,
    ai_analysis_raw:    aiResponse,
  })

  // Fetch the persisted record — guaranteed non-null
  const report = await SkillGapReport.findOne({
    where: { student_id: student.id, job_id: jobId },
  })

  return report
}

// ── Taxonomy enrichment ───────────────────────────────────────────
const enrichSkillsWithTaxonomy = async (skills) => {
  if (!skills || skills.length === 0) return skills

  const skillNames = skills.map((s) => s.skill_name || s).filter(Boolean)
  const entries    = await SkillTaxonomy.findAll({
    where: { skill_name: { [Op.in]: skillNames } },
    attributes: ['skill_name', 'learning_urls', 'market_demand', 'demand_trend'],
  })

  const map = {}
  entries.forEach((t) => { map[t.skill_name] = t })

  return skills.map((skill) => {
    const name  = skill.skill_name || skill
    const entry = map[name]
    return {
      ...skill,
      learning_urls: entry?.learning_urls  || skill.learning_urls  || [],
      market_demand: entry?.market_demand  ?? skill.demand_score   ?? 0,
      demand_trend:  entry?.demand_trend   || skill.demand_trend   || 'stable',
    }
  })
}

// ── Market trends ─────────────────────────────────────────────────
const getMarketTrends = async (roleCategory) => {
  const skills = await SkillTaxonomy.findAll({
    where:      { role_tags: { [Op.like]: `%${roleCategory}%` } },
    order:      [['market_demand', 'DESC']],
    limit:      20,
    attributes: ['skill_name', 'category', 'market_demand', 'demand_trend', 'learning_urls'],
  })
  return skills
}

// ── Learning path ─────────────────────────────────────────────────
const getLearningPath = async (studentUserId, jobId) => {
  const student = await Student.findOne({ where: { user_id: studentUserId } })
  if (!student) throw createAppError('Student profile not found.', 404)

  const report = await SkillGapReport.findOne({
    where: { student_id: student.id, job_id: jobId },
  })
  if (!report) {
    throw createAppError(
      'No skill gap report found. Please view the job first to generate a report.',
      404
    )
  }

  try {
    const missing = (report.missing_skills || []).map((s) => s.skill_name).filter(Boolean)
    const weak    = (report.weak_skills    || []).map((s) => s.skill_name).filter(Boolean)
    const gap     = [...new Set([...missing, ...weak])]

    const job      = await Job.findByPk(jobId)
    const response = await axios.post(
      `${AI_URL}/ai/skill-gap/learning-path`,
      {
        gap_skills:    gap,
        role_category: job?.role_category || 'software_engineer',
      },
      {
        headers: { 'x-api-secret': AI_SECRET },
        timeout: 20000,
      }
    )
    return response.data
  } catch (err) {
    logger.warn('AI learning path failed, using taxonomy fallback:', err.message)
    return (report.missing_skills || []).slice(0, 10).map((s, i) => ({
      order:      i + 1,
      skill_name: s.skill_name,
      priority:   s.tag === 'CRITICAL' ? 'urgent' : s.tag === 'IMPORTANT' ? 'high' : 'medium',
      resources:  s.learning_urls || [],
    }))
  }
}

// ── Batch analysis ────────────────────────────────────────────────
const batchAnalyze = async (jobId) => {
  const job = await Job.findByPk(jobId)
  if (!job) throw createAppError('Job not found.', 404)

  const { Application } = require('../models')
  const applications    = await Application.findAll({
    where:   { job_id: jobId },
    include: [{ model: Student, as: 'student' }],
  })

  const results = await Promise.allSettled(
    applications.map(async (app) => {
      const student    = app.student
      const skillNames = flattenSkills(student.skills)

      const response = await axios.post(
        `${AI_URL}/ai/skill-gap/analyze`,
        {
          student_id:     student.id,
          job_id:         jobId,
          role_category:  job.role_category || 'software_engineer',
          student_skills: skillNames,
          job_skills:     job.required_skills || [],
          student_cgpa:   student.cgpa   || 0,
          student_branch: student.branch || '',
        },
        {
          headers: { 'x-api-secret': AI_SECRET },
          timeout: 30000,
        }
      )

      const data = response.data
      return {
        student_id:    student.id,
        student_name:  student.name,
        severity:      data.severity,
        overall_match: data.overall_match,
        missing_count: (data.missing_skills || []).length,
      }
    })
  )

  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r)    => r.value)
    .sort((a, b) => b.overall_match - a.overall_match)
}

module.exports = { analyzeGap, getMarketTrends, getLearningPath, batchAnalyze }