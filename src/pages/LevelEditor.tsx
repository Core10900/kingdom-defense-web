import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { saveLevelRoutes } from '../api'
import { GrasslandMap } from '../game/GrasslandMap'
import type { Level, LevelRoute, MapPoint, Theme } from '../shared/content'
import { clampToMap, edgeMargin, mapHeight, mapWidth, routeLength, snapToEdge } from '../shared/map'

const routeColors = ['#6B4E32', '#8E2E2E', '#215C40', '#3E4C8A', '#8F6420']

function mapPoint(event: ReactPointerEvent<SVGSVGElement>): MapPoint {
  const rect = event.currentTarget.getBoundingClientRect()
  return {
    x: ((event.clientX - rect.left) / rect.width) * mapWidth,
    y: ((event.clientY - rect.top) / rect.height) * mapHeight,
  }
}

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

function pointsOf(points: MapPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(' ')
}

export function LevelEditor({
  level,
  theme,
  onSaved,
}: {
  level: Level
  theme: Theme
  onSaved: (level: Level) => void
}) {
  const [drawing, setDrawing] = useState(false)
  const [draft, setDraft] = useState<LevelRoute[]>(level.routes)
  const [live, setLive] = useState<MapPoint[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const strokeId = useRef<number | null>(null)
  const liveRef = useRef<MapPoint[] | null>(null)

  useEffect(() => {
    if (!drawing) setDraft(level.routes)
  }, [level, drawing])

  function setStroke(next: MapPoint[] | null) {
    liveRef.current = next
    setLive(next)
  }

  function beginDrawing() {
    setDraft(level.routes.map((route) => ({ ...route, points: route.points.map((point) => ({ ...point })) })))
    setStroke(null)
    setMessage(null)
    setStatus(null)
    setDrawing(true)
  }

  function cancelDrawing() {
    strokeId.current = null
    setStroke(null)
    setMessage(null)
    setDraft(level.routes)
    setDrawing(false)
  }

  function undoStroke() {
    if (liveRef.current) {
      strokeId.current = null
      setStroke(null)
      return
    }
    setDraft((current) => current.slice(0, -1))
    setMessage(null)
  }

  async function confirmRoutes() {
    if (draft.length === 0 || saving) return
    strokeId.current = null
    setStroke(null)
    setSaving(true)
    setMessage(null)
    try {
      const saved = await saveLevelRoutes(level.id, draft)
      onSaved(saved)
      setDraft(saved.routes)
      setDrawing(false)
      setStatus('路线已保存')
    } catch (reason: unknown) {
      setMessage(reason instanceof Error ? reason.message : '路线没有保存')
    } finally {
      setSaving(false)
    }
  }

  function onPointerDown(event: ReactPointerEvent<SVGSVGElement>) {
    if (!drawing || saving) return
    const start = snapToEdge(mapPoint(event))
    if (!start) {
      setMessage('起点要落在地图边缘')
      return
    }
    strokeId.current = event.pointerId
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Some pointer events cannot be captured. The stroke still follows this element.
    }
    setStroke([start])
    setMessage(null)
    setStatus(null)
  }

  function onPointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (strokeId.current !== event.pointerId) return
    const current = liveRef.current
    if (!current || current.length === 0) return
    const cursor = clampToMap(mapPoint(event))
    let next: MapPoint[]
    if (current.length === 1) {
      const start = current[0]
      next = Math.hypot(cursor.x - start.x, cursor.y - start.y) < 4 ? current : [start, cursor]
    } else {
      const last = current[current.length - 1]
      if (Math.hypot(cursor.x - last.x, cursor.y - last.y) < 8) {
        next = current.slice()
        next[next.length - 1] = cursor
      } else {
        next = [...current, cursor]
      }
    }
    setStroke(next)
  }

  function finishStroke(event: ReactPointerEvent<SVGSVGElement>) {
    if (strokeId.current !== event.pointerId) return
    strokeId.current = null
    const current = liveRef.current
    setStroke(null)
    if (!current || current.length === 0) return
    const end = snapToEdge(mapPoint(event))
    if (!end) {
      setMessage('终点要落在地图边缘')
      return
    }
    const points = current.length === 1 ? [current[0], end] : [...current.slice(0, -1), end]
    if (routeLength(points) < 40) {
      setMessage('路线太短，请从一边画到另一边。')
      return
    }
    setDraft((routes) => [...routes, { id: `route_${crypto.randomUUID().slice(0, 8)}`, points }])
    setMessage(null)
  }

  function onPointerCancel(event: ReactPointerEvent<SVGSVGElement>) {
    if (strokeId.current !== event.pointerId) return
    strokeId.current = null
    setStroke(null)
    setMessage('这一笔没有画完')
  }

  const shown = live ? [...draft, { id: 'live', points: live }] : draft

  return (
    <section className="level-editor">
      <div className="map-frame">
        {theme.id === 'theme-grassland' ? <GrasslandMap /> : <div className="map-plate" />}
        <svg
          className={drawing ? 'route-overlay' : 'route-overlay is-idle'}
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          preserveAspectRatio="none"
          aria-label={drawing ? '在地图上绘制路线' : '关卡路线'}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishStroke}
          onPointerCancel={onPointerCancel}
        >
          {drawing ? (
            <>
              <rect className="edge-band" x="0" y="0" width={mapWidth} height={edgeMargin} />
              <rect className="edge-band" x="0" y={mapHeight - edgeMargin} width={mapWidth} height={edgeMargin} />
              <rect className="edge-band" x="0" y="0" width={edgeMargin} height={mapHeight} />
              <rect className="edge-band" x={mapWidth - edgeMargin} y="0" width={edgeMargin} height={mapHeight} />
            </>
          ) : null}
          <rect width={mapWidth} height={mapHeight} fill="transparent" />
          {shown.map((route, index) => {
            if (route.points.length < 2) return null
            const color = routeColors[index % routeColors.length]
            const start = markerPoint(route.points[0])
            const end = markerPoint(route.points[route.points.length - 1])
            return (
              <g key={route.id}>
                <polyline points={pointsOf(route.points)} fill="none" stroke="#241c14" strokeWidth="14" strokeLinejoin="round" strokeLinecap="round" />
                <polyline points={pointsOf(route.points)} fill="none" stroke={color} strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" />
                <circle cx={start.x} cy={start.y} r="13" fill="#8e2e2e" stroke="#fff8ea" strokeWidth="2" />
                <text x={start.x} y={start.y} textAnchor="middle" dominantBaseline="central" fill="#fff8ea" fontSize="14">
                  {index + 1}
                </text>
                <rect x={end.x - 9} y={end.y - 9} width="18" height="18" fill="#215c40" stroke="#fff8ea" strokeWidth="2" />
              </g>
            )
          })}
        </svg>
      </div>
      {drawing ? (
        <p className="hint">从地图边缘落笔，在边缘收笔。落笔处是怪物出发点，收笔处是防守终点。</p>
      ) : draft.length === 0 ? (
        <p className="hint">还没有路线。点击绘制路线，从地图边缘画到另一边。</p>
      ) : (
        <p className="hint">红点是怪物出发点，绿点是防守终点。共 {draft.length} 条路线。</p>
      )}
      {message ? (
        <p className="alert" role="alert">
          {message}
        </p>
      ) : status ? (
        <p className="hint" role="status">
          {status}
        </p>
      ) : null}
      <div className="toolbar">
        {drawing ? (
          <>
            <button className="btn" type="button" onClick={undoStroke} disabled={saving || (draft.length === 0 && !live)}>
              撤销上一笔
            </button>
            <button className="btn btn-gold" type="button" onClick={() => void confirmRoutes()} disabled={saving || draft.length === 0}>
              确定
            </button>
            <button className="btn" type="button" onClick={cancelDrawing} disabled={saving}>
              取消
            </button>
          </>
        ) : (
          <button className="btn btn-gold" type="button" onClick={beginDrawing}>
            绘制路线
          </button>
        )}
      </div>
    </section>
  )
}
