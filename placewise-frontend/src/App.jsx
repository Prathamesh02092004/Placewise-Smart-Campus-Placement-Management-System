import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/features/auth/authSlice'

// Public pages
import LandingPage    from '@/pages/LandingPage'
import LoginPage      from '@/pages/auth/LoginPage'
import RegisterPage   from '@/pages/auth/RegisterPage'
import AdminLoginPage from '@/pages/auth/AdminLoginPage'

// Route guard
import ProtectedRoute from '@/routes/ProtectedRoute'

// Student pages
import StudentDashboard    from '@/pages/student/Dashboard'
import StudentJobs         from '@/pages/student/Jobs'
import StudentJobDetail    from '@/pages/student/JobDetail'
import StudentApplications from '@/pages/student/Applications'
import StudentProfile      from '@/pages/student/Profile'
import StudentSkillGapReport from '@/pages/student/SkillGapReport'
import StudentNotifications  from '@/pages/student/Notifications'

// Recruiter pages
import RecruiterDashboard from '@/pages/recruiter/Dashboard'
import RecruiterPostJob   from '@/pages/recruiter/PostJob'
import RecruiterJobs      from '@/pages/recruiter/Jobs'
import CandidateView      from '@/pages/recruiter/CandidateView'

// Placement officer pages
import PlacementDashboard from '@/pages/placement/Dashboard'

// Admin pages
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminUsers     from '@/pages/admin/Users'
import AdminAuditLogs from '@/pages/admin/AuditLogs'

/** Redirect an authenticated user to their role's dashboard. */
function RoleRedirect() {
  const user = useSelector(selectCurrentUser)
  if (!user) return <Navigate to="/" replace />
  const map = {
    student:   '/student/dashboard',
    recruiter: '/recruiter/dashboard',
    placement: '/placement/dashboard',
    admin:     '/admin/dashboard',
  }
  return <Navigate to={map[user.role] || '/'} replace />
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"            element={<LandingPage />} />
      <Route path="/login"       element={<LoginPage />} />
      <Route path="/register"    element={<RegisterPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route path="/dashboard"   element={<RoleRedirect />} />

      {/* Student */}
      <Route path="/student/dashboard"        element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/jobs"             element={<ProtectedRoute allowedRoles={['student']}><StudentJobs /></ProtectedRoute>} />
      <Route path="/student/jobs/:id"         element={<ProtectedRoute allowedRoles={['student']}><StudentJobDetail /></ProtectedRoute>} />
      <Route path="/student/applications"     element={<ProtectedRoute allowedRoles={['student']}><StudentApplications /></ProtectedRoute>} />
      <Route path="/student/profile"          element={<ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute>} />
      <Route path="/student/skill-gap/:jobId" element={<ProtectedRoute allowedRoles={['student']}><StudentSkillGapReport /></ProtectedRoute>} />
      <Route path="/student/notifications"    element={<ProtectedRoute allowedRoles={['student']}><StudentNotifications /></ProtectedRoute>} />

      {/* Recruiter */}
      <Route path="/recruiter/dashboard"            element={<ProtectedRoute allowedRoles={['recruiter']}><RecruiterDashboard /></ProtectedRoute>} />
      <Route path="/recruiter/post-job"             element={<ProtectedRoute allowedRoles={['recruiter']}><RecruiterPostJob /></ProtectedRoute>} />
      <Route path="/recruiter/jobs"                 element={<ProtectedRoute allowedRoles={['recruiter']}><RecruiterJobs /></ProtectedRoute>} />
      <Route path="/recruiter/jobs/:id/candidates"  element={<ProtectedRoute allowedRoles={['recruiter']}><CandidateView /></ProtectedRoute>} />

      {/* Placement officer */}
      <Route path="/placement/dashboard" element={<ProtectedRoute allowedRoles={['placement']}><PlacementDashboard /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard"  element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users"      element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/audit-logs" element={<ProtectedRoute allowedRoles={['admin']}><AdminAuditLogs /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}