import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getContent } from '../api'
import { GrasslandMap } from '../game/GrasslandMap'
import type { Content, LevelRoute, MapPoint } from '../shared/content'
import { mapHeight, mapWidth } from '../shared/map'
import { grasslandCampaign } from './FieldPage'

function markerPoint(point: MapPoint): MapPoint {
  const inset = 28
  let x = point.x
  let y = point.y
  if (point.x <= 0.5) x = inset
  else if (point.x >= mapWidth - 0.5) x = mapWidth - inset
  if (point.y <= 0.5) y = inset
  else if (point.y >= mapHeight - 0.5) y = mapHeight - inset
  return { x, y }
}

export function BattlePage() {
  const { levelId } = useParams()
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
  const entry = campaign?.levels.find((item) => item.level.id === levelId)
  const roads = useMemo(() => {
    const level = content?.levels.find((item) => item.id === levelId)
    return level?.routes.map((route) => route.points) ?? []
  }, [content, levelId])

  return (
    <main className="field">
      <header className="field-bar">
        <Link className="field-back" to="/field">
          返回战役
        </Link>
        <Link className="btn" to="/admin/levels">
          进入后台
        </Link>
      </header>
      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : !content ? (
        <p className="field-note">正在打开这一关。</p>
      ) : !entry ? (
        <p className="field-note">战役上没有这一关。</p>
      ) : entry.level.routes.length === 0 ? (
        <p className="field-note">{entry.code} 还没有路线，先在后台从地图边缘画到另一边。</p>
      ) : (
        <>
          <div className="battle-bar">
            <h1>
              {entry.code} {entry.level.name}
            </h1>
            <dl className="battle-stats">
              <div>
                <dt>金币</dt>
                <dd>{entry.level.startingGold}</dd>
              </div>
              <div>
                <dt>波次</dt>
                <dd>
                  1/{entry.level.waveCount}
                </dd>
              </div>
            </dl>
          </div>
          <div className="map-frame battle-map">
            <GrasslandMap className="stage" routes={roads} />
            <svg className="route-overlay is-idle" viewBox={`0 0 ${mapWidth} ${mapHeight}`} preserveAspectRatio="none" aria-hidden="true">
              {entry.level.routes.map((route, index) => (
                <RouteMarks key={route.id} route={route} index={index} />
              ))}
            </svg>
          </div>
          <p className="field-note">这一关已经开始。红点是出怪口，绿点是防守终点。第 1 波按这一关的安排出发。</p>
        </>
      )}
    </main>
  )
}

function RouteMarks({ route, index }: { route: LevelRoute; index: number }) {
  if (route.points.length < 2) return null
  const start = markerPoint(route.points[0])
  const end = markerPoint(route.points[route.points.length - 1])
  return (
    <g>
      <circle cx={start.x} cy={start.y} r="13" fill="#8e2e2e" stroke="#fff8ea" strokeWidth="2" />
      <text x={start.x} y={start.y} textAnchor="middle" dominantBaseline="central" fill="#fff8ea" fontSize="14">
        {index + 1}
      </text>
      <rect x={end.x - 9} y={end.y - 9} width="18" height="18" fill="#215c40" stroke="#fff8ea" strokeWidth="2" />
    </g>
  )
}
