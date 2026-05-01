import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Minus,
  BookOpen, AlertTriangle, CheckCircle2, XCircle,
  ChevronRight, Zap,
} from 'lucide-react'
import {
  fetchSkillGap,
  selectSkillGapReport,
  selectSkillGapLoading,
} from '@/features/skillGap/skillGapSlice'
import Button from '@/components/common/Button'
import { SeverityBadge } from '@/components/common/Badge'

// ─── Trend icon helper ───────────────────────────────────────────────────────
function TrendIcon({ trend }) {
  if (trend === 'rising')   return <TrendingUp size={11} className="text-status-success" />
  if (trend === 'declining') return <TrendingDown size={11} className="text-status-danger" />
  return <Minus size={11} className="text-ink-muted" />
}

// ─── Tag colour helper ───────────────────────────────────────────────────────
const TAG_STYLES = {
  CRITICAL:     'bg-red-50 text-red-700 ring-1 ring-red-200',
  IMPORTANT:    'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  NICE_TO_HAVE: 'bg-surface-subtle text-ink-secondary ring-1 ring-surface-border',
}

// ─── Severity banner ─────────────────────────────────────────────────────────
const SEVERITY_BANNER = {
  critical: {
    bg: 'bg-red-50 border-red-200',
    icon: XCircle,
    iconColor: 'text-red-500',
    text: 'You have significant skill gaps for this role.',
  },
  moderate: {
    bg: 'bg-amber-50 border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    text: 'You meet some requirements but have gaps to address.',
  },
  ready: {
    bg: 'bg-green-50 border-green-200',
    icon: CheckCircle2,
    iconColor: 'text-green-500',
    text: "Great profile match! You're ready to apply.",
  },
}

// ─── Numeric coercion guard ──────────────────────────────────────────────────
// MySQL returns DECIMAL columns as strings; normalizeReport() in skillGapSlice
// parses them, but this helper ensures the component never crashes even if an
// un-normalised value somehow reaches the render layer.
const toNum = (v) => (v == null ? 0 : parseFloat(v) || 0)

export default function SkillGapAlert({ jobId }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const report = useSelector(selectSkillGapReport(jobId))
  const loading = useSelector(selectSkillGapLoading(jobId))

  useEffect(() => {
    if (jobId && !report) {
      dispatch(fetchSkillGap(jobId))
    }
  }, [jobId, report, dispatch])

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="card p-5 space-y-3 animate-pulse">
        <div className="h-4 w-40 bg-surface-subtle rounded" />
        <div className="h-3 w-full bg-surface-subtle rounded" />
        <div className="h-3 w-3/4 bg-surface-subtle rounded" />
        <div className="flex gap-2 mt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-7 w-24 bg-surface-subtle rounded-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!report) return null

  const banner = SEVERITY_BANNER[report.severity] ?? SEVERITY_BANNER.moderate
  const BannerIcon = banner.icon

  return (
    <div className={`rounded-xl border ${banner.bg} overflow-hidden animate-slide-up`}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-inherit">
        <div className="flex items-center gap-2.5">
          <BannerIcon size={17} className={banner.iconColor} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">Skill Gap Analysis</span>
              <SeverityBadge severity={report.severity} size="sm" />
            </div>
            <p className="text-xs text-ink-secondary mt-0.5">{banner.text}</p>
          </div>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-2xl font-semibold text-ink leading-none">
            {toNum(report.overall_match).toFixed(0)}
            <span className="text-sm font-normal text-ink-muted">%</span>
          </p>
          <p className="text-[11px] text-ink-muted mt-0.5">match</p>
        </div>
      </div>

      {/* ── Three panels ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-inherit">

        {/* Missing skills */}
        <div className="p-4">
          <p className="text-xs font-semibold text-ink uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <XCircle size={12} className="text-red-500" /> Missing Skills
          </p>
          {report.missing_skills?.length === 0 ? (
            <p className="text-xs text-ink-muted">None — great fit!</p>
          ) : (
            <div className="space-y-2">
              {report.missing_skills?.slice(0, 5).map((skill) => (
                <div key={skill.skill_name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`chip text-[10px] px-1.5 py-0.5 shrink-0 ${
                        TAG_STYLES[skill.tag] ?? TAG_STYLES.NICE_TO_HAVE
                      }`}
                    >
                      {skill.tag === 'CRITICAL' ? 'Critical' : skill.tag === 'IMPORTANT' ? 'Imp.' : 'Nice'}
                    </span>
                    <span className="text-xs text-ink truncate">{skill.skill_name}</span>
                  </div>
                  <TrendIcon trend={skill.demand_trend} />
                </div>
              ))}
              {report.missing_skills?.length > 5 && (
                <p className="text-[11px] text-ink-muted">
                  +{report.missing_skills.length - 5} more
                </p>
              )}
            </div>
          )}
        </div>

        {/* Weak skills */}
        <div className="p-4">
          <p className="text-xs font-semibold text-ink uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-amber-500" /> Needs Improvement
          </p>
          {report.weak_skills?.length === 0 ? (
            <p className="text-xs text-ink-muted">All matched skills at required level.</p>
          ) : (
            <div className="space-y-2.5">
              {report.weak_skills?.slice(0, 4).map((skill) => (
                <div key={skill.skill_name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-ink truncate">{skill.skill_name}</span>
                    <span className="text-ink-muted shrink-0 ml-2">
                      {toNum(skill.student_score).toFixed(0)} / {toNum(skill.required_score).toFixed(0)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-subtle overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${Math.min(100, (toNum(skill.student_score) / (toNum(skill.required_score) || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Market demand */}
        <div className="p-4">
          <p className="text-xs font-semibold text-ink uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Zap size={12} className="text-brand-500" /> Market Demand
          </p>
          <div className="space-y-1.5">
            {report.market_demand?.slice(0, 5).map((skill) => (
              <div key={skill.skill_name} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-0.5">
                    <span
                      className={`truncate ${
                        skill.in_student_profile ? 'text-status-success font-medium' : 'text-ink'
                      }`}
                    >
                      {skill.skill_name}
                    </span>
                    <span className="text-ink-muted shrink-0 ml-1">{toNum(skill.demand_score).toFixed(0)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-surface-subtle overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        skill.in_student_profile ? 'bg-green-400' : 'bg-brand-400'
                      }`}
                      style={{ width: `${toNum(skill.demand_score)}%` }}
                    />
                  </div>
                </div>
                <TrendIcon trend={skill.demand_trend} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer CTA ──────────────────────────────────────────── */}
      <div className="px-5 py-3 border-t border-inherit flex items-center justify-between">
        <p className="text-xs text-ink-secondary flex items-center gap-1.5">
          <BookOpen size={12} />
          {report.learning_path?.length ?? 0} learning resources in your path
        </p>
        <Button
          size="sm"
          variant="ghost"
          rightIcon={<ChevronRight size={13} />}
          onClick={() => navigate(`/student/skill-gap/${jobId}`)}
        >
          View Full Report
        </Button>
      </div>
    </div>
  )
}