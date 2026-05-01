import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api, { getErrorMessage } from '@/services/api'

// ─── Async Thunks ────────────────────────────────────────────────────────────

/** Student / public job listing — GET /jobs */
export const fetchJobs = createAsyncThunk(
  'jobs/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/jobs', { params })
      return res.data
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

/**
 * Recruiter's own job postings — GET /jobs/my-jobs
 * Returns all jobs (any status) that belong to the logged-in recruiter,
 * including drafts and closed listings that are invisible in the public feed.
 */
export const fetchMyJobs = createAsyncThunk(
  'jobs/fetchMine',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/jobs/my-jobs', { params })
      return res.data
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

export const fetchJobById = createAsyncThunk(
  'jobs/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/jobs/${id}`)
      return res.data
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

export const createJob = createAsyncThunk(
  'jobs/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post('/jobs', payload)
      return res.data
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

export const updateJob = createAsyncThunk(
  'jobs/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/jobs/${id}`, data)
      return res.data
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

export const fetchJobApplicants = createAsyncThunk(
  'jobs/fetchApplicants',
  async (jobId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/jobs/${jobId}/applicants`)
      // Backend success() shape: { success, message, data: applicants[] }
      return { jobId, applicants: res.data?.data ?? [] }
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Both paginated() and success() from the backend wrap data differently:
 *
 *   paginated(): { success, message, data: [...rows], pagination: { total, page, limit, ... } }
 *   success():   { success, message, data: singleItem }
 *
 * Extract the rows array from whichever shape arrives.
 */
const extractRows = (payload) => {
  if (Array.isArray(payload?.data))       return payload.data         // paginated()
  if (Array.isArray(payload?.data?.jobs)) return payload.data.jobs    // legacy wrapper
  return []
}

const extractPagination = (payload) => ({
  total:    payload?.pagination?.total    ?? payload?.data?.total    ?? 0,
  page:     payload?.pagination?.page     ?? payload?.data?.page     ?? 1,
  pageSize: payload?.pagination?.limit    ?? payload?.data?.limit    ?? 20,
})

/** Extract a single item from success() envelope */
const extractItem = (payload) => payload?.data ?? payload

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  list:        [],   // student job feed  (fetchJobs)
  myJobs:      [],   // recruiter's own   (fetchMyJobs)
  total:       0,
  page:        1,
  pageSize:    20,
  selectedJob: null,
  applicantsMap: {}, // { [jobId]: applicants[] }
  filters: {
    search:        '',
    branch:        '',
    role_category: '',
    min_cgpa:      '',
  },
  loading:      false,
  myJobsLoading: false,
  jobLoading:   false,
  error:        null,
}

const jobsSlice = createSlice({
  name: 'jobs',
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
      state.page = 1
    },
    setPage(state, action) {
      state.page = action.payload
    },
    clearSelectedJob(state) {
      state.selectedJob = null
    },
    clearJobsError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // ── fetchJobs (student / public feed) ──────────────────────────
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true
        state.error   = null
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false
        state.list    = extractRows(action.payload)
        const pg      = extractPagination(action.payload)
        state.total    = pg.total
        state.page     = pg.page
        state.pageSize = pg.pageSize
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false
        state.error   = action.payload
      })

    // ── fetchMyJobs (recruiter's own jobs) ─────────────────────────
    builder
      .addCase(fetchMyJobs.pending, (state) => {
        state.myJobsLoading = true
        state.error         = null
      })
      .addCase(fetchMyJobs.fulfilled, (state, action) => {
        state.myJobsLoading = false
        state.myJobs        = extractRows(action.payload)
        const pg            = extractPagination(action.payload)
        state.total         = pg.total
      })
      .addCase(fetchMyJobs.rejected, (state, action) => {
        state.myJobsLoading = false
        state.error         = action.payload
      })

    // ── fetchJobById ───────────────────────────────────────────────
    builder
      .addCase(fetchJobById.pending, (state) => {
        state.jobLoading = true
        state.error      = null
      })
      .addCase(fetchJobById.fulfilled, (state, action) => {
        state.jobLoading  = false
        // success() shape: { success, message, data: job }
        state.selectedJob = extractItem(action.payload)
      })
      .addCase(fetchJobById.rejected, (state, action) => {
        state.jobLoading = false
        state.error      = action.payload
      })

    // ── createJob ──────────────────────────────────────────────────
    builder
      .addCase(createJob.fulfilled, (state, action) => {
        const job = extractItem(action.payload)
        if (job?.id) {
          state.myJobs.unshift(job)
          state.total += 1
        }
      })
      .addCase(createJob.rejected, (state, action) => {
        state.error = action.payload
      })

    // ── updateJob ──────────────────────────────────────────────────
    builder
      .addCase(updateJob.fulfilled, (state, action) => {
        const updated = extractItem(action.payload)
        if (!updated?.id) return
        // Update in both lists
        const updateInList = (list) => {
          const idx = list.findIndex((j) => j.id === updated.id)
          if (idx !== -1) list[idx] = updated
        }
        updateInList(state.list)
        updateInList(state.myJobs)
        if (state.selectedJob?.id === updated.id) state.selectedJob = updated
      })

    // ── fetchJobApplicants ─────────────────────────────────────────
    builder
      .addCase(fetchJobApplicants.fulfilled, (state, action) => {
        state.applicantsMap[action.payload.jobId] = action.payload.applicants
      })
  },
})

export const { setFilters, setPage, clearSelectedJob, clearJobsError } = jobsSlice.actions

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectJobs             = (state) => state.jobs.list
export const selectMyJobs           = (state) => state.jobs.myJobs
export const selectSelectedJob      = (state) => state.jobs.selectedJob
export const selectJobsLoading      = (state) => state.jobs.loading
export const selectMyJobsLoading    = (state) => state.jobs.myJobsLoading
export const selectJobLoading       = (state) => state.jobs.jobLoading
export const selectJobsFilters      = (state) => state.jobs.filters
export const selectJobsPage         = (state) => state.jobs.page
export const selectJobsTotal        = (state) => state.jobs.total
export const selectApplicantsForJob = (jobId) => (state) =>
  state.jobs.applicantsMap[jobId] ?? []

export default jobsSlice.reducer