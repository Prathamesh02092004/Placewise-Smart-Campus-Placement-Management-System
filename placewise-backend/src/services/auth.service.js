const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { User, Student, Recruiter, PlacementOfficer } = require('../models');
const {
  signAccessToken,
  generateRefreshToken,
  refreshTokenExpiry,
} = require('../config/jwt');
const mailer = require('../utils/mailer');
const logger = require('../utils/logger');

const createAppError = (message, statusCode, details = null) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  if (details) err.details = details;
  return err;
};

const buildTokenPair = async (user) => {
  const payload = { userId: user.id, role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = generateRefreshToken();
  const refreshExpiry = refreshTokenExpiry();

  await user.update({
    refresh_token: refreshToken,
    refresh_expires: refreshExpiry,
  });

  return { accessToken, refreshToken, refreshExpiry };
};

const register = async ({ email, password, role, profileData }) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw createAppError('An account with this email already exists.', 409);

  const password_hash = await bcrypt.hash(password, 12);
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const user = await User.create({
    id: uuidv4(),
    email,
    password_hash,
    role,
    email_verification_token: verificationToken,
  });

  const profileId = uuidv4();
  if (role === 'student') {
    await Student.create({ id: profileId, user_id: user.id, ...profileData });
  } else if (role === 'recruiter') {
    await Recruiter.create({ id: profileId, user_id: user.id, ...profileData });
  } else if (role === 'placement') {
    await PlacementOfficer.create({ id: profileId, user_id: user.id, ...profileData });
  }

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  mailer.sendVerificationEmail(email, profileData.name, verificationUrl)
    .catch((err) => logger.warn('Verification email failed:', err.message));

  return { userId: user.id, email: user.email, role: user.role };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ where: { email } });
  if (!user) throw createAppError('Invalid email or password.', 401);
  if (!user.is_active) throw createAppError('Your account has been suspended. Contact support.', 403);

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) throw createAppError('Invalid email or password.', 401);

  if (!user.email_verified) {
    throw createAppError('Please verify your email before logging in.', 403);
  }

  const { accessToken, refreshToken, refreshExpiry } = await buildTokenPair(user);

  let profile = null;
  if (user.role === 'student') {
    profile = await Student.findOne({ where: { user_id: user.id } });
  } else if (user.role === 'recruiter') {
    profile = await Recruiter.findOne({ where: { user_id: user.id } });
  } else if (user.role === 'placement') {
    profile = await PlacementOfficer.findOne({ where: { user_id: user.id } });
  }

 
  let fullUser;
  if (user.role === 'student' && profile) {
    fullUser = {
      id:               user.id,
      email:            user.email,
      role:             user.role,
      student_id:       profile.id,
      name:             profile.name,
      branch:           profile.branch,
      cgpa:             profile.cgpa    != null ? parseFloat(profile.cgpa) : null,
      backlogs:         profile.backlogs      ?? 0,
      year_of_study:    profile.year_of_study ?? null,
      skills:           profile.skills        ?? [],
      resume_url:       profile.resume_url    ?? null,
      is_verified:      profile.is_verified   ?? false,
      profile_complete: profile.profile_complete ?? false,
      internships:      profile.internships   ?? [],
      projects:         profile.projects      ?? [],
      certifications:   profile.certifications ?? [],
    };
  } else if (user.role === 'recruiter' && profile) {
    fullUser = {
      id:           user.id,
      email:        user.email,
      role:         user.role,
      recruiter_id: profile.id,
      name:         profile.contact_name ?? profile.name ?? null,
      company_name: profile.company_name,
      industry:     profile.industry,
      website:      profile.website,
      approved:     profile.approved,
    };
  } else if (user.role === 'placement' && profile) {
    fullUser = {
      id:           user.id,
      email:        user.email,
      role:         user.role,
      placement_id: profile.id,
      name:         profile.name,
      department:   profile.department,
    };
  } else {
    fullUser = {
      id:    user.id,
      email: user.email,
      role:  user.role,
      name:  profile?.name ?? user.email,
    };
  }

  return {
    accessToken,
    refreshToken,
    refreshExpiry,
    user: fullUser,
  };
};


const refreshTokens = async (incomingRefreshToken) => {
  if (!incomingRefreshToken) throw createAppError('No refresh token provided.', 401);

  const user = await User.findOne({ where: { refresh_token: incomingRefreshToken } });
  if (!user) throw createAppError('Invalid refresh token.', 401);

  if (new Date() > new Date(user.refresh_expires)) {
    await user.update({ refresh_token: null, refresh_expires: null });
    throw createAppError('Refresh token expired. Please log in again.', 401);
  }

  const { accessToken, refreshToken, refreshExpiry } = await buildTokenPair(user);
  return { accessToken, refreshToken, refreshExpiry };
};

const logout = async (userId) => {
  await User.update(
    { refresh_token: null, refresh_expires: null },
    { where: { id: userId } }
  );
};

const verifyEmail = async (token) => {
  const user = await User.findOne({ where: { email_verification_token: token } });
  if (!user) throw createAppError('Invalid or expired verification link.', 400);

  await user.update({
    email_verified: true,
    email_verification_token: null,
  });

  return { message: 'Email verified successfully. You can now log in.' };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email } });
 
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await user.update({
    password_reset_token: resetToken,
    password_reset_expires: resetExpiry,
  });
  let name = email;
  if (user.role === 'student') {
    const profile = await Student.findOne({ where: { user_id: user.id } });
    if (profile) name = profile.name;
  }

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await mailer.sendPasswordResetEmail(email, name, resetUrl);
};

const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({ where: { password_reset_token: token } });
  if (!user) throw createAppError('Invalid or expired reset link.', 400);
  if (new Date() > new Date(user.password_reset_expires)) {
    throw createAppError('Reset link has expired. Please request a new one.', 400);
  }

  const password_hash = await bcrypt.hash(newPassword, 12);
  await user.update({
    password_hash,
    password_reset_token: null,
    password_reset_expires: null,
    refresh_token: null,
  });
};

const getMe = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user || !user.is_active) throw createAppError('User not found or inactive.', 404);

  // Base fields always present
  const base = {
    id:    user.id,
    email: user.email,
    role:  user.role,
  };
  if (user.role === 'student') {
    const p = await Student.findOne({ where: { user_id: user.id } });
    if (!p) return { ...base, name: null };
    return {
      ...base,
      student_id:      p.id,           // Student profile PK — used for API calls
      name:            p.name,
      branch:          p.branch,
      cgpa:            p.cgpa         != null ? parseFloat(p.cgpa)  : null,
      backlogs:        p.backlogs      ?? 0,
      year_of_study:   p.year_of_study ?? null,
      skills:          p.skills        ?? [],
      resume_url:      p.resume_url    ?? null,
      is_verified:     p.is_verified   ?? false,
      profile_complete:p.profile_complete ?? false,
      internships:     p.internships   ?? [],
      projects:        p.projects      ?? [],
      certifications:  p.certifications ?? [],
    };
  }

  if (user.role === 'recruiter') {
    const p = await Recruiter.findOne({ where: { user_id: user.id } });
    if (!p) return { ...base, name: null };
    return {
      ...base,
      recruiter_id: p.id,
      name:         p.contact_name ?? p.name ?? null,
      company_name: p.company_name,
      industry:     p.industry,
      website:      p.website,
      approved:     p.approved,
    };
  }

  if (user.role === 'placement') {
    const p = await PlacementOfficer.findOne({ where: { user_id: user.id } });
    if (!p) return { ...base, name: null };
    return {
      ...base,
      placement_id: p.id,
      name:         p.name,
      department:   p.department,
    };
  }

  return { ...base, name: user.email };
};

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getMe,
};