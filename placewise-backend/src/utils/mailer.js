const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('./logger');

// ── Transporter ───────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

/**
 * Core send function. All mailer methods call this.
 */
const sendMail = async ({ to, subject, html }) => {
  if (env.NODE_ENV === 'test') return; // never send emails during tests

  try {
    const info = await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Email send failed to ${to}:`, err.message);
    throw err; // let the caller decide whether to surface this error
  }
};

// ── Email Templates ───────────────────────────────────────────────

/**
 * Sends an email verification link after registration.
 */
const sendVerificationEmail = async (to, name, verificationUrl) => {
  await sendMail({
    to,
    subject: 'Verify your PlaceWise account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #1a56db;">Welcome to PlaceWise, ${name}!</h2>
        <p>Please verify your email address to activate your account.</p>
        <a href="${verificationUrl}"
           style="display:inline-block; padding:12px 24px; background:#1a56db;
                  color:#fff; border-radius:6px; text-decoration:none; font-weight:bold;">
          Verify Email
        </a>
        <p style="color:#888; font-size:12px; margin-top:24px;">
          This link expires in 24 hours. If you did not register, ignore this email.
        </p>
      </div>
    `,
  });
};

/**
 * Notifies student their application was received.
 */
const sendApplicationConfirmation = async (to, name, jobTitle, companyName) => {
  await sendMail({
    to,
    subject: `Application received — ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #1a56db;">Application Submitted</h2>
        <p>Hi ${name},</p>
        <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong>
           has been received successfully.</p>
        <p>You will be notified when the recruiter reviews your profile.</p>
        <p style="color:#888; font-size:12px;">— PlaceWise Placement Cell</p>
      </div>
    `,
  });
};

/**
 * Notifies student they have been shortlisted.
 */
const sendShortlistNotification = async (to, name, jobTitle, companyName) => {
  await sendMail({
    to,
    subject: `You have been shortlisted — ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #057a55;">Congratulations — You're Shortlisted!</h2>
        <p>Hi ${name},</p>
        <p>You have been shortlisted for <strong>${jobTitle}</strong> at
           <strong>${companyName}</strong>.</p>
        <p>Log in to PlaceWise to view further updates.</p>
        <p style="color:#888; font-size:12px;">— PlaceWise Placement Cell</p>
      </div>
    `,
  });
};

/**
 * Sends interview schedule details to a student.
 */
const sendInterviewSchedule = async (to, name, details) => {
  const { jobTitle, companyName, scheduledAt, mode, videoLink, venue } = details;
  const dateStr = new Date(scheduledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const locationLine = mode === 'online'
    ? `<p><strong>Meeting Link:</strong> <a href="${videoLink}">${videoLink}</a></p>`
    : `<p><strong>Venue:</strong> ${venue}</p>`;

  await sendMail({
    to,
    subject: `Interview scheduled — ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #1a56db;">Interview Scheduled</h2>
        <p>Hi ${name},</p>
        <p>Your interview for <strong>${jobTitle}</strong> at
           <strong>${companyName}</strong> has been scheduled.</p>
        <p><strong>Date & Time:</strong> ${dateStr} IST</p>
        <p><strong>Mode:</strong> ${mode === 'online' ? 'Online' : 'In-Person'}</p>
        ${locationLine}
        <p>Best of luck!</p>
        <p style="color:#888; font-size:12px;">— PlaceWise Placement Cell</p>
      </div>
    `,
  });
};

/**
 * Notifies student an offer letter has been released.
 */
const sendOfferNotification = async (to, name, jobTitle, companyName) => {
  await sendMail({
    to,
    subject: `Offer letter received — ${jobTitle} at ${companyName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #057a55;">🎉 Offer Letter Received!</h2>
        <p>Hi ${name},</p>
        <p>Congratulations! You have received an offer letter for
           <strong>${jobTitle}</strong> at <strong>${companyName}</strong>.</p>
        <p>Log in to PlaceWise to download your offer letter.</p>
        <p style="color:#888; font-size:12px;">— PlaceWise Placement Cell</p>
      </div>
    `,
  });
};

/**
 * Password reset email.
 */
const sendPasswordResetEmail = async (to, name, resetUrl) => {
  await sendMail({
    to,
    subject: 'Reset your PlaceWise password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #1a56db;">Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}"
           style="display:inline-block; padding:12px 24px; background:#e02424;
                  color:#fff; border-radius:6px; text-decoration:none; font-weight:bold;">
          Reset Password
        </a>
        <p style="color:#888; font-size:12px; margin-top:24px;">
          If you did not request a password reset, ignore this email.
        </p>
      </div>
    `,
  });
};

module.exports = {
  sendVerificationEmail,
  sendApplicationConfirmation,
  sendShortlistNotification,
  sendInterviewSchedule,
  sendOfferNotification,
  sendPasswordResetEmail,
};