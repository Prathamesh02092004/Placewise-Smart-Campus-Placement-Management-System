import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api, { getErrorMessage } from '@/services/api'

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const fetchSkillGap = createAsyncThunk(
  'skillGap/fetch',
  async (jobId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/skill-gap/${jobId}`)
      return { jobId, report: res.data }
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

export const fetchMarketTrends = createAsyncThunk(
  'skillGap/fetchTrends',
  async (roleCategory, { rejectWithValue }) => {
    try {
      const res = await api.get(`/skillgap/trends/${roleCategory}`)
      return { roleCategory, trends: res.data }
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

export const fetchLearningPath = createAsyncThunk(
  'skillGap/fetchLearningPath',
  async (jobId, { rejectWithValue }) => {
    try {
      // Backend route: GET /skill-gap/:jobId/learning-path
      const res = await api.get(`/skill-gap/${jobId}/learning-path`)
      return { jobId, learningPath: res.data }
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

// ─── Normalisation helpers ────────────────────────────────────────────────────
// MySQL returns DECIMAL / FLOAT columns as strings ("78.50" not 78.50).
// Parse every numeric field before storing so .toFixed(), charts, and
// arithmetic never receive a string.

const toNum = (v) => {
  if (v == null) return null
  const n = parseFloat(v)
  return Number.isNaN(n) ? null : n
}

/**
 * Unwrap the backend response envelope and coerce DECIMAL strings to numbers.
 *
 * Backend success() shape:  { success, message, data: { ...reportFields } }
 *
 * DB column names used by the Sequelize model:
 *   missing_skills, weak_skills, market_demand_data, severity, overall_match
 *
 * The frontend calls the output field "market_demand" for consistency with the
 * AI service's SkillGapResponse schema.
 */
const normalizeReport = (payload) => {
  // Unwrap { success, message, data: {...} } envelope when present
  const raw = payload?.data ?? payload
  if (!raw || typeof raw !== 'object') return null

  return {
    ...raw,
    overall_match: toNum(raw.overall_match),

    missing_skills: (raw.missing_skills ?? []).map((s) => ({
      ...s,
      demand_score:    toNum(s.demand_score ?? s.market_demand),
      composite_score: toNum(s.composite_score),
    })),

    weak_skills: (raw.weak_skills ?? []).map((s) => ({
      ...s,
      student_score:  toNum(s.student_score),
      required_score: toNum(s.required_score),
      gap_delta:      toNum(s.gap_delta),
    })),

    // DB stores this as market_demand_data; normalise to market_demand for the UI
    market_demand: (raw.market_demand_data ?? raw.market_demand ?? []).map((s) => ({
      ...s,
      demand_score: toNum(s.demand_score ?? s.market_demand),
    })),

    learning_path: raw.learning_path ?? [],
    extra_skills:  raw.extra_skills  ?? [],
  }
}

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  reports:       {},  // { [jobId]: normalised SkillGapResponse }
  trends:        {},  // { [roleCategory]: MarketSkill[] }
  learningPaths: {},  // { [jobId]: LearningStep[] }
  loadingJobId:  null,
  error:         null,
}

const skillGapSlice = createSlice({
  name: 'skillGap',
  initialState,
  reducers: {
    clearSkillGapError(state) {
      state.error = null
    },
    // Socket.io 'skillgap:ready' event — update severity badge without a full re-fetch
    updateReportSeverity(state, action) {
      const { jobId, severity, overall_match } = action.payload
      if (state.reports[jobId]) {
        state.reports[jobId].severity      = severity
        state.reports[jobId].overall_match = toNum(overall_match)
      }
    },
  },
  extraReducers: (builder) => {
    // ── fetchSkillGap ──────────────────────────────────────────────
    builder
      .addCase(fetchSkillGap.pending, (state, action) => {
        state.loadingJobId = action.meta.arg
        state.error        = null
      })
      .addCase(fetchSkillGap.fulfilled, (state, action) => {
        state.loadingJobId = null
        // normalizeReport unwraps { success, message, data: {...} } and
        // converts all DECIMAL strings to JS numbers
        state.reports[action.payload.jobId] = normalizeReport(action.payload.report)
      })
      .addCase(fetchSkillGap.rejected, (state, action) => {
        state.loadingJobId = null
        state.error        = action.payload
      })

    // ── fetchMarketTrends ──────────────────────────────────────────
    builder
      .addCase(fetchMarketTrends.fulfilled, (state, action) => {
        const raw = action.payload.trends?.data ?? action.payload.trends ?? []
        state.trends[action.payload.roleCategory] = raw.map((s) => ({
          ...s,
          demand_score: toNum(s.demand_score ?? s.market_demand),
        }))
      })

    // ── fetchLearningPath ──────────────────────────────────────────
    builder
      .addCase(fetchLearningPath.fulfilled, (state, action) => {
        state.learningPaths[action.payload.jobId] =
          action.payload.learningPath?.data ?? action.payload.learningPath ?? []
      })
  },
})

export const { clearSkillGapError, updateReportSeverity } = skillGapSlice.actions

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectSkillGapReport  = (jobId) => (state) => state.skillGap.reports[jobId]  ?? null
export const selectMarketTrends    = (cat)   => (state) => state.skillGap.trends[cat]      ?? []
export const selectLearningPath    = (jobId) => (state) => state.skillGap.learningPaths[jobId] ?? []
export const selectSkillGapLoading = (jobId) => (state) => state.skillGap.loadingJobId === jobId
export const selectSkillGapError   = (state) => state.skillGap.error

export default skillGapSlice.reducer