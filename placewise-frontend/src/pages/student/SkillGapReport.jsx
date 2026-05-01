import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Radar } from 'react-chartjs-2'
import {
  Chart as ChartJS, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend,
} from 'chart.js'
import { ArrowLeft, BookOpen, TrendingUp, TrendingDown, Minus, ExternalLink, Zap } from 'lucide-react'
import DashboardLayout from '@/components/common/DashboardLayout'
import { PageLoader } from '@/components/common/Loader'
import Badge from '@/components/common/Badge'
import { SeverityBadge } from '@/components/common/Badge'
import { fetchSkillGap, fetchLearningPath, selectSkillGapReport, selectLearningPath, selectSkillGapLoading } from '@/features/skillGap/skillGapSlice'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const TABS = ['Overview', 'Missing Skills', 'Weak Skills', 'Market Demand', 'Learning Path']

function TrendIcon({ trend }) {
  if (trend === 'rising') return <TrendingUp size={12} className="text-green-500" />
  if (trend === 'declining') return <TrendingDown size={12} className="text-red-500" />
  return <Minus size={12} className="text-ink-muted" />
}

export default function SkillGapReport() {
  const { jobId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const report = useSelector(selectSkillGapReport(jobId))
  const learningPath = useSelector(selectLearningPath(jobId))
  const loading = useSelector(selectSkillGapLoading(jobId))
  const [tab, setTab] = useState('Overview')

  useEffect(() => {
    if (jobId) {
      if (!report) dispatch(fetchSkillGap(jobId))
      dispatch(fetchLearningPath(jobId))
    }
  }, [jobId, dispatch, report])

  if (loading || !report) return <DashboardLayout><PageLoader text="Generating skill gap report…" /></DashboardLayout>

  // Build radar data from top skills
  const radarSkills = [
    ...(report.missing_skills ?? []).slice(0, 4).map((s) => ({ name: s.skill_name, student: 0, required: s.demand_score ?? 80 })),
    ...(report.weak_skills ?? []).slice(0, 3).map((s) => ({ name: s.skill_name, student: s.student_score, required: s.required_score })),
  ]

  const radarData = {
    labels: radarSkills.map((s) => s.name),
    datasets: [
      {
        label: 'Your Score', data: radarSkills.map((s) => s.student),
        backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.8)',
        borderWidth: 2, pointBackgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Required', data: radarSkills.map((s) => s.required),
        backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.6)',
        borderWidth: 2, pointBackgroundColor: 'rgba(239, 68, 68, 0.6)', borderDash: [4, 4],
      },
    ],
  }

  const radarOptions = {
    scales: { r: { min: 0, max: 100, ticks: { stepSize: 25, font: { size: 10 } }, pointLabels: { font: { size: 11 } } } },
    plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } } },
    responsive: true, maintainAspectRatio: true,
  }

  return (
    <DashboardLayout>
      <div className="page-container max-w-4xl animate-fade-in space-y-5">
        {/* Back */}
        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink transition-colors">
          <ArrowLeft size={15} /> Back
        </button>

        {/* Header */}
        <div className="card-padded flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-ink">Skill Gap Report</h1>
            <p className="text-sm text-ink-secondary mt-0.5">Personalised analysis for this role</p>
          </div>
          <div className="flex items-center gap-3">
            <SeverityBadge severity={report.severity} />
            <div className="text-right">
              <p className="text-3xl font-semibold text-ink leading-none">
                {report.overall_match?.toFixed(0)}<span className="text-base font-normal text-ink-muted">%</span>
              </p>
              <p className="text-xs text-ink-muted">overall match</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-subtle border border-surface-border rounded-xl p-1 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                tab === t ? 'bg-white text-ink shadow-card' : 'text-ink-secondary hover:text-ink'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'Overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card-padded">
              <h2 className="section-title mb-4">Skill Radar</h2>
              {radarSkills.length > 0
                ? <Radar data={radarData} options={radarOptions} />
                : <p className="text-sm text-ink-muted text-center py-8">No gap data to visualise.</p>}
            </div>
            <div className="card-padded space-y-4">
              <h2 className="section-title">Summary</h2>
              <SummaryRow label="Missing Skills" value={report.missing_skills?.length ?? 0} color="text-status-danger" />
              <SummaryRow label="Skills to Improve" value={report.weak_skills?.length ?? 0} color="text-status-warning" />
              <SummaryRow label="Strong Matches" value={report.extra_skills?.length ?? 0} color="text-status-success" />
              <SummaryRow label="Learning Resources" value={learningPath?.length ?? 0} color="text-brand-600" />
              {(report.extra_skills?.length ?? 0) > 0 && (
                <div>
                  <p className="text-xs font-medium text-ink-muted mb-2">Bonus Skills You Have</p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.extra_skills.map((s) => <Badge key={s} variant="success" size="sm">{s}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'Missing Skills' && (
          <div className="card-padded space-y-3">
            {(report.missing_skills ?? []).length === 0
              ? <p className="text-sm text-ink-muted py-4 text-center">No missing skills — great profile fit!</p>
              : (report.missing_skills ?? []).map((skill) => (
                <div key={skill.skill_name} className="flex items-center justify-between gap-4 py-2 border-b border-surface-divider last:border-0">
                  <div className="flex items-center gap-2.5">
                    <Badge variant={skill.tag === 'CRITICAL' ? 'danger' : skill.tag === 'IMPORTANT' ? 'warning' : 'default'} size="sm">
                      {skill.tag}
                    </Badge>
                    <span className="text-sm text-ink">{skill.skill_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-ink-muted">Demand: {skill.demand_score?.toFixed(0)}</span>
                    <TrendIcon trend={skill.demand_trend} />
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === 'Weak Skills' && (
          <div className="card-padded space-y-4">
            {(report.weak_skills ?? []).length === 0
              ? <p className="text-sm text-ink-muted py-4 text-center">All matched skills are at the required level!</p>
              : (report.weak_skills ?? []).map((skill) => (
                <div key={skill.skill_name}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-ink">{skill.skill_name}</span>
                    <span className="text-ink-muted text-xs">
                      {skill.student_score?.toFixed(0)} / {skill.required_score?.toFixed(0)} (gap: {skill.gap_delta?.toFixed(0)})
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-subtle overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${Math.min(100, (skill.student_score / skill.required_score) * 100)}%` }} />
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === 'Market Demand' && (
          <div className="card-padded space-y-4">
            <div className="flex items-center gap-2 text-xs text-ink-muted mb-2">
              <span className="w-3 h-3 rounded-sm bg-green-400 inline-block" /> You have this skill
              <span className="w-3 h-3 rounded-sm bg-brand-400 inline-block ml-3" /> You're missing this
            </div>
            {(report.market_demand ?? []).map((skill) => (
              <div key={skill.skill_name} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`font-medium ${skill.in_student_profile ? 'text-status-success' : 'text-ink'}`}>
                      {skill.skill_name}
                    </span>
                    <span className="text-xs text-ink-muted">{skill.demand_score?.toFixed(0)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-subtle overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${skill.in_student_profile ? 'bg-green-400' : 'bg-brand-400'}`}
                      style={{ width: `${skill.demand_score ?? 0}%` }} />
                  </div>
                </div>
                <TrendIcon trend={skill.demand_trend} />
              </div>
            ))}
          </div>
        )}

        {tab === 'Learning Path' && (
          <div className="space-y-3">
            {(learningPath ?? []).length === 0
              ? <div className="card-padded text-center py-8"><p className="text-sm text-ink-muted">No learning path generated yet.</p></div>
              : (learningPath ?? []).map((step, i) => (
                <div key={i} className="card-padded flex items-start gap-4">
                  <div className="w-7 h-7 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-xs font-semibold text-brand-600 shrink-0">
                    {step.order ?? i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-ink">{step.skill_name}</p>
                      <Badge variant={step.priority === 'urgent' ? 'danger' : step.priority === 'high' ? 'warning' : 'default'} size="sm">
                        {step.priority}
                      </Badge>
                      {step.is_free && <Badge variant="success" size="sm">Free</Badge>}
                    </div>
                    <p className="text-xs text-ink-secondary mt-0.5">{step.course_title}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-ink-muted">{step.platform}</span>
                      {step.duration_hrs && <span className="text-xs text-ink-muted">{step.duration_hrs}h</span>}
                      {step.url && (
                        <a href={step.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-brand-600 flex items-center gap-1 hover:underline">
                          <ExternalLink size={11} /> Start learning
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function SummaryRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-divider last:border-0">
      <span className="text-sm text-ink-secondary">{label}</span>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  )
}