import { useEffect, useState, type FormEvent } from 'react'
import { updateHero } from '../api'
import { ArthurFigure } from '../game/ArthurFigure'
import {
  attackLabel,
  experienceToNext,
  grownStat,
  heroExperienceFromDamage,
  heroLevelCap,
  heroRole,
  heroSkillDetail,
  heroSkillEffect,
  heroSkillPoints,
  heroSkillPointsPerLevel,
  stackedBonus,
  type Hero,
  type HeroGrowth,
} from '../shared/content'
import { LedgerNumber } from './LedgerNumber'

const growthFields: { key: keyof HeroGrowth['percent']; label: string }[] = [
  { key: 'health', label: '血量' },
  { key: 'armor', label: '护甲' },
  { key: 'resist', label: '抗性' },
  { key: 'attack', label: '物理攻击' },
  { key: 'magic', label: '法术攻击' },
]

export function HeroSheet({ hero, onSaved }: { hero: Hero; onSaved: (hero: Hero) => void }) {
  const role = heroRole(hero.roleId)
  const [growth, setGrowth] = useState(hero.growth)
  const [cooldown, setCooldown] = useState(() => slashCooldown(hero))
  const [costs, setCosts] = useState<Record<string, string[]>>(() => costsFrom(hero))
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setGrowth(hero.growth)
    setCooldown(slashCooldown(hero))
    setCosts(costsFrom(hero))
  }, [hero])

  function setRate(group: 'percent' | 'flat', key: keyof HeroGrowth['percent'], value: string, max: number) {
    const next = value.trim() === '' ? 0 : Number(value)
    if (!Number.isInteger(next) || next < 0 || next > max) return
    setGrowth((current) => ({ ...current, [group]: { ...current[group], [key]: next } }))
    setStatus(null)
  }

  const totalCost = hero.skills.reduce((sum, skill) => {
    const values = costs[skill.id] ?? skill.ranks.map((rank) => String(rank.cost))
    return sum + values.reduce((inner, value) => inner + (Number(value) || 0), 0)
  }, 0)
  const points = heroSkillPoints(heroLevelCap)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const slashCooldown = Number(cooldown)
    if (cooldown.trim() === '' || !Number.isInteger(slashCooldown) || slashCooldown < 1 || slashCooldown > 60) {
      setError('重斩冷却要填 1 到 60 的整数秒')
      return
    }
    for (const skill of hero.skills) {
      const values = costs[skill.id] ?? []
      if (values.length !== skill.ranks.length || values.some((value) => !Number.isInteger(Number(value)) || Number(value) < 1 || Number(value) > 27)) {
        setError(`${skill.name}的技能点要填 1 到 27 的整数`)
        return
      }
    }
    setSaving(true)
    setError(null)
    try {
      const saved = await updateHero(hero.id, {
        growth,
        heavySlashCooldown: slashCooldown,
        skills: hero.skills.map((skill) => ({ id: skill.id, costs: (costs[skill.id] ?? []).map((value) => Number(value)) })),
      })
      onSaved(saved)
      setStatus('英雄已保存')
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : '英雄没有保存')
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="tower">
      <ArthurFigure />
      <p className="map-caption">亚瑟是一名中世纪重甲战士。闭合盔，全身板甲，左手盾，右手剑。</p>
      <p className="lede">{role ? `${role.name}。${role.summary}` : '定位未定。'}</p>
      <dl className="stat-line">
        <div>
          <dt>血量</dt>
          <dd>{hero.health}</dd>
        </div>
        <div>
          <dt>护甲</dt>
          <dd>{hero.armor}</dd>
        </div>
        <div>
          <dt>抗性</dt>
          <dd>{hero.resist}</dd>
        </div>
        <div>
          <dt>物理攻击</dt>
          <dd>{attackLabel(hero)}</dd>
        </div>
        <div>
          <dt>法术攻击</dt>
          <dd>{hero.magicAttack}</dd>
        </div>
        <div>
          <dt>移动速度</dt>
          <dd>{hero.speed}</dd>
        </div>
      </dl>
      <p className="map-caption">
        对怪物造成的伤害有 20% 变成经验，保留 1 位小数。造成 7 点伤害得到 {heroExperienceFromDamage(7)} 经验。从 n 级升到下一级，需要的经验是 10 的（n/2）次方，向上取整。等级上限 {heroLevelCap} 级。每升 1 级获得 {heroSkillPointsPerLevel} 技能点，升到 {heroLevelCap} 级一共 {points} 点。
      </p>

      <form onSubmit={(event) => void onSubmit(event)}>
        <h2 className="block-title">升级成长</h2>
        <p className="map-caption">
          每升 1 级，先加上 1 级基础属性的这个百分比，再加一截固定点数，最后向上取整。固定点数用来托住护甲、抗性、攻击这些很小的基础值，避免升到 10 级还是个位数。战士把成长主要放在护甲上，抗性其次，攻击只加一点。移动速度不随等级变化。法术攻击的比例和固定点数都是 0，所以一直是 0。这组是战士的暂定值，可以改。
        </p>
        <div className="growth-grid">
          {growthFields.map((field) => (
            <div key={field.key} className="growth-stat">
              <span>{field.label}</span>
              <div className="form-row">
                <span>比例 %</span>
                <LedgerNumber
                  label={`${field.label}成长比例`}
                  value={String(growth.percent[field.key])}
                  min={0}
                  max={100}
                  onChange={(value) => setRate('percent', field.key, value, 100)}
                />
              </div>
              <div className="form-row">
                <span>固定点数</span>
                <LedgerNumber
                  label={`${field.label}固定成长`}
                  value={String(growth.flat[field.key])}
                  min={0}
                  max={99}
                  onChange={(value) => setRate('flat', field.key, value, 99)}
                />
              </div>
            </div>
          ))}
        </div>

        <h2 className="block-title">等级</h2>
        <div className="table-scroll">
          <table className="hero-table">
            <thead>
              <tr>
                <th>等级</th>
                <th>血量</th>
                <th>护甲</th>
                <th>抗性</th>
                <th>物理攻击</th>
                <th>法术攻击</th>
                <th>移速</th>
                <th>升级经验</th>
                <th>技能点</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: heroLevelCap }, (_, index) => {
                const level = index + 1
                return (
                  <tr key={level}>
                    <td>{level}</td>
                    <td>{grownStat(hero.health, growth.percent.health, growth.flat.health, level)}</td>
                    <td>{grownStat(hero.armor, growth.percent.armor, growth.flat.armor, level)}</td>
                    <td>{grownStat(hero.resist, growth.percent.resist, growth.flat.resist, level)}</td>
                    <td>{attackLabel({ attackMin: grownStat(hero.attackMin, growth.percent.attack, growth.flat.attack, level), attackMax: grownStat(hero.attackMax, growth.percent.attack, growth.flat.attack, level) })}</td>
                    <td>{grownStat(hero.magicAttack, growth.percent.magic, growth.flat.magic, level)}</td>
                    <td>{hero.speed}</td>
                    <td>{experienceToNext(level) || '—'}</td>
                    <td>{heroSkillPoints(level)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="map-caption">升级经验是离开这一级所需的经验。10 级不再升级。1 级护甲被不惧加满时是 +{stackedBonus(hero.armor, 15, 3)}，抗性 +{stackedBonus(hero.resist, 10, 3)}。</p>

        <h2 className="block-title">技能</h2>
        <p className="map-caption">
          全部学满目前需要 {totalCost} 点，升到 {heroLevelCap} 级有 {points} 点。点数不够时要取舍；正好用完时，升级途中仍然要决定先学哪一个。
        </p>
        {hero.skills.map((skill) => (
          <section key={skill.id} className="skill-block">
            <h3>{skill.name}</h3>
            <p className="map-caption">{heroSkillDetail(skill.kind === 'heavy-slash' ? { ...skill, cooldown: Number(cooldown) || skill.cooldown } : skill)}</p>
            {skill.kind === 'heavy-slash' ? (
              <div className="form-row">
                <span>重斩冷却（秒）</span>
                <LedgerNumber label="重斩冷却" value={cooldown} min={1} max={60} onChange={(value) => { setCooldown(value); setStatus(null) }} />
              </div>
            ) : null}
            <ul className="rank-list hero-rank">
              {skill.ranks.map((rank, index) => (
                <li key={rank.rank}>
                  <span>第 {rank.rank} 次</span>
                  <span>{heroSkillEffect(skill, index)}</span>
                  <LedgerNumber
                    label={`${skill.name}第 ${rank.rank} 次技能点`}
                    value={costs[skill.id]?.[index] ?? String(rank.cost)}
                    min={1}
                    max={27}
                    onChange={(value) => {
                      setCosts((current) => {
                        const next = [...(current[skill.id] ?? skill.ranks.map((item) => String(item.cost)))]
                        next[index] = value
                        return { ...current, [skill.id]: next }
                      })
                      setStatus(null)
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
        {error ? (
          <p className="alert" role="alert">
            {error}
          </p>
        ) : status ? (
          <p className="map-caption" role="status">
            {status}
          </p>
        ) : null}
        <div className="toolbar">
          <button className="btn btn-gold" type="submit" disabled={saving}>
            保存英雄
          </button>
        </div>
      </form>
    </article>
  )
}

function slashCooldown(hero: Hero) {
  const slash = hero.skills.find((skill) => skill.kind === 'heavy-slash')
  return slash && slash.kind === 'heavy-slash' ? String(slash.cooldown) : '8'
}

function costsFrom(hero: Hero) {
  return Object.fromEntries(hero.skills.map((skill) => [skill.id, skill.ranks.map((rank) => String(rank.cost))]))
}
