import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { getContent } from '../api'
import { ArcherTower } from '../game/ArcherTower'
import { GoatFigure } from '../game/GoatFigure'
import { GrasslandMap } from '../game/GrasslandMap'
import {
  amountLabel,
  attackLabel,
  heroRole,
  highestTowerRank,
  levelCode,
  protectionLabel,
  skillCooldown,
  skillEffectLabel,
  type Content,
  type Level,
  type Monster,
  type Theme,
  type Hero,
  type Tower,
} from '../shared/content'
import { ArthurFigure } from '../game/ArthurFigure'
import { HeroSheet } from './HeroSheet'
import { LevelEditor } from './LevelEditor'
import { LevelForm } from './LevelForm'
import { NewLevelDialog } from './NewLevelDialog'

const sections = [
  {
    id: 'themes',
    label: '关卡主题',
    count: (content: Content) => content.themes.length,
    note: '点一个主题，查看这一组关卡共用的地图风格。',
  },
  {
    id: 'levels',
    label: '关卡',
    count: (content: Content) => content.levels.length,
    note: '点开一关，可以改名称、波次、起始金币和防御塔等级上限。路线画好后，每个出怪口可以安排好几种怪物。',
  },
  {
    id: 'monsters',
    label: '怪物',
    count: (content: Content) => content.monsters.length,
    note: '点一只怪物，查看它的样子和数值。下一种要单独确认。',
  },
  {
    id: 'towers',
    label: '防御塔',
    count: (content: Content) => content.towers.length,
    note: '点一座塔，查看它的样子、等级和技能。下一种要单独确认。',
  },
  {
    id: 'heroes',
    label: '英雄',
    count: (content: Content) => content.heroes.length,
    note: '点一位英雄，查看等级、经验和技能。技能点消耗和成长比例可以改。下一位要单独确认。',
  },
  {
    id: 'rules',
    label: '规则',
    count: (content: Content) => (content.settings.title ? 0 : 0),
    note: '金币、售价和生命这些全局规则，等战斗骨架确定后再定。',
  },
] as const

type SectionId = (typeof sections)[number]['id']

function isSection(value: string | undefined): value is SectionId {
  return sections.some((section) => section.id === value)
}

export function AdminPage() {
  const params = useParams()
  const sectionId = params.levelId
    ? 'levels'
    : params.themeId
      ? 'themes'
      : params.monsterId
        ? 'monsters'
    : params.towerId
      ? 'towers'
      : params.heroId
        ? 'heroes'
        : params.section
  const [content, setContent] = useState<Content | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getContent()
      .then(setContent)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : '内容服务没有响应')
      })
  }, [])

  if (!params.themeId && !params.levelId && !params.monsterId && !params.towerId && !params.heroId && !isSection(sectionId)) {
    return <Navigate to="/admin/levels" replace />
  }

  const section = sections.find((item) => item.id === sectionId) ?? sections[0]
  const theme = params.themeId ? content?.themes.find((item) => item.id === params.themeId) : undefined
  const missingTheme = Boolean(params.themeId && content && !theme)
  const level = params.levelId ? content?.levels.find((item) => item.id === params.levelId) : undefined
  const levelTheme = level ? content?.themes.find((item) => item.id === level.themeId) : undefined
  const missingLevel = Boolean(params.levelId && content && !level)
  const monster = params.monsterId ? content?.monsters.find((item) => item.id === params.monsterId) : undefined
  const missingMonster = Boolean(params.monsterId && content && !monster)
  const tower = params.towerId ? content?.towers.find((item) => item.id === params.towerId) : undefined
  const missingTower = Boolean(params.towerId && content && !tower)
  const hero = params.heroId ? content?.heroes.find((item) => item.id === params.heroId) : undefined
  const missingHero = Boolean(params.heroId && content && !hero)

  return (
    <div className="desk">
      <header className="rail">
        <Link className="mark" to="/">
          王国保卫战
        </Link>
        <nav aria-label="后台">
          {sections.map((item) => (
            <Link key={item.id} to={`/admin/${item.id}`} aria-current={item.id === section.id ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link className="rail-field" to="/field">
          打开战场
        </Link>
      </header>
      <main className="workspace">
        {theme ? (
          <>
            <Link className="back" to="/admin/themes">
              返回关卡主题
            </Link>
            <h1>{theme.name}</h1>
            <ThemeStyle theme={theme} />
          </>
        ) : params.themeId ? (
          <>
            <Link className="back" to="/admin/themes">
              返回关卡主题
            </Link>
            <h1>关卡主题</h1>
            {error ? (
              <p className="alert" role="alert">
                {error}
              </p>
            ) : missingTheme ? (
              <p className="alert" role="alert">
                找不到这个主题。
              </p>
            ) : (
              <p className="empty">正在读取已保存的内容。</p>
            )}
          </>
        ) : level && levelTheme ? (
          <>
            <Link className="back" to="/admin/levels">
              返回关卡
            </Link>
            <h1>
              {levelCode(
                levelTheme.number,
                content?.levels.filter((item) => item.themeId === level.themeId).findIndex((item) => item.id === level.id) ?? 0,
              )}{' '}
              {level.name}
            </h1>
            <p className="lede">{levelTheme.name}</p>
            <LevelForm
              level={level}
              monsters={content?.monsters ?? []}
              capMax={highestTowerRank(content?.towers ?? [])}
              onSaved={(saved) =>
                setContent((current) =>
                  current
                    ? { ...current, levels: current.levels.map((item) => (item.id === saved.id ? saved : item)) }
                    : current,
                )
              }
            />
            <LevelEditor
              level={level}
              theme={levelTheme}
              onSaved={(saved) =>
                setContent((current) =>
                  current
                    ? { ...current, levels: current.levels.map((item) => (item.id === saved.id ? saved : item)) }
                    : current,
                )
              }
            />
          </>
        ) : params.levelId ? (
          <>
            <Link className="back" to="/admin/levels">
              返回关卡
            </Link>
            <h1>关卡</h1>
            {error ? (
              <p className="alert" role="alert">
                {error}
              </p>
            ) : missingLevel || (content && level && !levelTheme) ? (
              <p className="alert" role="alert">
                找不到这一关。
              </p>
            ) : (
              <p className="empty">正在读取已保存的内容。</p>
            )}
          </>
        ) : monster ? (
          <>
            <Link className="back" to="/admin/monsters">
              返回怪物
            </Link>
            <h1>{monster.name}</h1>
            <p className="lede">{monster.summary}</p>
            <MonsterSheet monster={monster} />
          </>
        ) : params.monsterId ? (
          <>
            <Link className="back" to="/admin/monsters">
              返回怪物
            </Link>
            <h1>怪物</h1>
            {error ? (
              <p className="alert" role="alert">
                {error}
              </p>
            ) : missingMonster ? (
              <p className="alert" role="alert">
                找不到这只怪物。
              </p>
            ) : (
              <p className="empty">正在读取已保存的内容。</p>
            )}
          </>
        ) : tower ? (
          <>
            <Link className="back" to="/admin/towers">
              返回防御塔
            </Link>
            <h1>{tower.name}</h1>
            <p className="lede">{tower.summary}</p>
            <TowerSheet tower={tower} />
          </>
        ) : params.towerId ? (
          <>
            <Link className="back" to="/admin/towers">
              返回防御塔
            </Link>
            <h1>防御塔</h1>
            {error ? (
              <p className="alert" role="alert">
                {error}
              </p>
            ) : missingTower ? (
              <p className="alert" role="alert">
                找不到这座塔。
              </p>
            ) : (
              <p className="empty">正在读取已保存的内容。</p>
            )}
          </>
        ) : hero ? (
          <>
            <Link className="back" to="/admin/heroes">
              返回英雄
            </Link>
            <h1>{hero.name}</h1>
            <p className="lede">{hero.summary}</p>
            <HeroSheet
              hero={hero}
              onSaved={(saved) =>
                setContent((current) =>
                  current
                    ? { ...current, heroes: current.heroes.map((item) => (item.id === saved.id ? saved : item)) }
                    : current,
                )
              }
            />
          </>
        ) : params.heroId ? (
          <>
            <Link className="back" to="/admin/heroes">
              返回英雄
            </Link>
            <h1>英雄</h1>
            {error ? (
              <p className="alert" role="alert">
                {error}
              </p>
            ) : missingHero ? (
              <p className="alert" role="alert">
                找不到这位英雄。
              </p>
            ) : (
              <p className="empty">正在读取已保存的内容。</p>
            )}
          </>
        ) : section.id === 'levels' ? (
          <LevelMenu
            label={section.label}
            note={section.note}
            content={content}
            error={error}
            onCreated={(created) =>
              setContent((current) => (current ? { ...current, levels: [...current.levels, created] } : current))
            }
          />
        ) : (
          <>
            <h1>{section.label}</h1>
            <p className="lede">{section.note}</p>
            {error ? (
              <p className="alert" role="alert">
                {error}
              </p>
            ) : section.id === 'themes' && content ? (
              <ThemeList themes={content.themes} />
            ) : section.id === 'monsters' && content ? (
              <MonsterList monsters={content.monsters} />
            ) : section.id === 'towers' && content ? (
              <TowerList towers={content.towers} />
            ) : section.id === 'heroes' && content ? (
              <HeroList heroes={content.heroes} />
            ) : (
              <p className="empty">
                {section.id === 'rules'
                  ? '规则还没开始定。'
                  : content
                    ? `已保存 ${section.count(content)} 条。设计确认前，这里不会预置内容。`
                    : '正在读取已保存的内容。'}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function LevelMenu({
  label,
  note,
  content,
  error,
  onCreated,
}: {
  label: string
  note: string
  content: Content | null
  error: string | null
  onCreated: (level: Level) => void
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const themes = content?.themes ?? []

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{label}</h1>
          <p className="lede">{note}</p>
        </div>
        <button
          ref={buttonRef}
          className="btn btn-gold"
          type="button"
          onClick={() => setOpen(true)}
          disabled={!content || themes.length === 0}
        >
          新建
        </button>
      </div>
      {error ? (
        <p className="alert" role="alert">
          {error}
        </p>
      ) : !content ? (
        <p className="empty">正在读取已保存的内容。</p>
      ) : content.levels.length === 0 ? (
        <p className="empty">还没有关卡。点右上角的新建。</p>
      ) : (
        <ul className="theme-list">
          {content.levels.map((level) => {
            const theme = themes.find((item) => item.id === level.themeId)
            const index = content.levels.filter((item) => item.themeId === level.themeId).findIndex((item) => item.id === level.id)
            const code = theme ? levelCode(theme.number, index) : '—'
            return (
              <li key={level.id}>
                <Link className="level-card" to={`/admin/levels/${level.id}`}>
                  <span className="level-code">{code}</span>
                  <span>
                    <span className="theme-name">{level.name}</span>
                    <span className="theme-summary">
                      {theme?.name ?? '未知主题'} · 波次 {level.waveCount} · 起始金币 {level.startingGold} · 防御塔上限 {level.towerLevelCap} 级 · 路线 {level.routes.length} 条
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
      {open && content ? (
        <NewLevelDialog
          themes={themes}
          onClose={() => {
            setOpen(false)
            buttonRef.current?.focus()
          }}
          onCreated={onCreated}
        />
      ) : null}
    </>
  )
}

function HeroList({ heroes }: { heroes: Hero[] }) {
  if (heroes.length === 0) return <p className="empty">还没有英雄。</p>
  return (
    <ul className="theme-list">
      {heroes.map((hero) => {
        const role = heroRole(hero.roleId)
        return (
          <li key={hero.id}>
            <Link className="level-card" to={`/admin/heroes/${hero.id}`}>
              <ArthurFigure animate={false} className="creature-thumb" decorative />
              <span>
                <span className="theme-name">{hero.name}</span>
                <span className="theme-summary">
                  {role?.name ?? '英雄'} · 血量 {hero.health} · 物理攻击 {attackLabel(hero)} · 移速 {hero.speed}
                </span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function TowerList({ towers }: { towers: Tower[] }) {
  if (towers.length === 0) {
    return <p className="empty">还没有防御塔。</p>
  }

  return (
    <ul className="theme-list">
      {towers.map((tower) => {
        const first = tower.ranks[0]
        return (
          <li key={tower.id}>
            <Link className="level-card" to={`/admin/towers/${tower.id}`}>
              {tower.id === 'tower-royal-archer' ? (
                <ArcherTower animate={false} className="creature-thumb" decorative interval={tower.attackInterval} />
              ) : (
                <span className="creature-thumb" />
              )}
              <span>
                <span className="theme-name">{tower.name}</span>
                <span className="theme-summary">
                  {tower.kind}，1 级造价 {first?.cost ?? 0}，攻击 {first ? attackLabel(first) : '—'}
                </span>
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function TowerSheet({ tower }: { tower: Tower }) {
  return (
    <article className="tower">
      {tower.id === 'tower-royal-archer' ? (
        <>
          <ArcherTower interval={tower.attackInterval} />
          <p className="map-caption">这是皇家箭术师站在箭塔上放箭的样子。每 {amountLabel(tower.attackInterval)} 秒射出一箭。</p>
        </>
      ) : null}
      <p className="stat-note">攻速 {amountLabel(tower.attackInterval)} 秒</p>
      <h2 className="block-title">等级</h2>
      <ul className="rank-list">
        {tower.ranks.map((rank) => (
          <li key={rank.level}>
            <span>{rank.level} 级</span>
            <span>造价 {rank.cost}</span>
            <span>攻击 {attackLabel(rank)}</span>
          </li>
        ))}
      </ul>
      <h2 className="block-title">技能</h2>
      <p className="map-caption">升到 {tower.skillUnlockLevel} 级之后才能学习。</p>
      {tower.skills.map((skill) => (
        <section key={skill.id} className="skill-block">
          <h3>{skill.name}</h3>
          <ul className="rank-list">
            {skill.ranks.map((rank, index) => (
              <li key={rank.rank}>
                <span>{rank.rank} 级</span>
                <span>{skillEffectLabel(skill, index)}</span>
                <span>冷却 {amountLabel(skillCooldown(skill, index))} 秒</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  )
}

function MonsterList({ monsters }: { monsters: Monster[] }) {
  if (monsters.length === 0) {
    return <p className="empty">还没有怪物。</p>
  }

  return (
    <ul className="theme-list">
      {monsters.map((monster) => (
        <li key={monster.id}>
          <Link className="level-card" to={`/admin/monsters/${monster.id}`}>
            {monster.id === 'monster-goat' ? (
              <GoatFigure animate={false} className="creature-thumb" decorative speed={monster.speed} />
            ) : (
              <span className="creature-thumb" />
            )}
            <span>
              <span className="theme-name">{monster.name}</span>
              <span className="theme-summary">
                血量 {monster.health}，速度 {monster.speed}，击杀 {monster.gold} 金币
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function MonsterSheet({ monster }: { monster: Monster }) {
  return (
    <article className="monster">
      {monster.id === 'monster-goat' ? (
        <>
          <GoatFigure speed={monster.speed} />
          <p className="map-caption">这是山羊走在草上的样子。移动速度是 {monster.speed}。</p>
        </>
      ) : null}
      <dl className="stat-line">
        <div>
          <dt>血量</dt>
          <dd>{monster.health}</dd>
        </div>
        <div>
          <dt>移动速度</dt>
          <dd>{monster.speed}</dd>
        </div>
        <div>
          <dt>护甲</dt>
          <dd>{protectionLabel(monster.armor)}</dd>
        </div>
        <div>
          <dt>魔法抗性</dt>
          <dd>{protectionLabel(monster.magicResist)}</dd>
        </div>
        <div>
          <dt>攻击力</dt>
          <dd>{attackLabel(monster)}</dd>
        </div>
        <div>
          <dt>击杀金币</dt>
          <dd>{monster.gold}</dd>
        </div>
      </dl>
    </article>
  )
}

function ThemeList({ themes }: { themes: Theme[] }) {
  if (themes.length === 0) {
    return <p className="empty">还没有主题。</p>
  }

  return (
    <ul className="theme-list">
      {themes.map((theme) => (
        <li key={theme.id}>
          <Link className="theme-card" to={`/admin/themes/${theme.id}`}>
            <span className="theme-stripes" aria-hidden="true">
              {theme.palette.slice(0, 3).map((color) => (
                <span key={color.hex} style={{ backgroundColor: color.hex }} />
              ))}
            </span>
            <span>
              <span className="theme-name">{theme.name}</span>
              <span className="theme-summary">{theme.summary}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function ThemeStyle({ theme }: { theme: Theme }) {
  return (
    <article className="theme">
      {theme.id === 'theme-grassland' ? (
        <>
          <GrasslandMap />
          <p className="map-caption">这是青青草原的地图样子。土径用来看路怎么画在草上，还不是某一关的路线。</p>
        </>
      ) : null}
      <ul className="swatches">
        {theme.palette.map((color) => (
          <li key={color.hex}>
            <span className="chip" style={{ backgroundColor: color.hex }} />
            <span>{color.name}</span>
          </li>
        ))}
      </ul>
      <p>{theme.ground}</p>
      <p>{theme.path}</p>
      <p>
        {theme.viewpoint}
        {theme.light}
      </p>
      <p>点缀用{theme.props.join('、')}。</p>
      <p>{theme.mayChange}</p>
    </article>
  )
}
