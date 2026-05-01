import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api, { getErrorMessage } from '@/services/api'

// ─── Async Thunks ────────────────────────────────────────────────────────────

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', { email, password })
      return res.data
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

export const register = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/register', payload)
      return res.data
    } catch (err) {
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      console.warn('Logout API error (ignored):', err.message)
    }
  },
)

/**
 * Restore session on page reload.
 *
 * Flow on reload:
 *   1. Token is null (in-memory, lost on reload).
 *   2. fetchMe dispatches GET /auth/me with no token → 401.
 *   3. The Axios interceptor calls POST /auth/refresh (HttpOnly cookie) →
 *      gets a new access token → retries GET /auth/me → succeeds.
 *   4. fetchMe.fulfilled sets user + token in Redux.
 *   5. AppShell sees initializing = false and renders the routes.
 *
 * The `initializing` flag gates route rendering so NO component mounts
 * (and therefore no data fetch fires) until the session is fully resolved.
 * This eliminates all race conditions between session restore and data fetches.
 */
export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/auth/me')
      return res.data
    } catch (err) {
      // Not an error worth surfacing — user simply isn't logged in
      return rejectWithValue(getErrorMessage(err))
    }
  },
)

// ─── Slice ───────────────────────────────────────────────────────────────────

const initialState = {
  user:        null,
  token:       null,    // access token — in-memory only, NEVER localStorage
  loading:     false,
  error:       null,
  /**
   * initializing: true until fetchMe resolves (either fulfilled or rejected).
   *
   * Starts true so AppShell shows a loading screen on every page load/reload.
   * Set to false once we know whether the user has a valid session or not.
   * This prevents any route from rendering (and dispatching data fetches)
   * before the token is available in Redux state.
   */
  initializing: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Called by the Axios interceptor after a silent token refresh,
     * AND by Profile/Resume pages after updating the user object.
     *
     * IMPORTANT: if token is null/undefined we keep the existing token.
     * Pages that only want to refresh the user object pass token: null
     * intentionally — they must not lose the current auth session.
     */
    setCredentials(state, action) {
      if (action.payload.token != null) state.token = action.payload.token
      if (action.payload.user  != null) state.user  = action.payload.user
    },
    logout(state) {
      state.user        = null
      state.token       = null
      state.error       = null
      state.initializing = false
    },
    clearAuthError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // ── login ──────────────────────────────────────────────────────────────
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error   = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading      = false
        state.initializing = false   // session is now known
        // Backend shape: { success, message, data: { accessToken, user } }
        state.token = action.payload?.data?.accessToken ?? null
        state.user  = action.payload?.data?.user        ?? null
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error   = action.payload
      })

    // ── register ───────────────────────────────────────────────────────────
    builder
      .addCase(register.pending,   (state) => { state.loading = true;  state.error = null })
      .addCase(register.fulfilled, (state) => { state.loading = false })
      .addCase(register.rejected,  (state, action) => {
        state.loading = false
        state.error   = action.payload
      })

    // ── logoutThunk ────────────────────────────────────────────────────────
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.user        = null
      state.token       = null
      state.error       = null
      state.initializing = false
    })

    // ── fetchMe — session restore ──────────────────────────────────────────
    // Both cases MUST set initializing = false so the app never stays stuck
    // on the loading screen.
    builder
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.initializing = false
        // Backend getMe shape: { success, message, data: { id, email, role, ...profile } }
        // getMe controller returns the profile object directly (not wrapped in { user: result }),
        // so action.payload.data IS the user object.
        // Note: action.payload.data?.user would be undefined — do NOT use that path.
        const user = action.payload?.data ?? null
        if (user?.id) {
          state.user = user
          // The Axios interceptor already set state.token via setCredentials during
          // the transparent refresh cycle.  If the token was still valid (no refresh
          // needed), the interceptor didn't fire — but in that case the token was
          // already in state from the previous login, so nothing to do here.
        }
      })
      .addCase(fetchMe.rejected, (state) => {
        // No valid session (refresh cookie missing/expired) — force login
        state.user         = null
        state.token        = null
        state.initializing = false
      })
  },
})

export const { setCredentials, logout, clearAuthError } = authSlice.actions

// ─── Selectors ───────────────────────────────────────────────────────────────
export const selectCurrentUser     = (state) => state.auth.user
export const selectCurrentToken    = (state) => state.auth.token
export const selectAuthLoading     = (state) => state.auth.loading
export const selectAuthError       = (state) => state.auth.error
export const selectIsAuthenticated = (state) => !!state.auth.token && !!state.auth.user
export const selectInitializing    = (state) => state.auth.initializing

export default authSlice.reducer