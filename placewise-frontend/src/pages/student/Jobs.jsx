import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  Search, Briefcase, MapPin, Clock,
  TrendingUp, SlidersHorizontal,
} from 'lucide-react'
import DashboardLayout from '@/components/common/DashboardLayout'
import { PageLoader } from '@/components/common/Loader'
import EmptyState from '@/components/common/EmptyState'
import Badge from '@/components/common/Badge'
import Button from '@/components/common/Button'
import {
  fetchJobs, selectJobs, selectJobsLoading,
  selectJobsTotal, setFilters, selectJobsFilters,
  setPage, selectJobsPage,
} from '@/features/jobs/jobsSlice'
import { fetchMyApplications, selectHasAppliedToJob } from '@/features/applications/applicationsSlice'
import useDebounce from '@/hooks/useDebounce'
import { formatDate } from '@/utils/date'

const ROLE_CATEGORIES = [
  '', 'software_engineer', 'data_scientist', 'devops_engineer',
  'ml_engineer', 'product_manager', 'business_analyst',
  'ux_designer', 'cybersecurity_analyst', 'embedded_systems',
]

export default function StudentJobs() {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const jobs      = useSelector(selectJobs)
  const loading   = useSelector(selectJobsLoading)
  const total     = useSelector(selectJobsTotal)
  const filters   = useSelector(selectJobsFilters)
  const page      = useSelector(selectJobsPage)

  const [search, setSearch] = useState(filters.search || '')
  const debouncedSearch     = useDebounce(search, 350)

  useEffect(() => {
    dispatch(setFilters({ search: debouncedSearch }))
  }, [debouncedSearch, dispatch])

  useEffect(() => {
    dispatch(fetchJobs({
      ...filters,
      search: debouncedSearch,
      page,
      limit: 10,
    }))
    // Also load applied jobs for badge display
    dispatch(fetchMyApplications())
  }, [dispatch, filters, debouncedSearch, page])

  return (
    <DashboardLayout>
      <div className="page-container space-y-5 animate-fade-in">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-ink">Job Openings</h1>
          <p className="text-sm text-ink-secondary mt-0.5">
            {total > 0 ? `${total} active position${total !== 1 ? 's' : ''} available` : 'Browse and apply to active job listings'}
          </p>
        </div>

        {/* Search + filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search by title, skill, or company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9 w-full"
            />
          </div>
          <select
            value={filters.role_category}
            onChange={(e) => { dispatch(setFilters({ role_category: e.target.value })); dispatch(setPage(1)) }}
            className="form-input bg-white sm:w-52 shrink-0"
          >
            <option value="">All Role Categories</option>
            {ROLE_CATEGORIES.slice(1).map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
          <select
            value={filters.min_cgpa}
            onChange={(e) => { dispatch(setFilters({ min_cgpa: e.target.value })); dispatch(setPage(1)) }}
            className="form-input bg-white sm:w-32 shrink-0"
          >
            <option value="">Any CGPA</option>
            <option value="6">6.0+</option>
            <option value="7">7.0+</option>
            <option value="8">8.0+</option>
          </select>
        </div>

        {/* Job list */}
        {loading ? (
          <PageLoader text="Loading jobs…" />
        ) : jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs found"
            description="Try adjusting your search filters or check back later."
          />
        ) : (
          <>
            <div className="space-y-3">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onView={() => navigate(`/student/jobs/${job.id}`)}
                />
              ))}
            </div>

            {/* Pagination */}
            {total > 10 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-ink-muted">
                  Page {page} · {total} jobs
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary"
                    disabled={page <= 1}
                    onClick={() => dispatch(setPage(page - 1))}>
                    ← Prev
                  </Button>
                  <Button size="sm" variant="secondary"
                    disabled={page * 10 >= total}
                    onClick={() => dispatch(setPage(page + 1))}>
                    Next →
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

function JobCard({ job, onView }) {
  const hasApplied = useSelector(selectHasAppliedToJob(job.id))
  const skills     = Array.isArray(job.required_skills) ? job.required_skills : []
  const companyName = job.recruiter?.company_name ?? job.company_name ?? '—'

  return (
    <div className="card-padded hover:shadow-card-md transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">

          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-ink">{job.title}</h3>
            {hasApplied && (
              <Badge variant="success" size="sm">✓ Applied</Badge>
            )}
            {job.role_category && (
              <Badge variant="info" size="sm">
                {job.role_category.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>

          {/* Company */}
          <p className="text-xs text-ink-secondary mt-0.5 font-medium">{companyName}</p>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {job.location && (
              <span className="flex items-center gap-1 text-xs text-ink-muted">
                <MapPin size={11} /> {job.location}
              </span>
            )}
            {job.deadline && (
              <span className="flex items-center gap-1 text-xs text-ink-muted">
                <Clock size={11} /> Closes {formatDate(job.deadline)}
              </span>
            )}
            {job.min_cgpa > 0 && (
              <span className="text-xs text-ink-muted">Min CGPA: {job.min_cgpa}</span>
            )}
            {job.package_lpa > 0 && (
              <span className="text-xs font-semibold text-status-success">
                ₹{job.package_lpa} LPA
              </span>
            )}
            {job.slots > 0 && (
              <span className="text-xs text-ink-muted">
                {job.slots} opening{job.slots !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Skills */}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {skills.slice(0, 5).map((s) => (
                <Badge key={s} variant="default" size="sm">{s}</Badge>
              ))}
              {skills.length > 5 && (
                <Badge variant="outline" size="sm">+{skills.length - 5} more</Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <Button size="sm" onClick={onView}>
            {hasApplied ? 'View' : 'View & Apply'}
          </Button>
        </div>
      </div>
    </div>
  )
}