import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  selectCurrentUser,
  selectCurrentToken,
  selectInitializing,
} from '@/features/auth/authSlice'

const ROLE_HOME = {
  student:   '/student/dashboard',
  recruiter: '/recruiter/dashboard',
  placement: '/placement/dashboard',
  admin:     '/admin/dashboard',
}

// Spinner styles as a plain object — NO <style> tag inside JSX.
// Injecting a <style> element inside React's render tree causes React
// StrictMode to crash: it mounts, unmounts, then remounts the component,
// and on the second unmount it tries to removeChild a <style> node that
// the browser has already moved to <head> → "node is not a child" error.
const spinnerContainerStyle = {
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'center',
  height:         '100vh',
  background:     '#f8fafc',
}

// Inline keyframe animation injected once at module load (not inside render).
// This runs exactly once per page load, never during re-renders or HMR.
if (typeof document !== 'undefined' && !document.getElementById('__pw_spinner_style')) {
  const tag = document.createElement('style')
  tag.id = '__pw_spinner_style'
  tag.textContent = `
    @keyframes __pw_spin { to { transform: rotate(360deg); } }
    .__pw_sp {
      width:36px; height:36px;
      border:3px solid #e2e8f0;
      border-top-color:#3b82f6;
      border-radius:50%;
      animation:__pw_spin 0.7s linear infinite;
    }
  `
  document.head.appendChild(tag)
}

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const token        = useSelector(selectCurrentToken)
  const user         = useSelector(selectCurrentUser)
  const initializing = useSelector(selectInitializing)
  const location     = useLocation()

  // Session restore in progress — wait, never redirect yet.
  // The refresh cycle may still be in flight; redirecting to /login
  // now would log out a user who has a perfectly valid session.
  if (initializing) {
    return (
      <div style={spinnerContainerStyle}>
        <div className="__pw_sp" />
      </div>
    )
  }

  // Not authenticated
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Authenticated but wrong role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || '/'} replace />
  }

  return children
}