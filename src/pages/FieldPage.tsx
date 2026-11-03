import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getContent } from '../api'
import { GrasslandMap } from '../game/GrasslandMap'
import { levelCode, type Content, type Level, type Theme } from '../shared/content'

const trail = [
  { left: '18.8%', top: '57%' },
  { left: '42.7%', top: '55.6%' },
  { left: '67.7%', top: '54.8%' },
  { left: '84%', top: '56%' },
]

export function grasslandCampaign(content: Content) {
  const theme = content.themes.find((item) => item.id === 'theme-grassland') ?? content.themes[0]
  const levels = theme
    ? content.levels
        .filter((level) => level.themeId === theme.id)
        .map((level, index) => ({ level, code: levelCode(theme.number, index) }))
    : []
  return { theme, levels }
}

export function FieldPage() {
  const [content, setContent] = useState<Content | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getContent()
      .then(setContent)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : '内容服务没有响应')
      })
  }, [])

  const campaign = content ? grasslandCampaign(content) : null

  return (
    <main className="field">
      <header className="field-bar">
        <Link className="mark" to="/">
          王国保卫战
        </Link>
        <Link className="btn" to="/admin/levels">
          进入后台
        </Link>
      </header>
      <h1>{campaign?.theme?.name ?? '青青草原'}</h1>
      <p className="field-note">战役从 1-1 开始。点盾徽进入这一关。</p>
      <div className="campaign-map">
        {campaign?.theme?.id === 'theme-grassland' || !campaign ? <GrasslandMap className="stage" /> : <div className="stage" />}
        {campaign?.levels.map((entry, index) => (
          <CampaignPoint key={entry.level.id} entry={entry} index={index} theme={campaign.theme} />
        ))}
      </div>
      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : null}
    </main>
  )
}

function CampaignPoint({
  entry,
  index,
  theme,
}: {
  entry: { level: Level; code: string }
  index: number
  theme: Theme | undefined
}) {
  const spot = trail[index % trail.length]
  const ready = entry.level.routes.length > 0 && theme?.id === 'theme-grassland'
  const label = `${entry.code} ${entry.level.name}`
  if (!ready) {
    return (
      <p className="campaign-point is-locked" style={spot}>
        <span className="campaign-badge">{entry.code}</span>
        <span className="campaign-name">{entry.level.name}还不能开战，先把路线画到地图边缘。</span>
      </p>
    )
  }
  return (
    <Link className="campaign-point" style={spot} to={`/field/${entry.level.id}`} aria-label={`${label}，开始游戏`}>
      <span className="campaign-badge">{entry.code}</span>
      <span className="campaign-name">{entry.level.name}</span>
    </Link>
  )
}
