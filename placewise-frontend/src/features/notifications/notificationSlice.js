import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api, { getErrorMessage } from '@/services/api'

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/notifications', { params })
      return res.data // { notifications: [], total, unreadCount }
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

export const markNotificationRead = createAsyncThunk(
  'notifications/markRead',
  async (id, { rejectWithValue }) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      return id
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

export const markAllRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { rejectWithValue }) => {
    try {
      await api.patch('/notifications/mark-all-read')
      return true
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  items: [],
  total: 0,
  unreadCount: 0,
  loading: false,
  error: null,
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Called directly by useSocket to push real-time notifications
    addNotification(state, action) {
      const notification = action.payload
      // Prepend and keep max 100 in memory
      state.items.unshift(notification)
      if (state.items.length > 100) state.items.pop()
      if (!notification.read) state.unreadCount += 1
      state.total += 1
    },
    clearNotificationsError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // ── fetchNotifications ──
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false
        // paginated() shape: { success, message, data: [...], pagination: { total, ... } }
        state.items      = Array.isArray(action.payload?.data) ? action.payload.data : (action.payload?.notifications ?? [])
        state.total      = action.payload?.pagination?.total ?? action.payload?.total ?? 0
        state.unreadCount = action.payload?.pagination?.unreadCount ?? action.payload?.unreadCount ?? 0
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // ── markNotificationRead ──
    builder.addCase(markNotificationRead.fulfilled, (state, action) => {
      const id = action.payload
      const item = state.items.find((n) => n.id === id)
      if (item && !item.read) {
        item.read = true
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    })

    // ── markAllRead ──
    builder.addCase(markAllRead.fulfilled, (state) => {
      state.items.forEach((n) => { n.read = true })
      state.unreadCount = 0
    })
  },
})

export const { addNotification, clearNotificationsError } = notificationSlice.actions

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectNotifications = (state) => state.notifications.items
export const selectUnreadCount = (state) => state.notifications.unreadCount
export const selectNotificationsLoading = (state) => state.notifications.loading
export const selectNotificationsTotal = (state) => state.notifications.total

export default notificationSlice.reducer