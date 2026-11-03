import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getContent } from '../api'
import type { Content } from '../shared/content'

export function GatePage() {
  const [content, setContent] = useState<Content | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getContent()
      .then(setContent)
      .catch((reason: unknown) => {
        setError(reason instanceof Error ? reason.message : '内容服务没有响应')
      })
  }, [])

  const title = content?.settings.title ?? '王国保卫战'

  return (
    <main className="gate">
      <article className="sheet">
        <h1>{title}</h1>
        <p className="lede">
          第一主题是{content?.themes[0]?.name ?? '青青草原'}。第一只怪物是山羊，第一座防御塔是皇家箭术师，第一位英雄是战士亚瑟。后台负责改关卡和数值，战场负责打。
        </p>
        <div className="actions">
          <Link className="btn btn-gold" to="/admin/levels">
            进入后台
          </Link>
          <Link className="btn" to="/field">
            打开战场
          </Link>
        </div>
        {error ? (
          <p className="alert" role="alert">
            {error}。先确认内容服务已在 8787 端口运行。
          </p>
        ) : (
          <dl className="counts">
            <div>
              <dt>关卡</dt>
              <dd>{content ? content.levels.length : '…'}</dd>
            </div>
            <div>
              <dt>怪物</dt>
              <dd>{content ? content.monsters.length : '…'}</dd>
            </div>
            <div>
              <dt>防御塔</dt>
              <dd>{content ? content.towers.length : '…'}</dd>
            </div>
            <div>
              <dt>英雄</dt>
              <dd>{content ? content.heroes.length : '…'}</dd>
            </div>
          </dl>
        )}
      </article>
    </main>
  )
}
