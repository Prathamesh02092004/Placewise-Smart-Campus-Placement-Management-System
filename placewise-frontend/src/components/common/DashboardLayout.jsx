import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Sidebar from './Sidebar'
import { fetchNotifications } from '@/features/notifications/notificationSlice'
import { selectCurrentUser } from '@/features/auth/authSlice'
import useSocket from '@/hooks/useSocket'

export default function DashboardLayout({ children }) {
  const dispatch = useDispatch()
  const user     = useSelector(selectCurrentUser)

  // Boot real-time socket
  useSocket()

  // Load notification history on mount — use 'limit' not 'pageSize'
  useEffect(() => {
    if (user) {
      dispatch(fetchNotifications({ page: 1, limit: 30 }))
    }
  }, [dispatch, user?.id])

  return (
    <div className="flex h-screen bg-surface-muted overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto focus:outline-none">
        <div className="min-h-full">{children}</div>
      </main>
    </div>
  )
}