import { useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useDropzone } from 'react-dropzone'
import {
  UploadCloud, User, BookOpen, Briefcase,
  X, CheckCircle2, FileText,
} from 'lucide-react'
import DashboardLayout from '@/components/common/DashboardLayout'
import Button  from '@/components/common/Button'
import Badge   from '@/components/common/Badge'
import { selectCurrentUser, setCredentials } from '@/features/auth/authSlice'
import api, { getErrorMessage } from '@/services/api'
import toast from 'react-hot-toast'

const BRANCHES = [
  'Computer Engineering', 'Electronics and Telecommunication',
  'Information Technology', 'Mechanical Engineering',
  'Civil Engineering', 'Electrical Engineering',
]

const SKILLS_SUGGESTIONS = [
  'Python', 'JavaScript', 'React.js', 'Node.js', 'Java', 'C++',
  'SQL', 'MySQL', 'MongoDB', 'Docker', 'Git', 'Machine Learning',
  'Data Structures', 'System Design', 'REST API', 'TypeScript',
]

/**
 * Normalise the skills array that comes back from the backend.
 * The AI parser stores skills as { skill_name, proficiency_signal } objects,
 * while manually added skills are plain strings.  Always return strings.
 */
const flattenSkills = (raw = []) =>
  (raw ?? []).map((s) => (typeof s === 'string' ? s : s?.skill_name ?? '')).filter(Boolean)

export default function StudentProfile() {
  const dispatch = useDispatch()
  const user     = useSelector(selectCurrentUser)

  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    name:     user?.name     ?? '',
    branch:   user?.branch   ?? '',
    cgpa:     user?.cgpa     ?? '',
    backlogs: user?.backlogs ?? 0,
    skills:   flattenSkills(user?.skills),
    newSkill: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
  }

  const addSkill = (skill) => {
    const cleaned = skill.trim()
    if (cleaned && !form.skills.includes(cleaned))
      setForm((p) => ({ ...p, skills: [...p.skills, cleaned], newSkill: '' }))
  }

  const removeSkill = (skill) =>
    setForm((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }))

  // ── Save profile ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user?.student_id) {
      toast.error('Student profile ID not found. Please refresh the page.')
      return
    }
    setSaving(true)
    try {
      // PATCH student profile — uses the Student profile UUID (student_id),
      // NOT the User account UUID (id). They are different records.
      const res = await api.put(`/students/${user.student_id}`, {
        name:     form.name,
        branch:   form.branch,
        cgpa:     form.cgpa ? parseFloat(form.cgpa) : undefined,
        backlogs: parseInt(form.backlogs, 10) || 0,
        skills:   form.skills,           // plain string array
      })

      // Backend success() shape: { success, message, data: updatedStudent }
      const updated = res.data?.data ?? res.data?.student ?? res.data

      // Merge into Redux user — pass token: null to preserve existing token
      dispatch(setCredentials({
        token: null,    // intentionally null → authSlice keeps existing token
        user:  {
          ...user,
          name:     updated.name     ?? user.name,
          branch:   updated.branch   ?? user.branch,
          cgpa:     updated.cgpa     != null ? parseFloat(updated.cgpa) : user.cgpa,
          backlogs: updated.backlogs ?? user.backlogs,
          skills:   flattenSkills(updated.skills ?? form.skills),
          profile_complete: updated.profile_complete ?? user.profile_complete,
        },
      }))

      toast.success('Profile saved!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  // ── Resume upload ─────────────────────────────────────────────────────────
  const onDrop = useCallback(async (accepted) => {
    const file = accepted[0]
    if (!file) return
    if (!user?.student_id) {
      toast.error('Student profile ID not found. Please refresh the page.')
      return
    }
    setUploading(true)
    const formData = new FormData()
    formData.append('resume', file)
    try {
      const res = await api.post(
        `/students/${user.student_id}/resume`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      // Backend returns: { success, message, data: { resume_url, skills, skills_extracted } }
      const updated = res.data?.data ?? res.data

      dispatch(setCredentials({
        token: null,
        user: {
          ...user,
          resume_url: updated.resume_url ?? user.resume_url,
          skills:     flattenSkills(updated.skills ?? user.skills),
        },
      }))
      // Sync form skill list with freshly parsed skills
      setForm((p) => ({
        ...p,
        skills: flattenSkills(updated.skills ?? p.skills),
      }))
      toast.success(`Resume uploaded! ${updated.skills_extracted ?? 0} skills extracted.`)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setUploading(false)
    }
  }, [user, dispatch])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  })

  // ── Profile completion (reads from Redux user so it stays in sync) ────────
  const completion = Math.min(
    100,
    (user?.name        ? 20 : 0) +
    (user?.email       ? 20 : 0) +
    (user?.branch      ? 20 : 0) +
    (user?.cgpa        ? 20 : 0) +
    (user?.resume_url  ? 20 : 0),
  )

  return (
    <DashboardLayout>
      <div className="page-container max-w-2xl animate-fade-in space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-ink">My Profile</h1>
          <p className="text-sm text-ink-secondary mt-0.5">
            Keep your profile up to date for better job matches
          </p>
        </div>

        {/* Completion bar */}
        <div className="card-padded">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-ink-secondary">Profile Completion</span>
            <span className="text-xs font-semibold text-ink">{completion}%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-subtle overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-500 transition-all duration-500"
              style={{ width: `${completion}%` }}
            />
          </div>
          {user?.is_verified && (
            <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
              <CheckCircle2 size={12} /> Verified by TPO
            </p>
          )}
        </div>

        {/* Personal info */}
        <div className="card-padded space-y-4">
          <h2 className="section-title flex items-center gap-2">
            <User size={15} /> Personal Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name</label>
              <input
                name="name" value={form.name} onChange={handleChange}
                className="form-input" placeholder="Your full name"
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                value={user?.email ?? ''} disabled
                className="form-input bg-surface-muted text-ink-muted cursor-not-allowed"
              />
            </div>
            <div>
              <label className="form-label">Branch</label>
              <select
                name="branch" value={form.branch} onChange={handleChange}
                className="form-input bg-white"
              >
                <option value="">Select branch</option>
                {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Year of Study</label>
              <select
                name="year_of_study"
                value={form.year_of_study ?? user?.year_of_study ?? ''}
                onChange={handleChange}
                className="form-input bg-white"
              >
                <option value="">Select year</option>
                {[1,2,3,4].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">CGPA</label>
              <input
                name="cgpa" type="number" step="0.01" min="0" max="10"
                value={form.cgpa} onChange={handleChange}
                className="form-input" placeholder="e.g. 8.5"
              />
            </div>
            <div>
              <label className="form-label">Active Backlogs</label>
              <input
                name="backlogs" type="number" min="0"
                value={form.backlogs} onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card-padded space-y-3">
          <h2 className="section-title flex items-center gap-2">
            <BookOpen size={15} /> Technical Skills
            <span className="ml-auto text-xs font-normal text-ink-muted">
              {form.skills.length} skills
            </span>
          </h2>
          <div className="flex flex-wrap gap-1.5 min-h-[36px]">
            {form.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 chip bg-brand-50 text-brand-700 ring-1 ring-brand-200"
              >
                {skill}
                <button onClick={() => removeSkill(skill)} className="ml-0.5 hover:text-brand-900">
                  <X size={11} />
                </button>
              </span>
            ))}
            {form.skills.length === 0 && (
              <p className="text-sm text-ink-muted">No skills yet. Add them below or upload your resume.</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={form.newSkill}
              onChange={(e) => setForm((p) => ({ ...p, newSkill: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); addSkill(form.newSkill) }
              }}
              className="form-input flex-1"
              placeholder="Type a skill and press Enter…"
            />
            <Button size="md" variant="secondary" onClick={() => addSkill(form.newSkill)}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SKILLS_SUGGESTIONS
              .filter((s) => !form.skills.includes(s))
              .slice(0, 8)
              .map((s) => (
                <button
                  key={s} onClick={() => addSkill(s)}
                  className="chip bg-surface-subtle text-ink-secondary ring-1 ring-surface-border hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200 transition-colors text-xs"
                >
                  + {s}
                </button>
              ))}
          </div>
        </div>

        {/* Resume */}
        <div className="card-padded space-y-3">
          <h2 className="section-title flex items-center gap-2">
            <Briefcase size={15} /> Resume
          </h2>
          {user?.resume_url && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 size={14} className="text-green-600" />
              <span className="text-xs text-green-700 font-medium">Resume uploaded</span>
              <a
                href={user.resume_url}
                target="_blank" rel="noopener noreferrer"
                className="ml-auto text-xs text-green-600 hover:underline flex items-center gap-1"
              >
                <FileText size={11} /> View
              </a>
            </div>
          )}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-brand-400 bg-brand-50'
                : 'border-surface-border hover:border-brand-300 hover:bg-surface-muted'
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud
              size={28}
              className={`mx-auto mb-3 ${isDragActive ? 'text-brand-500' : 'text-ink-muted'}`}
            />
            {uploading ? (
              <p className="text-sm text-ink-secondary animate-pulse">
                Uploading and parsing resume…
              </p>
            ) : isDragActive ? (
              <p className="text-sm text-brand-600 font-medium">Drop your resume here</p>
            ) : (
              <>
                <p className="text-sm font-medium text-ink mb-1">
                  Drop your resume here or click to browse
                </p>
                <p className="text-xs text-ink-muted">PDF only · Max 5 MB</p>
              </>
            )}
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            Save Information
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}