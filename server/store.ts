import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import {
  alignLevelWaves,
  arthurHero,
  emptyContent,
  goatMonster,
  grasslandTheme,
  highestTowerRank,
  normalizeContent,
  royalArcher,
  type Content,
  type Hero,
  type HeroGrowth,
  type Level,
  type LevelRoute,
  type LevelWave,
} from '../src/shared/content.ts'
import { isOnBorder, mapHeight, mapWidth, routeLength } from '../src/shared/map.ts'
import { HttpError } from './http.ts'

const file = join(process.cwd(), 'data', 'content.sqlite')
mkdirSync(dirname(file), { recursive: true })

const db = new DatabaseSync(file)
db.exec(`
  CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL
  )
`)

const readRow = db.prepare('SELECT data FROM content WHERE id = 1')
const insertRow = db.prepare('INSERT INTO content (id, data) VALUES (1, ?)')
const updateRow = db.prepare('UPDATE content SET data = ? WHERE id = 1')

function writeContent(content: Content) {
  updateRow.run(JSON.stringify(content))
}

const existing = readRow.get() as { data: string } | undefined
if (!existing) {
  insertRow.run(JSON.stringify(emptyContent))
} else {
  const parsed = JSON.parse(existing.data) as { monsters?: unknown; towers?: unknown; heroes?: unknown; levels?: unknown }
  const stored = normalizeContent(parsed)
  const rawMonsters = Array.isArray(parsed.monsters) ? parsed.monsters : []
  const rawTowers = Array.isArray(parsed.towers) ? parsed.towers : []
  const rawHeroes = Array.isArray(parsed.heroes) ? parsed.heroes : []
  const rawLevels = Array.isArray(parsed.levels) ? parsed.levels : []
  const monstersChanged = JSON.stringify(rawMonsters) !== JSON.stringify(stored.monsters)
  const towersChanged = JSON.stringify(rawTowers) !== JSON.stringify(stored.towers)
  const heroesChanged = JSON.stringify(rawHeroes) !== JSON.stringify(stored.heroes)
  const levelsChanged = JSON.stringify(rawLevels) !== JSON.stringify(stored.levels)
  if (
    stored.themes.length === 0 ||
    stored.monsters.length === 0 ||
    stored.towers.length === 0 ||
    stored.heroes.length === 0 ||
    monstersChanged ||
    towersChanged ||
    heroesChanged ||
    levelsChanged
  ) {
    writeContent({
      ...stored,
      themes: stored.themes.length === 0 ? [grasslandTheme] : stored.themes,
      monsters: stored.monsters.length === 0 ? [goatMonster] : stored.monsters,
      towers: stored.towers.length === 0 ? [royalArcher] : stored.towers,
      heroes: stored.heroes.length === 0 ? [arthurHero] : stored.heroes,
    })
  }
}

export function readContent(): Content {
  const row = readRow.get() as { data: string }
  return normalizeContent(JSON.parse(row.data) as unknown)
}

export function createLevel(body: unknown): Level {
  if (!body || typeof body !== 'object') throw new HttpError(400, '请填写关卡')
  const record = body as { themeId?: unknown; name?: unknown; waveCount?: unknown }
  const content = readContent()
  const theme = content.themes.find((item) => item.id === record.themeId)
  if (!theme) throw new HttpError(400, '请选择主题')
  if (typeof record.name !== 'string' || record.name.trim().length === 0) throw new HttpError(400, '请填写关卡名称')
  if (record.name.trim().length > 40) throw new HttpError(400, '关卡名称不要超过 40 个字')
  if (typeof record.waveCount !== 'number' || !Number.isInteger(record.waveCount) || record.waveCount < 1 || record.waveCount > 99) {
    throw new HttpError(400, '怪物波次要填 1 到 99 的整数')
  }
  const level: Level = {
    id: `lvl_${crypto.randomUUID().slice(0, 8)}`,
    themeId: theme.id,
    name: record.name.trim(),
    waveCount: record.waveCount,
    startingGold: 0,
    towerLevelCap: highestTowerRank(content.towers),
    routes: [],
    waves: [],
  }
  writeContent({ ...content, levels: [...content.levels, level] })
  return level
}

export function updateLevel(id: string, body: unknown): Level {
  if (!body || typeof body !== 'object') throw new HttpError(400, '请填写关卡')
  const record = body as {
    name?: unknown
    waveCount?: unknown
    startingGold?: unknown
    towerLevelCap?: unknown
    waves?: unknown
  }
  const content = readContent()
  const index = content.levels.findIndex((item) => item.id === id)
  if (index < 0) throw new HttpError(404, '找不到这一关')
  const current = content.levels[index]
  if (typeof record.name !== 'string' || record.name.trim().length === 0) throw new HttpError(400, '请填写关卡名称')
  if (record.name.trim().length > 40) throw new HttpError(400, '关卡名称不要超过 40 个字')
  if (typeof record.waveCount !== 'number' || !Number.isInteger(record.waveCount) || record.waveCount < 1 || record.waveCount > 99) {
    throw new HttpError(400, '怪物波次要填 1 到 99 的整数')
  }
  if (typeof record.startingGold !== 'number' || !Number.isInteger(record.startingGold) || record.startingGold < 0 || record.startingGold > 99999) {
    throw new HttpError(400, '起始金币要填 0 到 99999 的整数')
  }
  const capMax = highestTowerRank(content.towers)
  if (typeof record.towerLevelCap !== 'number' || !Number.isInteger(record.towerLevelCap) || record.towerLevelCap < 1 || record.towerLevelCap > capMax) {
    throw new HttpError(400, `防御塔等级上限要填 1 到 ${capMax} 的整数`)
  }
  const waves =
    current.routes.length === 0 ? [] : readIncomingWaves(record.waves, record.waveCount, current.routes, content)
  const level: Level = {
    ...current,
    name: record.name.trim(),
    waveCount: record.waveCount,
    startingGold: record.startingGold,
    towerLevelCap: record.towerLevelCap,
    waves,
  }
  const levels = content.levels.slice()
  levels[index] = level
  writeContent({ ...content, levels })
  return level
}

function readIncomingWaves(value: unknown, waveCount: number, routes: LevelRoute[], content: Content): LevelWave[] {
  if (!Array.isArray(value) || value.length !== waveCount) throw new HttpError(400, '每一波都要安排出怪')
  return value.map((item, waveIndex) => {
    if (!item || typeof item !== 'object' || !Array.isArray((item as LevelWave).spawns)) {
      throw new HttpError(400, `第 ${waveIndex + 1} 波还没有安排出怪`)
    }
    const spawns = (item as LevelWave).spawns
    if (spawns.length !== routes.length) throw new HttpError(400, `第 ${waveIndex + 1} 波的出怪口数量不对`)
    return {
      spawns: routes.map((route, spawnIndex) => {
        const spawn = spawns[spawnIndex]
        if (!spawn || spawn.routeId !== route.id || !Array.isArray(spawn.groups)) {
          throw new HttpError(400, `第 ${waveIndex + 1} 波的出怪口对不上`)
        }
        const where = `第 ${waveIndex + 1} 波出怪口 ${spawnIndex + 1}`
        const seen = new Set<string>()
        const groups = spawn.groups.map((group) => {
          if (!group || typeof group.monsterId !== 'string' || group.monsterId.length === 0) {
            throw new HttpError(400, `${where}要选择怪物`)
          }
          if (typeof group.count !== 'number' || !Number.isInteger(group.count) || group.count < 1 || group.count > 999) {
            throw new HttpError(400, `${where}的数量要填 1 到 999`)
          }
          if (!content.monsters.some((monster) => monster.id === group.monsterId)) {
            throw new HttpError(400, `${where}要选择怪物`)
          }
          if (seen.has(group.monsterId)) throw new HttpError(400, `${where}里同一种怪物只要一行`)
          seen.add(group.monsterId)
          return { monsterId: group.monsterId, count: group.count }
        })
        return { routeId: route.id, groups }
      }),
    }
  })
}

export function updateHero(id: string, body: unknown): Hero {
  if (!body || typeof body !== 'object') throw new HttpError(400, '请填写英雄')
  const record = body as { growth?: unknown; heavySlashCooldown?: unknown; skills?: unknown }
  const content = readContent()
  const index = content.heroes.findIndex((item) => item.id === id)
  if (index < 0) throw new HttpError(404, '找不到这位英雄')
  const current = content.heroes[index]
  const growth = readGrowthUpdate(record.growth)
  if (typeof record.heavySlashCooldown !== 'number' || !Number.isInteger(record.heavySlashCooldown) || record.heavySlashCooldown < 1 || record.heavySlashCooldown > 60) {
    throw new HttpError(400, '重斩冷却要填 1 到 60 的整数秒')
  }
  if (!Array.isArray(record.skills)) throw new HttpError(400, '请填写技能点')
  const incomingSkills = record.skills as { id?: unknown; costs?: unknown }[]
  const skills = current.skills.map((skill) => {
    const incoming = incomingSkills.find((item) => item && item.id === skill.id)
    const skillCosts = incoming?.costs
    if (!Array.isArray(skillCosts) || skillCosts.length !== skill.ranks.length) {
      throw new HttpError(400, `${skill.name}的技能点数量不对`)
    }
    const ranks = skill.ranks.map((rank, rankIndex) => {
      const cost = skillCosts[rankIndex]
      if (typeof cost !== 'number' || !Number.isInteger(cost) || cost < 1 || cost > 27) {
        throw new HttpError(400, `${skill.name}第 ${rank.rank} 次要填 1 到 27 的技能点`)
      }
      return { rank: rank.rank, cost }
    })
    if (skill.kind === 'heavy-slash') return { ...skill, cooldown: record.heavySlashCooldown as number, ranks }
    return { ...skill, ranks }
  })
  const hero = { ...current, growth, skills }
  const heroes = content.heroes.slice()
  heroes[index] = hero
  writeContent({ ...content, heroes })
  return hero
}

function readGrowthUpdate(value: unknown): HeroGrowth {
  if (!value || typeof value !== 'object') throw new HttpError(400, '请填写升级成长')
  const source = value as { percent?: unknown; flat?: unknown }
  const readGroup = (group: unknown, label: string, max: number) => {
    if (!group || typeof group !== 'object') throw new HttpError(400, `请填写${label}`)
    const record = group as Partial<HeroGrowth['percent']>
    const read = (key: keyof HeroGrowth['percent'], stat: string) => {
      const next = record[key]
      if (typeof next !== 'number' || !Number.isInteger(next) || next < 0 || next > max) {
        throw new HttpError(400, `${stat}的${label}要填 0 到 ${max} 的整数`)
      }
      return next
    }
    return {
      health: read('health', '血量'),
      armor: read('armor', '护甲'),
      resist: read('resist', '抗性'),
      attack: read('attack', '物理攻击'),
      magic: read('magic', '法术攻击'),
    }
  }
  return {
    percent: readGroup(source.percent, '成长比例', 100),
    flat: readGroup(source.flat, '固定成长', 99),
  }
}

export function saveLevelRoutes(id: string, body: unknown): Level {
  if (!body || typeof body !== 'object') throw new HttpError(400, '请提交路线')
  const record = body as { routes?: unknown }
  const content = readContent()
  const index = content.levels.findIndex((item) => item.id === id)
  if (index < 0) throw new HttpError(404, '找不到这一关')
  const routes = normalizeIncomingRoutes(record.routes)
  const previous = content.levels[index]
  const level = {
    ...previous,
    routes,
    waves: routes.length === 0 ? [] : alignLevelWaves(previous.waves, previous.waveCount, routes),
  }
  const levels = content.levels.slice()
  levels[index] = level
  writeContent({ ...content, levels })
  return level
}

function normalizeIncomingRoutes(value: unknown): LevelRoute[] {
  if (!Array.isArray(value)) throw new HttpError(400, '请提交路线')
  if (value.length > 12) throw new HttpError(400, '一条关卡最多 12 条路线')
  return value.map((item, index) => {
    if (!item || typeof item !== 'object') throw new HttpError(400, `第 ${index + 1} 条路线无效`)
    const route = item as Partial<LevelRoute>
    if (!Array.isArray(route.points) || route.points.length < 2 || route.points.length > 800) {
      throw new HttpError(400, `第 ${index + 1} 条路线无效`)
    }
    const points = route.points.map((point) => {
      if (!point || typeof point !== 'object') throw new HttpError(400, `第 ${index + 1} 条路线无效`)
      const spot = point as { x?: unknown; y?: unknown }
      if (typeof spot.x !== 'number' || typeof spot.y !== 'number' || !Number.isFinite(spot.x) || !Number.isFinite(spot.y)) {
        throw new HttpError(400, `第 ${index + 1} 条路线无效`)
      }
      if (spot.x < -0.5 || spot.y < -0.5 || spot.x > mapWidth + 0.5 || spot.y > mapHeight + 0.5) {
        throw new HttpError(400, `第 ${index + 1} 条路线跑出了地图`)
      }
      return { x: spot.x, y: spot.y }
    })
    if (!isOnBorder(points[0]) || !isOnBorder(points[points.length - 1])) {
      throw new HttpError(400, `第 ${index + 1} 条路线的起点和终点都要在地图边缘`)
    }
    if (routeLength(points) < 40) throw new HttpError(400, `第 ${index + 1} 条路线太短`)
    const id = typeof route.id === 'string' && route.id.length > 0 && route.id.length <= 40 ? route.id : `route_${crypto.randomUUID().slice(0, 8)}`
    return { id, points }
  })
}
