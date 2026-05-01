import { useEffect, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { io } from 'socket.io-client'
import { selectCurrentToken } from '@/features/auth/authSlice'
import { addNotification } from '@/features/notifications/notificationSlice'
import { updateLocalStatus } from '@/features/applications/applicationsSlice'
import { updateReportSeverity } from '@/features/skillGap/skillGapSlice'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export function useSocket() {
  const token    = useSelector(selectCurrentToken)
  const dispatch = useDispatch()
  const socketRef = useRef(null)

  const emit = useCallback((event, data) => {
    socketRef.current?.connected && socketRef.current.emit(event, data)
  }, [])

  useEffect(() => {
    // No token — disconnect any existing socket and stop
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      return
    }

    // Already connected with this token — nothing to do.
    // This guard prevents React StrictMode's double-invoke from opening
    // duplicate connections (which showed 3 sockets in the logs).
    if (socketRef.current?.connected) return

    // Disconnect stale socket before creating a new one
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    const socket = io(SOCKET_URL, {
      auth:                 { token },
      transports:           ['websocket', 'polling'],
      reconnection:         true,
      reconnectionAttempts: 5,
      reconnectionDelay:    2000,
    })

    socketRef.current = socket

    socket.on('connect_error', (err) => {
      console.warn('[Socket] connection error:', err.message)
    })

    socket.on('notification:new', (payload) => {
      dispatch(addNotification(payload))
    })

    socket.on('skillgap:ready', (payload) => {
      dispatch(updateReportSeverity({
        jobId:         payload.jobId,
        severity:      payload.severity,
        overall_match: payload.overall_match,
      }))
      dispatch(addNotification({
        id: `sg-${payload.jobId}-${Date.now()}`,
        type: 'skill_gap_ready',
        message: `Skill gap ready — ${payload.severity} (${Math.round(payload.overall_match ?? 0)}%)`,
        read: false,
        created_at: new Date().toISOString(),
      }))
    })

    socket.on('application:updated', (payload) => {
      dispatch(updateLocalStatus({ applicationId: payload.applicationId, newStatus: payload.newStatus }))
      dispatch(addNotification({
        id: `app-${payload.applicationId}-${Date.now()}`,
        type: 'application_status',
        message: `Application for "${payload.jobTitle}" is now ${payload.newStatus.replace(/_/g, ' ')}`,
        read: false,
        created_at: new Date().toISOString(),
      }))
    })

    socket.on('interview:scheduled', (payload) => {
      dispatch(addNotification({
        id: `iv-${payload.interviewId}-${Date.now()}`,
        type: 'interview_scheduled',
        message: `Interview for "${payload.jobTitle}" on ${new Date(payload.scheduledAt).toLocaleDateString()}`,
        read: false,
        created_at: new Date().toISOString(),
      }))
    })

    socket.on('offer:received', (payload) => {
      dispatch(addNotification({
        id: `offer-${payload.applicationId}-${Date.now()}`,
        type: 'offer_received',
        message: `🎉 Offer received from ${payload.companyName}!`,
        read: false,
        created_at: new Date().toISOString(),
      }))
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [token, dispatch])

  return { emit }
}

export default useSocket