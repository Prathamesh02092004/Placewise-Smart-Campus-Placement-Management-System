const { emitToUser, emitToPlacement } = require('./index');

/**
 * Emit a notification:new event to a specific user.
 * Called from services whenever a Notification record is created.
 */
const emitNotification = (userId, notification) => {
  emitToUser(userId, 'notification:new', {
    id:         notification.id,
    type:       notification.type,
    title:      notification.title,
    message:    notification.message,
    metadata:   notification.metadata,
    created_at: notification.created_at,
  });
};

/**
 * Emit skill gap ready event to student.
 */
const emitSkillGapReady = (userId, { jobId, severity, overall_match, missing_count }) => {
  emitToUser(userId, 'skillgap:ready', { jobId, severity, overall_match, missing_count });
};

/**
 * Emit application status change to student.
 */
const emitApplicationUpdated = (userId, { applicationId, jobTitle, newStatus }) => {
  emitToUser(userId, 'application:updated', {
    applicationId,
    jobTitle,
    newStatus,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Emit interview scheduled event to student.
 */
const emitInterviewScheduled = (userId, { interviewId, scheduledAt, mode, videoLink, jobTitle }) => {
  emitToUser(userId, 'interview:scheduled', {
    interviewId, scheduledAt, mode, videoLink, jobTitle,
  });
};

/**
 * Emit offer received event to student.
 */
const emitOfferReceived = (userId, { applicationId, companyName, offerLetterUrl }) => {
  emitToUser(userId, 'offer:received', { applicationId, companyName, offerLetterUrl });
};

/**
 * Emit dashboard refresh signal to all placement officers and admins.
 * Triggers RTK Query invalidation on the frontend.
 */
const emitDashboardRefresh = () => {
  emitToPlacement('dashboard:refresh', { refreshedAt: new Date().toISOString() });
};

module.exports = {
  emitNotification,
  emitSkillGapReady,
  emitApplicationUpdated,
  emitInterviewScheduled,
  emitOfferReceived,
  emitDashboardRefresh,
};