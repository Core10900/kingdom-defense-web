import { normalizeContent, type Hero, type HeroGrowth, type Level, type LevelRoute, type LevelWave } from './shared/content'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  const body = (await response.json().catch(() => null)) as ({ error?: unknown } & T) | null
  if (!response.ok) {
    const message = body && typeof body.error === 'string' ? body.error : '内容服务没有响应'
    throw new Error(message)
  }
  return body as T
}

export function getContent() {
  return request<unknown>('/api/content').then((body) => normalizeContent(body))
}

export function createLevel(input: { themeId: string; name: string; waveCount: number }) {
  return request<Level>('/api/levels', { method: 'POST', body: JSON.stringify(input) })
}

export function updateLevel(
  id: string,
  input: { name: string; waveCount: number; startingGold: number; towerLevelCap: number; waves: LevelWave[] },
) {
  return request<Level>(`/api/levels/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function updateHero(
  id: string,
  input: { growth: HeroGrowth; heavySlashCooldown: number; skills: { id: string; costs: number[] }[] },
) {
  return request<Hero>(`/api/heroes/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function saveLevelRoutes(id: string, routes: LevelRoute[]) {
  return request<Level>(`/api/levels/${encodeURIComponent(id)}/routes`, {
    method: 'PUT',
    body: JSON.stringify({ routes }),
  })
}
