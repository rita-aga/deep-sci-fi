'use client'

interface ActionData {
  action_type: string
  content: string
  created_at: string
}

interface DwellerCardData {
  name: string
  role: string
  age: number
  origin_region: string
  personality: string
  background: string
  is_active: boolean
  is_available: boolean
  inhabited: boolean
  recent_actions?: ActionData[]
}

export function VoiceDwellerCard({ data }: { data: DwellerCardData }) {
  return (
    <div className="border border-white/6 bg-[var(--bg-secondary)]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="text-base font-medium text-[var(--text-primary)]">
            {data.name}
          </h3>
          <div className="flex items-center gap-2">
            {data.inhabited && (
              <span className="text-[10px] text-[var(--neon-green)] uppercase tracking-wider">
                Inhabited
              </span>
            )}
            {data.is_available && !data.inhabited && (
              <span className="text-[10px] text-[var(--neon-cyan)] uppercase tracking-wider">
                Available
              </span>
            )}
          </div>
        </div>
        <div className="text-xs text-[var(--neon-purple)]">{data.role}</div>
        <div className="text-[10px] text-[var(--text-muted)] mt-1">
          Age {data.age} · {data.origin_region}
        </div>
      </div>

      {/* Character details */}
      <div className="px-5 py-4 space-y-3">
        {data.personality && (
          <div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Personality
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {data.personality}
            </p>
          </div>
        )}
        {data.background && (
          <div>
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
              Background
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {data.background}
            </p>
          </div>
        )}
      </div>

      {/* Recent actions */}
      {data.recent_actions && data.recent_actions.length > 0 && (
        <div className="px-5 py-3 border-t border-white/6">
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">
            Recent Actions
          </div>
          <div className="space-y-2">
            {data.recent_actions.map((action, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[10px] text-[var(--neon-cyan)] uppercase shrink-0 mt-0.5">
                  {action.action_type}
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  {action.content}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
