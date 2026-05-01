const { v4: uuidv4 } = require('uuid');
const {
  Interview, Application, Job, Student, User, Recruiter, Notification,
} = require('../models');
const mailer = require('../utils/mailer');
const logger = require('../utils/logger');

const createAppError = (msg, code) => {
  const e = new Error(msg); e.statusCode = code; return e;
};

/**
 * Schedule an interview for a shortlisted application.
 */
const scheduleInterview = async (applicationId, interviewData, recruiterUserId) => {
  const application = await Application.findByPk(applicationId, {
    include: [
      { model: Job, as: 'job', include: [{ model: Recruiter, as: 'recruiter' }] },
      { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['email', 'id'] }] },
      { model: Interview, as: 'interview' },
    ],
  });
  if (!application) throw createAppError('Application not found.', 404);
  if (application.job.recruiter.user_id !== recruiterUserId) {
    throw createAppError('Access denied.', 403);
  }
  if (application.status !== 'shortlisted') {
    throw createAppError('Interview can only be scheduled for shortlisted applications.', 400);
  }
  if (application.interview) {
    throw createAppError('An interview is already scheduled for this application. Use PUT to update it.', 409);
  }

  const interview = await Interview.create({
    id: uuidv4(),
    application_id: applicationId,
    ...interviewData,
  });

  // Advance application status
  await application.update({ status: 'interview_scheduled' });

  // Notify student
  try {
    await Notification.create({
      id: uuidv4(),
      user_id: application.student.user.id,
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: `Your interview for ${application.job.title} has been scheduled.`,
      metadata: {
        interviewId: interview.id,
        applicationId,
        scheduledAt: interview.scheduled_at,
        mode: interview.mode,
      },
    });

    await mailer.sendInterviewSchedule(
      application.student.user.email,
      application.student.name,
      {
        jobTitle:    application.job.title,
        companyName: application.job.recruiter.company_name,
        scheduledAt: interview.scheduled_at,
        mode:        interview.mode,
        videoLink:   interview.video_link,
        venue:       interview.venue,
      }
    );
  } catch (err) {
    logger.warn('Interview notification failed:', err.message);
  }

  return interview;
};

/**
 * Update interview details or record the result.
 */
const updateInterview = async (interviewId, updates, recruiterUserId) => {
  const interview = await Interview.findByPk(interviewId, {
    include: [{
      model: Application,
      as: 'application',
      include: [{ model: Job, as: 'job', include: [{ model: Recruiter, as: 'recruiter' }] }],
    }],
  });
  if (!interview) throw createAppError('Interview not found.', 404);
  if (interview.application.job.recruiter.user_id !== recruiterUserId) {
    throw createAppError('Access denied.', 403);
  }

  await interview.update(updates);

  // If result recorded as selected — advance application to offer_received
  if (updates.result === 'selected') {
    await interview.application.update({ status: 'offer_received' });
  }

  // If result recorded as rejected — mark application rejected
  if (updates.result === 'rejected' || updates.result === 'no_show') {
    await interview.application.update({ status: 'rejected' });
  }

  return interview.reload();
};

/**
 * Get interview by application ID.
 */
const getInterview = async (applicationId) => {
  const interview = await Interview.findOne({
    where: { application_id: applicationId },
    include: [{
      model: Application,
      as: 'application',
      attributes: ['status', 'student_id', 'job_id'],
    }],
  });
  if (!interview) throw createAppError('No interview found for this application.', 404);
  return interview;
};

module.exports = { scheduleInterview, updateInterview, getInterview };