import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api, { getErrorMessage } from '@/services/api'

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchMyApplications = createAsyncThunk(
  'applications/fetchMine',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/applications/my', { params })
      return res.data
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

export const submitApplication = createAsyncThunk(
  'applications/submit',
  async ({ job_id }, { rejectWithValue }) => {
    try {
      const res = await api.post('/applications', { job_id })
      return res.data
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

export const updateApplicationStatus = createAsyncThunk(
  'applications/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/applications/${id}/status`, { status })
      return res.data
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

export const fetchApplicationById = createAsyncThunk(
  'applications/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/applications/${id}`)
      return res.data
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * The paginated() backend util returns:
 *   { success, message, data: [...rows], pagination: { total, page, limit, totalPages } }
 *
 * The success() backend util returns:
 *   { success, message, data: { ...payload } }
 *
 * This helper extracts the rows array from whichever shape arrives.
 */
const extractList = (payload) => {
  // paginated shape: payload.data is an array
  if (Array.isArray(payload?.data)) return payload.data
  // success shape with explicit applications key
  if (Array.isArray(payload?.data?.applications)) return payload.data.applications
  // legacy / direct array at top level
  if (Array.isArray(payload?.applications)) return payload.applications
  return []
}

const extractTotal = (payload) => {
  return payload?.pagination?.total
    ?? payload?.data?.total
    ?? payload?.total
    ?? 0
}

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  list:        [],
  total:       0,
  selected:    null,
  loading:     false,
  submitting:  false,
  error:       null,
  // Plain array — NOT a Set.
  // Redux requires all state to be serializable; Set is not.
  // Use Array.includes() for O(n) look-ups (acceptable for typical page sizes).
  appliedJobIds: [],
}

const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    clearApplicationsError(state) {
      state.error = null
    },
    clearSelected(state) {
      state.selected = null
    },
    // Called by a Socket.io event when the server pushes a status change
    updateLocalStatus(state, action) {
      const { applicationId, newStatus } = action.payload
      const app = state.list.find((a) => a.id === applicationId)
      if (app) app.status = newStatus
      if (state.selected?.id === applicationId) state.selected.status = newStatus
    },
  },
  extraReducers: (builder) => {
    // ── fetchMyApplications ──────────────────────────────────────────────────
    builder
      .addCase(fetchMyApplications.pending, (state) => {
        state.loading = true
        state.error   = null
      })
      .addCase(fetchMyApplications.fulfilled, (state, action) => {
        state.loading = false
        const apps = extractList(action.payload)
        state.list  = apps
        state.total = extractTotal(action.payload)
        // Rebuild the fast-lookup array from job IDs
        state.appliedJobIds = apps.map((a) => a.job_id).filter(Boolean)
      })
      .addCase(fetchMyApplications.rejected, (state, action) => {
        state.loading = false
        state.error   = action.payload
      })

    // ── submitApplication ────────────────────────────────────────────────────
    builder
      .addCase(submitApplication.pending, (state) => {
        state.submitting = true
        state.error      = null
      })
      .addCase(submitApplication.fulfilled, (state, action) => {
        state.submitting = false
        // Backend returns: { success, message, data: application }
        const app = action.payload?.data ?? action.payload?.application ?? action.payload
        if (app?.id) {
          state.list.unshift(app)
          state.total += 1
          if (app.job_id && !state.appliedJobIds.includes(app.job_id)) {
            state.appliedJobIds.push(app.job_id)
          }
        }
      })
      .addCase(submitApplication.rejected, (state, action) => {
        state.submitting = false
        state.error      = action.payload
      })

    // ── updateApplicationStatus ──────────────────────────────────────────────
    builder.addCase(updateApplicationStatus.fulfilled, (state, action) => {
      const updated = action.payload?.data ?? action.payload?.application ?? action.payload
      if (updated?.id) {
        const idx = state.list.findIndex((a) => a.id === updated.id)
        if (idx !== -1) state.list[idx] = updated
        if (state.selected?.id === updated.id) state.selected = updated
      }
    })

    // ── fetchApplicationById ─────────────────────────────────────────────────
    builder
      .addCase(fetchApplicationById.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchApplicationById.fulfilled, (state, action) => {
        state.loading  = false
        state.selected = action.payload?.data ?? action.payload?.application ?? action.payload
      })
      .addCase(fetchApplicationById.rejected, (state, action) => {
        state.loading = false
        state.error   = action.payload
      })
  },
})

export const { clearApplicationsError, clearSelected, updateLocalStatus } =
  applicationsSlice.actions

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectApplications          = (state) => state.applications.list
export const selectApplicationsTotal     = (state) => state.applications.total
export const selectSelectedApplication   = (state) => state.applications.selected
export const selectApplicationsLoading   = (state) => state.applications.loading
export const selectApplicationsSubmitting = (state) => state.applications.submitting
export const selectApplicationsError     = (state) => state.applications.error
// Array.includes() replaces the former Set.has()
export const selectHasAppliedToJob       = (jobId) => (state) =>
  state.applications.appliedJobIds.includes(jobId)

export default applicationsSlice.reducer