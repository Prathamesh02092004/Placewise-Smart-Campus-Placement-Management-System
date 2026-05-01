import { configureStore }  from '@reduxjs/toolkit'
import authReducer          from '@/features/auth/authSlice'
import jobsReducer          from '@/features/jobs/jobsSlice'
import applicationsReducer  from '@/features/applications/applicationsSlice'
import skillGapReducer      from '@/features/skillGap/skillGapSlice'
import notificationReducer  from '@/features/notifications/notificationSlice'
import { injectStore }      from '@/services/api'

export const store = configureStore({
  reducer: {
    auth:          authReducer,
    jobs:          jobsReducer,
    applications:  applicationsReducer,
    skillGap:      skillGapReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setCredentials', 'notifications/addNotification'],
      },
    }),
})

// Wire api.js to the store AFTER configureStore() finishes.
// api.js cannot import store directly (circular dep), so it exposes
// injectStore() which we call here once the store exists.
// Without this call, _store inside api.js stays null — every request
// goes out with no Bearer token and every 401 tries to refresh with a
// null store reference, crashing the interceptor silently.
injectStore(store)

export default store