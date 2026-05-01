import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { X, PlusCircle, Briefcase, Info } from 'lucide-react'
import DashboardLayout from '@/components/common/DashboardLayout'
import Button from '@/components/common/Button'
import { createJob } from '@/features/jobs/jobsSlice'
import toast from 'react-hot-toast'

const BRANCHES = [
  'Computer Engineering', 'Electronics and Telecommunication',
  'Information Technology', 'Mechanical Engineering',
  'Civil Engineering', 'Electrical Engineering', 'All Branches',
]

const ROLE_CATEGORIES = [
  'software_engineer', 'data_scientist', 'devops_engineer', 'ml_engineer',
  'product_manager', 'business_analyst', 'ux_designer', 'cybersecurity_analyst',
  'cloud_architect', 'embedded_systems',
]

const COMMON_SKILLS = [
  'Python', 'JavaScript', 'React.js', 'Node.js', 'Java', 'SQL',
  'Machine Learning', 'Docker', 'Git', 'REST API', 'System Design', 'TypeScript',
]

export default function PostJob() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title:             '',
    description:       '',
    role_category:     'software_engineer',
    required_skills:   [],
    min_cgpa:          '',
    eligible_branches: [],
    package_lpa:       '',
    slots:             '',
    deadline:          '',
    skillInput:        '',
  })
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    setErrors((p) => ({ ...p, [name]: '' }))
  }

  const addSkill = (skill) => {
    const s = skill.trim()
    if (s && !form.required_skills.includes(s)) {
      setForm((p) => ({ ...p, required_skills: [...p.required_skills, s], skillInput: '' }))
    }
  }

  const removeSkill = (s) =>
    setForm((p) => ({ ...p, required_skills: p.required_skills.filter((x) => x !== s) }))

  const toggleBranch = (b) => {
    setForm((p) => ({
      ...p,
      eligible_branches: p.eligible_branches.includes(b)
        ? p.eligible_branches.filter((x) => x !== b)
        : [...p.eligible_branches, b],
    }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim())       errs.title       = 'Job title is required'
    if (!form.description.trim()) errs.description = 'Description is required'
    if (!form.deadline)           errs.deadline    = 'Deadline is required'
    if (form.required_skills.length === 0) errs.required_skills = 'Add at least one required skill'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)

    // Build clean payload — only include fields with values
    // Do NOT send status — backend always creates jobs as 'draft' pending approval
    const payload = {
      title:           form.title.trim(),
      description:     form.description.trim(),
      role_category:   form.role_category,
      required_skills: form.required_skills,
      eligible_branches: form.eligible_branches,
      deadline:        form.deadline,
      ...(form.min_cgpa    && { min_cgpa:    parseFloat(form.min_cgpa) }),
      ...(form.package_lpa && { package_lpa: parseFloat(form.package_lpa) }),
      ...(form.slots       && { slots:       parseInt(form.slots, 10) }),
    }

    const result = await dispatch(createJob(payload))
    setLoading(false)

    if (createJob.fulfilled.match(result)) {
      toast.success(
        'Job submitted for review. The placement officer will approve and activate it.',
        { duration: 5000 }
      )
      navigate('/recruiter/jobs')
    } else {
      toast.error(result.payload || 'Failed to post job. Please try again.')
    }
  }

  return (
    <DashboardLayout>
      <div className="page-container max-w-2xl animate-fade-in">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-ink">Post a New Job</h1>
          <p className="text-sm text-ink-secondary mt-0.5">
            Fill in the details below to create a new listing
          </p>
        </div>

        {/* Approval notice */}
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800 mb-5">
          <Info size={15} className="shrink-0 mt-0.5" />
          <p>
            New job postings require approval from the Placement Officer before
            students can view and apply. You will see the job listed as
            <strong> "Pending Approval"</strong> until then.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Basic info */}
          <div className="card-padded space-y-4">
            <h2 className="section-title flex items-center gap-2">
              <Briefcase size={15} /> Job Details
            </h2>

            <div>
              <label className="form-label">Job Title *</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className={`form-input ${errors.title ? 'border-status-danger' : ''}`}
                placeholder="e.g. Software Engineer – Backend"
              />
              {errors.title && <p className="form-error">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Role Category</label>
                <select
                  name="role_category"
                  value={form.role_category}
                  onChange={handleChange}
                  className="form-input bg-white"
                >
                  {ROLE_CATEGORIES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Application Deadline *</label>
                <input
                  name="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`form-input ${errors.deadline ? 'border-status-danger' : ''}`}
                />
                {errors.deadline && <p className="form-error">{errors.deadline}</p>}
              </div>
            </div>

            <div>
              <label className="form-label">Job Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                className={`form-input resize-none ${errors.description ? 'border-status-danger' : ''}`}
                placeholder="Describe the role, responsibilities, and what you're looking for…"
              />
              {errors.description && <p className="form-error">{errors.description}</p>}
            </div>
          </div>

          {/* Required Skills */}
          <div className="card-padded space-y-3">
            <h2 className="section-title">Required Skills *</h2>

            <div className="flex flex-wrap gap-1.5 min-h-[36px]">
              {form.required_skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 chip bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    className="ml-0.5 hover:text-brand-900"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
              {form.required_skills.length === 0 && (
                <p className="text-sm text-ink-muted">No skills added yet.</p>
              )}
            </div>
            {errors.required_skills && (
              <p className="form-error">{errors.required_skills}</p>
            )}

            <div className="flex gap-2">
              <input
                value={form.skillInput}
                onChange={(e) => setForm((p) => ({ ...p, skillInput: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addSkill(form.skillInput) }
                }}
                className="form-input flex-1"
                placeholder="Type a skill and press Enter…"
              />
              <Button
                type="button"
                size="md"
                variant="secondary"
                onClick={() => addSkill(form.skillInput)}
              >
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {COMMON_SKILLS.filter((s) => !form.required_skills.includes(s)).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSkill(s)}
                  className="chip bg-surface-subtle text-ink-secondary ring-1 ring-surface-border hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200 transition-colors text-xs"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>

          {/* Eligibility */}
          <div className="card-padded space-y-4">
            <h2 className="section-title">Eligibility Criteria</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Minimum CGPA</label>
                <input
                  name="min_cgpa"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={form.min_cgpa}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. 7.0"
                />
              </div>
              <div>
                <label className="form-label">Package (LPA)</label>
                <input
                  name="package_lpa"
                  type="number"
                  step="0.5"
                  value={form.package_lpa}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. 12"
                />
              </div>
              <div>
                <label className="form-label">Openings / Slots</label>
                <input
                  name="slots"
                  type="number"
                  min="1"
                  value={form.slots}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. 5"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Eligible Branches</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {BRANCHES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => toggleBranch(b)}
                    className={`chip text-xs transition-all ${
                      form.eligible_branches.includes(b)
                        ? 'bg-brand-600 text-white ring-1 ring-brand-700'
                        : 'bg-surface-subtle text-ink-secondary ring-1 ring-surface-border hover:ring-brand-300'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <p className="text-xs text-ink-muted mt-1.5">
                Leave empty to allow all branches.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/recruiter/jobs')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              leftIcon={<PlusCircle size={15} />}
            >
              Submit for Approval
            </Button>
          </div>

        </form>
      </div>
    </DashboardLayout>
  )
}