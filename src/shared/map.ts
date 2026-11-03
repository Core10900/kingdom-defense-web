import type { MapPoint } from './content.ts'

export const mapWidth = 960
export const mapHeight = 540
export const edgeMargin = 48

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function isOnBorder(point: MapPoint) {
  const epsilon = 0.5
  return (
    point.x >= -epsilon &&
    point.y >= -epsilon &&
    point.x <= mapWidth + epsilon &&
    point.y <= mapHeight + epsilon &&
    (point.x <= epsilon || point.y <= epsilon || point.x >= mapWidth - epsilon || point.y >= mapHeight - epsilon)
  )
}

/** Pull a point onto the nearest map border when it lands in the edge band. */
export function snapToEdge(point: MapPoint): MapPoint | null {
  const candidates = [
    { distance: Math.abs(point.x), spot: { x: 0, y: clamp(point.y, 0, mapHeight) } },
    { distance: Math.abs(mapWidth - point.x), spot: { x: mapWidth, y: clamp(point.y, 0, mapHeight) } },
    { distance: Math.abs(point.y), spot: { x: clamp(point.x, 0, mapWidth), y: 0 } },
    { distance: Math.abs(mapHeight - point.y), spot: { x: clamp(point.x, 0, mapWidth), y: mapHeight } },
  ].sort((left, right) => left.distance - right.distance)
  const nearest = candidates[0]
  if (!nearest || nearest.distance > edgeMargin) return null
  return nearest.spot
}

export function clampToMap(point: MapPoint): MapPoint {
  return {
    x: clamp(point.x, 0, mapWidth),
    y: clamp(point.y, 0, mapHeight),
  }
}

export function routeLength(points: MapPoint[]) {
  let total = 0
  for (let index = 1; index < points.length; index += 1) {
    total += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y)
  }
  return total
}
