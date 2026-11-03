export type ThemeColor = {
  name: string
  hex: string
}

/** Shared ground style for every level inside one campaign theme. */
export type Theme = {
  id: string
  number: number
  name: string
  summary: string
  viewpoint: string
  light: string
  ground: string
  path: string
  props: string[]
  mayChange: string
  palette: ThemeColor[]
}

/** First campaign theme. Sub-levels reuse this ground. */
export const grasslandTheme: Theme = {
  id: 'theme-grassland',
  number: 1,
  name: '青青草原',
  summary: '开阔的白天草原。这一主题下的每张小关都用这一套地面。',
  viewpoint: '高处四分之三视角，画成一幅手绘沙盘。',
  light: '正午的阳光从左上照下来，影子短，颜色偏暖。',
  ground: '连绵的活草地。近处草叶清楚，远处收成更深的绿。草有高有矮，中间露出浅色小石和零星野花。',
  path: '被踩出来的黄土小径。路心更浅，两边压进草里。',
  props: ['草丛', '散石', '低矮灌木', '小路木桩', '野花', '远处树线'],
  mayChange: '小关之间可以改路线怎么拐、有几条分路，以及草丛、石头、灌木和野花摆在哪里。可以有水塘或小溪，岸仍然是草。',
  palette: [
    { name: '嫩草', hex: '#8FBF56' },
    { name: '草原', hex: '#4E8A45' },
    { name: '深草', hex: '#2F5E38' },
    { name: '土径', hex: '#C6A36A' },
    { name: '泥辙', hex: '#8D6840' },
    { name: '野花', hex: '#F2D56B' },
  ],
}

export type MapPoint = {
  x: number
  y: number
}

export type LevelRoute = {
  id: string
  points: MapPoint[]
}

export type SpawnGroup = {
  monsterId: string
  count: number
}

export type WaveSpawn = {
  routeId: string
  groups: SpawnGroup[]
}

export type LevelWave = {
  spawns: WaveSpawn[]
}

export type Level = {
  id: string
  themeId: string
  name: string
  waveCount: number
  startingGold: number
  towerLevelCap: number
  routes: LevelRoute[]
  waves: LevelWave[]
}

export function highestTowerRank(towers: Tower[]) {
  const ranks = towers.flatMap((tower) => tower.ranks.map((rank) => rank.level))
  return ranks.length > 0 ? Math.max(...ranks) : 1
}

export function alignLevelWaves(waves: LevelWave[] | undefined, waveCount: number, routes: LevelRoute[]): LevelWave[] {
  const source = Array.isArray(waves) ? waves : []
  const mouths = Array.isArray(routes) ? routes : []
  return Array.from({ length: waveCount }, (_, waveIndex) => {
    const existing = source[waveIndex]
    const spawns = Array.isArray(existing?.spawns) ? existing.spawns : []
    return {
      spawns: mouths.map((route) => {
        const found = spawns.find((spawn) => spawn.routeId === route.id)
        return { routeId: route.id, groups: readSpawnGroups(found, true) }
      }),
    }
  })
}

function readSpawnGroups(value: unknown, keepBlank: boolean): SpawnGroup[] {
  if (!value || typeof value !== 'object') return []
  const entry = value as { groups?: unknown; monsterId?: unknown; count?: unknown }
  const source = Array.isArray(entry.groups)
    ? entry.groups
    : typeof entry.monsterId === 'string' || typeof entry.count === 'number'
      ? [{ monsterId: entry.monsterId, count: entry.count }]
      : []
  const seen = new Set<string>()
  const groups: SpawnGroup[] = []
  let blank = false
  for (const item of source) {
    if (!item || typeof item !== 'object') continue
    const group = item as Partial<SpawnGroup>
    const count = isWhole(group.count) && group.count >= 0 && group.count <= 999 ? group.count : 0
    const monsterId = typeof group.monsterId === 'string' ? group.monsterId : ''
    if (!monsterId) {
      if (keepBlank && count >= 0 && !blank) {
        groups.push({ monsterId: '', count })
        blank = true
      }
      continue
    }
    if (seen.has(monsterId)) continue
    if (!keepBlank && count <= 0) continue
    seen.add(monsterId)
    groups.push({ monsterId, count })
  }
  return groups
}

export const slowestSpeed = 1
export const fastestSpeed = 10

export type Monster = {
  id: string
  name: string
  summary: string
  speed: number
  armor: number
  magicResist: number
  attackMin: number
  attackMax: number
  health: number
  gold: number
}

/** First confirmed monster. A grassland goat with no protections. */
export const goatMonster: Monster = {
  id: 'monster-goat',
  name: '山羊',
  summary: '低头走在草上的山羊。护甲和魔法抗性都没有。',
  speed: 6,
  armor: 0,
  magicResist: 0,
  attackMin: 1,
  attackMax: 3,
  health: 20,
  gold: 5,
}

export function attackLabel(attack: { attackMin: number; attackMax: number }) {
  return attack.attackMin === attack.attackMax ? String(attack.attackMin) : `${attack.attackMin}–${attack.attackMax}`
}

export function amountLabel(value: number) {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export type TowerRank = {
  level: number
  cost: number
  attackMin: number
  attackMax: number
}

export type RangeBonus = { kind: 'percent'; amount: number } | { kind: 'flat'; amount: number }

export type EagleEyeRank = {
  rank: number
  duration: number
  range: RangeBonus
  cooldown: number
}

export type PiercingRank = {
  rank: number
  attackMin: number
  attackMax: number
  armorIgnore: number
  cooldown: number
}

export type VolleyRank = {
  rank: number
  arrows: number
  cooldown: number
}

export type TowerSkill =
  | { id: string; name: string; kind: 'eagle-eye'; ranks: EagleEyeRank[] }
  | { id: string; name: string; kind: 'piercing'; ranks: PiercingRank[] }
  | { id: string; name: string; kind: 'volley'; ranks: VolleyRank[] }

export type Tower = {
  id: string
  name: string
  kind: string
  summary: string
  attackInterval: number
  ranks: TowerRank[]
  skillUnlockLevel: number
  skills: TowerSkill[]
}

/** First confirmed tower. Skills open after it reaches level 4. */
export const royalArcher: Tower = {
  id: 'tower-royal-archer',
  name: '皇家箭术师',
  kind: '箭塔',
  summary: '站在箭塔上放箭。升到 4 级后可以学习技能。',
  attackInterval: 0.9,
  skillUnlockLevel: 4,
  ranks: [
    { level: 1, cost: 60, attackMin: 3, attackMax: 5 },
    { level: 2, cost: 90, attackMin: 5, attackMax: 9 },
    { level: 3, cost: 140, attackMin: 8, attackMax: 13 },
    { level: 4, cost: 200, attackMin: 12, attackMax: 18 },
  ],
  skills: [
    {
      id: 'skill-eagle-eye',
      name: '鹰眼',
      kind: 'eagle-eye',
      ranks: [
        { rank: 1, duration: 3, range: { kind: 'percent', amount: 20 }, cooldown: 18 },
        { rank: 2, duration: 5, range: { kind: 'percent', amount: 30 }, cooldown: 15 },
      ],
    },
    {
      id: 'skill-piercing',
      name: '穿甲箭',
      kind: 'piercing',
      ranks: [
        { rank: 1, attackMin: 25, attackMax: 28, armorIgnore: 20, cooldown: 20 },
        { rank: 2, attackMin: 30, attackMax: 35, armorIgnore: 40, cooldown: 18 },
      ],
    },
    {
      id: 'skill-volley',
      name: '箭雨',
      kind: 'volley',
      ranks: [
        { rank: 1, arrows: 3, cooldown: 25 },
        { rank: 2, arrows: 4, cooldown: 20 },
      ],
    },
  ],
}

export function rangeBonusLabel(range: RangeBonus) {
  return range.kind === 'percent' ? `提高 ${range.amount}% 射程` : `提高 ${range.amount} 射程`
}

export function skillEffectLabel(skill: TowerSkill, rankIndex: number) {
  if (skill.kind === 'eagle-eye') {
    const rank = skill.ranks[rankIndex]
    if (!rank) return ''
    return `${amountLabel(rank.duration)} 秒内${rangeBonusLabel(rank.range)}`
  }
  if (skill.kind === 'piercing') {
    const rank = skill.ranks[rankIndex]
    if (!rank) return ''
    return `伤害 ${attackLabel(rank)}，忽视敌方 ${rank.armorIgnore}% 护甲`
  }
  const rank = skill.ranks[rankIndex]
  if (!rank) return ''
  return `一次性射出 ${rank.arrows} 支箭`
}

export function skillCooldown(skill: TowerSkill, rankIndex: number) {
  return skill.ranks[rankIndex]?.cooldown ?? 0
}

export const heroLevelCap = 10
export const heroSkillPointsPerLevel = 3

export type HeroAttack = 'melee' | 'ranged-physical' | 'ranged-magic'

export type HeroRole = {
  id: string
  name: string
  attack: HeroAttack
  summary: string
}

export const heroRoles: HeroRole[] = [
  { id: 'role-warrior', name: '战士', attack: 'melee', summary: '只能近战，不能远程攻击。' },
  { id: 'role-archer', name: '射手', attack: 'ranged-physical', summary: '远程物理攻击。' },
  { id: 'role-mage', name: '魔法师', attack: 'ranged-magic', summary: '远程法术攻击。' },
]

export function heroRole(roleId: string) {
  return heroRoles.find((role) => role.id === roleId)
}

export type HeroGrowthStat = 'health' | 'armor' | 'resist' | 'attack' | 'magic'

export type HeroGrowthRates = Record<HeroGrowthStat, number>

export type HeroGrowth = {
  percent: HeroGrowthRates
  flat: HeroGrowthRates
}

export type HeroSkillRank = {
  rank: number
  cost: number
}

export type HeroSkill =
  | { id: string; name: string; kind: 'fortitude'; armorPercent: number; resistPercent: number; ranks: HeroSkillRank[] }
  | { id: string; name: string; kind: 'heavy-slash'; damagePercent: number; armorIgnorePercent: number; cooldown: number; ranks: HeroSkillRank[] }
  | { id: string; name: string; kind: 'reflect'; reflectPercent: number; reflectGainPercent: number; cooldown: number; ranks: HeroSkillRank[] }
  | { id: string; name: string; kind: 'intercept'; targets: number; ranks: HeroSkillRank[] }
  | { id: string; name: string; kind: 'glory'; duration: number; bonusPercent: number; bonusGainPercent: number; cooldown: number; ranks: HeroSkillRank[] }

export type Hero = {
  id: string
  name: string
  roleId: string
  summary: string
  health: number
  armor: number
  resist: number
  attackMin: number
  attackMax: number
  magicAttack: number
  speed: number
  growth: HeroGrowth
  skills: HeroSkill[]
}

/** First confirmed hero. A melee warrior. Portrait is not designed yet. */
export const arthurHero: Hero = {
  id: 'hero-arthur',
  name: '亚瑟',
  roleId: 'role-warrior',
  summary: '近战战士。打在怪物身上的伤害，有两成变成经验。',
  health: 30,
  armor: 3,
  resist: 1,
  attackMin: 1,
  attackMax: 3,
  magicAttack: 0,
  speed: 7,
  growth: {
    percent: { health: 12, armor: 20, resist: 10, attack: 12, magic: 0 },
    flat: { health: 8, armor: 4, resist: 3, attack: 3, magic: 0 },
  },
  skills: [
    {
      id: 'skill-unafraid',
      name: '不惧',
      kind: 'fortitude',
      armorPercent: 15,
      resistPercent: 10,
      ranks: [
        { rank: 1, cost: 1 },
        { rank: 2, cost: 2 },
        { rank: 3, cost: 3 },
      ],
    },
    {
      id: 'skill-heavy-slash',
      name: '重斩',
      kind: 'heavy-slash',
      damagePercent: 180,
      armorIgnorePercent: 15,
      cooldown: 8,
      ranks: [
        { rank: 1, cost: 1 },
        { rank: 2, cost: 2 },
        { rank: 3, cost: 3 },
      ],
    },
    {
      id: 'skill-reflect',
      name: '反甲',
      kind: 'reflect',
      reflectPercent: 40,
      reflectGainPercent: 20,
      cooldown: 7,
      ranks: [
        { rank: 1, cost: 1 },
        { rank: 2, cost: 2 },
        { rank: 3, cost: 3 },
      ],
    },
    {
      id: 'skill-intercept',
      name: '陷阵',
      kind: 'intercept',
      targets: 2,
      ranks: [{ rank: 1, cost: 3 }],
    },
    {
      id: 'skill-glory',
      name: '荣光',
      kind: 'glory',
      duration: 8,
      bonusPercent: 20,
      bonusGainPercent: 5,
      cooldown: 20,
      ranks: [
        { rank: 1, cost: 1 },
        { rank: 2, cost: 2 },
        { rank: 3, cost: 3 },
      ],
    },
  ],
}

export function heroSkillPoints(level: number) {
  if (!Number.isInteger(level) || level < 1) return 0
  return (Math.min(level, heroLevelCap) - 1) * heroSkillPointsPerLevel
}

export function experienceToNext(level: number) {
  if (!Number.isInteger(level) || level < 1 || level >= heroLevelCap) return 0
  return Math.ceil(Number((10 ** (level / 2)).toPrecision(12)))
}

export function heroExperienceFromDamage(damage: number) {
  if (!Number.isFinite(damage) || damage <= 0) return 0
  return Math.round(damage * 2) / 10
}

export function grownStat(base: number, percent: number, flat: number, level: number) {
  const steps = Math.max(0, level - 1)
  const raw = base + steps * (base * (percent / 100) + flat)
  return Math.max(0, Math.ceil(raw - 1e-9))
}

export function stackedBonus(base: number, percent: number, ranks: number) {
  if (ranks <= 0) return 0
  return Math.max(0, Math.ceil(base * (percent / 100) * ranks - 1e-9))
}

export function heroSkillEffect(skill: HeroSkill, rankIndex: number) {
  const rank = skill.ranks[rankIndex]
  if (!rank) return ''
  if (skill.kind === 'fortitude') {
    return `基础护甲 +${skill.armorPercent * rank.rank}%，基础抗性 +${skill.resistPercent * rank.rank}%，向上取整`
  }
  if (skill.kind === 'heavy-slash') {
    return `伤害 ${skill.damagePercent}% 物理攻击，忽略 ${skill.armorIgnorePercent * rank.rank}% 护甲`
  }
  if (skill.kind === 'reflect') {
    return `免疫下一次伤害，反弹 ${skill.reflectPercent + skill.reflectGainPercent * (rank.rank - 1)}%`
  }
  if (skill.kind === 'intercept') return `同时最多拦截 ${skill.targets} 个敌人`
  return `${skill.duration} 秒内除移动速度外的基础属性 +${skill.bonusPercent + skill.bonusGainPercent * (rank.rank - 1)}%`
}

export function heroSkillDetail(skill: HeroSkill) {
  if (skill.kind === 'fortitude') {
    return `每学习一次，增加当前等级基础护甲的 ${skill.armorPercent}% 和基础抗性的 ${skill.resistPercent}%，向上取整。最多 ${skill.ranks.length} 次。`
  }
  if (skill.kind === 'heavy-slash') {
    return `造成 ${skill.damagePercent}% 基础物理攻击的伤害。每学习一次，多忽略敌方 ${skill.armorIgnorePercent}% 护甲。冷却 ${amountLabel(skill.cooldown)} 秒。最多 ${skill.ranks.length} 次。`
  }
  if (skill.kind === 'reflect') {
    return `免疫怪物下一次造成的伤害。第一次反弹 ${skill.reflectPercent}%，之后每学习一次，反弹比例再加 ${skill.reflectGainPercent}%。冷却 ${amountLabel(skill.cooldown)} 秒。最多 ${skill.ranks.length} 次。`
  }
  if (skill.kind === 'intercept') return `只能学习一次。学会后可以同时拦截最多 ${skill.targets} 个敌人。`
  return `${skill.duration} 秒内提升血量、护甲、抗性、物理攻击和法术攻击。移动速度不变。第一次提升 ${skill.bonusPercent}%，之后每学习一次再加 ${skill.bonusGainPercent}%。冷却 ${amountLabel(skill.cooldown)} 秒。最多 ${skill.ranks.length} 次。`
}

export function protectionLabel(value: number) {
  return value === 0 ? '无' : String(value)
}

export type Content = {
  settings: {
    title: string
  }
  themes: Theme[]
  monsters: Monster[]
  towers: Tower[]
  heroes: Hero[]
  levels: Level[]
}

export const emptyContent: Content = {
  settings: { title: '王国保卫战' },
  themes: [grasslandTheme],
  monsters: [goatMonster],
  towers: [royalArcher],
  heroes: [arthurHero],
  levels: [],
}

const growthStats: HeroGrowthStat[] = ['health', 'armor', 'resist', 'attack', 'magic']

const previousWarriorGrowth: HeroGrowth = {
  percent: { health: 12, armor: 10, resist: 5, attack: 12, magic: 0 },
  flat: { health: 8, armor: 2, resist: 2, attack: 2, magic: 0 },
}

function sameGrowth(left: HeroGrowth, right: HeroGrowth) {
  return growthStats.every((key) => left.percent[key] === right.percent[key] && left.flat[key] === right.flat[key])
}

function readGrowth(value: unknown, fallback: HeroGrowth): HeroGrowth {
  const source = value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const legacy = source.percent && typeof source.percent === 'object' ? null : source
  const percentSource = legacy ?? (source.percent as Record<string, unknown>)
  const flatSource = source.flat && typeof source.flat === 'object' ? (source.flat as Record<string, unknown>) : {}
  const percent = { ...fallback.percent }
  const flat = { ...fallback.flat }
  for (const key of growthStats) {
    const percentValue = percentSource[key]
    if (isWhole(percentValue) && percentValue >= 0 && percentValue <= 100) percent[key] = percentValue
    const flatValue = flatSource[key]
    if (isWhole(flatValue) && flatValue >= 0 && flatValue <= 99) flat[key] = flatValue
  }
  return { percent, flat }
}

function readSkillCosts(value: unknown, fallback: HeroSkillRank[]) {
  if (!Array.isArray(value) || value.length !== fallback.length) return fallback
  const ranks = value.map((item, index) => {
    if (!item || typeof item !== 'object') return null
    const rank = item as Partial<HeroSkillRank>
    const expected = fallback[index]
    if (!expected || rank.rank !== expected.rank) return null
    if (!isWhole(rank.cost) || rank.cost < 1 || rank.cost > 27) return null
    return { rank: expected.rank, cost: rank.cost }
  })
  return ranks.every((rank) => rank !== null) ? ranks : fallback
}

function normalizeHeroes(value: unknown): Hero[] {
  if (!Array.isArray(value) || value.length === 0) return [arthurHero]
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const hero = item as Partial<Hero>
    if (hero.id !== arthurHero.id) return []
    const skills = arthurHero.skills.map((skill) => {
      const stored = Array.isArray(hero.skills) ? hero.skills.find((entry) => entry.id === skill.id) : undefined
      const ranks = readSkillCosts(stored?.ranks, skill.ranks)
      if (skill.kind === 'heavy-slash') {
        const cooldown = stored && stored.kind === 'heavy-slash' && isWhole(stored.cooldown) && stored.cooldown >= 1 && stored.cooldown <= 60
          ? stored.cooldown
          : skill.cooldown
        return { ...skill, cooldown, ranks }
      }
      return { ...skill, ranks }
    })
    const growth = readGrowth(hero.growth, arthurHero.growth)
    return [{ ...arthurHero, growth: sameGrowth(growth, previousWarriorGrowth) ? arthurHero.growth : growth, skills }]
  })
}

export function normalizeContent(value: unknown): Content {
  const record = value && typeof value === 'object' ? (value as Partial<Content>) : {}
  const settings = record.settings
  const title =
    settings && typeof settings === 'object' && typeof settings.title === 'string' && settings.title.trim()
      ? settings.title.trim()
      : emptyContent.settings.title

  const towers = normalizeTowers(record.towers)
  return {
    settings: { title },
    themes: normalizeThemes(record.themes),
    monsters: normalizeMonsters(record.monsters),
    towers,
    heroes: normalizeHeroes(record.heroes),
    levels: normalizeLevels(record.levels, highestTowerRank(towers)),
  }
}

function normalizeThemes(value: unknown): Theme[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object') return []
    const theme = item as Partial<Theme>
    if (typeof theme.id !== 'string' || typeof theme.name !== 'string') return []
    const palette = Array.isArray(theme.palette)
      ? theme.palette.flatMap((color) => {
          if (!color || typeof color !== 'object') return []
          const entry = color as Partial<ThemeColor>
          if (typeof entry.name !== 'string' || typeof entry.hex !== 'string') return []
          return [{ name: entry.name, hex: entry.hex }]
        })
      : []
    return [
      {
        id: theme.id,
        number: typeof theme.number === 'number' && theme.number > 0 ? theme.number : index + 1,
        name: theme.name,
        summary: typeof theme.summary === 'string' ? theme.summary : '',
        viewpoint: typeof theme.viewpoint === 'string' ? theme.viewpoint : '',
        light: typeof theme.light === 'string' ? theme.light : '',
        ground: typeof theme.ground === 'string' ? theme.ground : '',
        path: typeof theme.path === 'string' ? theme.path : '',
        props: Array.isArray(theme.props) ? theme.props.filter((prop) => typeof prop === 'string') : [],
        mayChange: typeof theme.mayChange === 'string' ? theme.mayChange : '',
        palette,
      },
    ]
  })
}

function normalizeMonsters(value: unknown): Monster[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const monster = item as Partial<Monster> & { speed?: unknown; gold?: unknown }
    if (typeof monster.id !== 'string' || typeof monster.name !== 'string') return []
    const speed = readSpeed(monster.speed)
    const gold = readGold(monster.gold, monster.id)
    if (speed === null || gold === null) return []
    if (!isWhole(monster.health) || monster.health < 1) return []
    if (!isWhole(monster.armor) || monster.armor < 0) return []
    if (!isWhole(monster.magicResist) || monster.magicResist < 0) return []
    if (!isWhole(monster.attackMin) || !isWhole(monster.attackMax) || monster.attackMin < 0 || monster.attackMax < monster.attackMin) {
      return []
    }
    return [
      {
        id: monster.id,
        name: monster.name,
        summary: typeof monster.summary === 'string' ? monster.summary : '',
        speed,
        armor: monster.armor,
        magicResist: monster.magicResist,
        attackMin: monster.attackMin,
        attackMax: monster.attackMax,
        health: monster.health,
        gold,
      },
    ]
  })
}

function readSpeed(value: unknown) {
  if (isWhole(value) && value >= slowestSpeed && value <= fastestSpeed) return value
  if (value === 'medium') return 6
  return null
}

function readGold(value: unknown, id: string) {
  if (isWhole(value) && value >= 0) return value
  if (value === undefined && id === 'monster-goat') return 5
  return null
}

function isWhole(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}

function isPositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function normalizeTowers(value: unknown): Tower[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const tower = item as Partial<Tower>
    if (typeof tower.id !== 'string' || typeof tower.name !== 'string' || typeof tower.kind !== 'string') return []
    if (!isPositive(tower.attackInterval) || tower.attackInterval > 60) return []
    if (!isWhole(tower.skillUnlockLevel) || tower.skillUnlockLevel < 1) return []
    const ranks = readTowerRanks(tower.ranks)
    const skills = readTowerSkills(tower.skills)
    if (!ranks || !skills) return []
    return [
      {
        id: tower.id,
        name: tower.name,
        kind: tower.kind,
        summary: typeof tower.summary === 'string' ? tower.summary : '',
        attackInterval: tower.attackInterval,
        ranks,
        skillUnlockLevel: tower.skillUnlockLevel,
        skills,
      },
    ]
  })
}

function readTowerRanks(value: unknown): TowerRank[] | null {
  if (!Array.isArray(value) || value.length === 0) return null
  const ranks: TowerRank[] = []
  for (const item of value) {
    if (!item || typeof item !== 'object') return null
    const rank = item as Partial<TowerRank>
    if (!isWhole(rank.level) || rank.level < 1) return null
    if (!isWhole(rank.cost) || rank.cost < 0) return null
    if (!isWhole(rank.attackMin) || !isWhole(rank.attackMax) || rank.attackMin < 0 || rank.attackMax < rank.attackMin) return null
    ranks.push({ level: rank.level, cost: rank.cost, attackMin: rank.attackMin, attackMax: rank.attackMax })
  }
  return ranks
}

function readTowerSkills(value: unknown): TowerSkill[] | null {
  if (!Array.isArray(value)) return null
  const skills: TowerSkill[] = []
  for (const item of value) {
    const skill = readTowerSkill(item)
    if (!skill) return null
    skills.push(skill)
  }
  return skills
}

function readTowerSkill(value: unknown): TowerSkill | null {
  if (!value || typeof value !== 'object') return null
  const skill = value as { id?: unknown; name?: unknown; kind?: unknown; ranks?: unknown }
  if (typeof skill.id !== 'string' || typeof skill.name !== 'string' || !Array.isArray(skill.ranks) || skill.ranks.length === 0) {
    return null
  }
  if (skill.kind === 'eagle-eye') {
    const ranks: EagleEyeRank[] = []
    for (const item of skill.ranks) {
      if (!item || typeof item !== 'object') return null
      const rank = item as Partial<EagleEyeRank>
      const range = rank.range
      if (!isWhole(rank.rank) || !isPositive(rank.duration) || !isPositive(rank.cooldown)) return null
      if (!range || (range.kind !== 'percent' && range.kind !== 'flat') || !isPositive(range.amount)) return null
      const bonus =
        skill.id === 'skill-eagle-eye' && rank.rank === 2 && range.kind === 'flat' && range.amount === 30
          ? { kind: 'percent' as const, amount: 30 }
          : range
      ranks.push({ rank: rank.rank, duration: rank.duration, range: bonus, cooldown: rank.cooldown })
    }
    return { id: skill.id, name: skill.name, kind: 'eagle-eye', ranks }
  }
  if (skill.kind === 'piercing') {
    const ranks: PiercingRank[] = []
    for (const item of skill.ranks) {
      if (!item || typeof item !== 'object') return null
      const rank = item as Partial<PiercingRank>
      if (!isWhole(rank.rank) || !isPositive(rank.cooldown)) return null
      if (!isWhole(rank.attackMin) || !isWhole(rank.attackMax) || rank.attackMin < 0 || rank.attackMax < rank.attackMin) return null
      if (!isWhole(rank.armorIgnore) || rank.armorIgnore < 0 || rank.armorIgnore > 100) return null
      ranks.push({
        rank: rank.rank,
        attackMin: rank.attackMin,
        attackMax: rank.attackMax,
        armorIgnore: rank.armorIgnore,
        cooldown: rank.cooldown,
      })
    }
    return { id: skill.id, name: skill.name, kind: 'piercing', ranks }
  }
  if (skill.kind === 'volley') {
    const ranks: VolleyRank[] = []
    for (const item of skill.ranks) {
      if (!item || typeof item !== 'object') return null
      const rank = item as Partial<VolleyRank>
      if (!isWhole(rank.rank) || !isWhole(rank.arrows) || rank.arrows < 1 || !isPositive(rank.cooldown)) return null
      ranks.push({ rank: rank.rank, arrows: rank.arrows, cooldown: rank.cooldown })
    }
    return { id: skill.id, name: skill.name, kind: 'volley', ranks }
  }
  return null
}

function normalizeLevels(value: unknown, towerCap: number): Level[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const level = item as Partial<Level>
    if (typeof level.id !== 'string' || typeof level.themeId !== 'string' || typeof level.name !== 'string') return []
    const waveCount =
      typeof level.waveCount === 'number' && Number.isInteger(level.waveCount)
        ? Math.min(99, Math.max(1, level.waveCount))
        : 1
    const startingGold = isWhole(level.startingGold) && level.startingGold >= 0 ? level.startingGold : 0
    const towerLevelCap = isWhole(level.towerLevelCap) && level.towerLevelCap >= 1 ? level.towerLevelCap : towerCap
    const routes = Array.isArray(level.routes)
      ? level.routes.flatMap((route) => {
          if (!route || typeof route !== 'object') return []
          const entry = route as Partial<LevelRoute>
          if (typeof entry.id !== 'string' || !Array.isArray(entry.points)) return []
          const points = entry.points.flatMap((point) => {
            if (!point || typeof point !== 'object') return []
            const spot = point as Partial<MapPoint>
            if (typeof spot.x !== 'number' || typeof spot.y !== 'number') return []
            if (!Number.isFinite(spot.x) || !Number.isFinite(spot.y)) return []
            return [{ x: spot.x, y: spot.y }]
          })
          return points.length >= 2 ? [{ id: entry.id, points }] : []
        })
      : []
    const waves = alignLevelWaves(readLevelWaves(level.waves), waveCount, routes)
    return [
      {
        id: level.id,
        themeId: level.themeId,
        name: level.name,
        waveCount,
        startingGold,
        towerLevelCap,
        routes,
        waves: routes.length === 0 ? [] : waves,
      },
    ]
  })
}

function readLevelWaves(value: unknown): LevelWave[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || !Array.isArray((item as LevelWave).spawns)) return []
    const spawns = (item as LevelWave).spawns.flatMap((spawn) => {
      if (!spawn || typeof spawn !== 'object') return []
      const entry = spawn as { routeId?: unknown }
      if (typeof entry.routeId !== 'string') return []
      return [{ routeId: entry.routeId, groups: readSpawnGroups(spawn, false) }]
    })
    return [{ spawns }]
  })
}

export function levelCode(themeNumber: number, index: number) {
  return `${themeNumber}-${index + 1}`
}
