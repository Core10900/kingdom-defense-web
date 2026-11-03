import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { createLevel } from '../api'
import type { Level, Theme } from '../shared/content'
import { LedgerNumber } from './LedgerNumber'
import { LedgerSelect } from './LedgerSelect'

export function NewLevelDialog({
  themes,
  onClose,
  onCreated,
}: {
  themes: Theme[]
  onClose: () => void
  onCreated: (level: Level) => void
}) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const themeRef = useRef<HTMLButtonElement>(null)
  const [themeId, setThemeId] = useState(themes[0]?.id ?? '')
  const [name, setName] = useState('')
  const [waveCount, setWaveCount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    themeRef.current?.focus()
  }, [])

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !dialogRef.current) return
    const items = [...dialogRef.current.querySelectorAll<HTMLElement>('button, input')].filter(
      (item) => item.getAttribute('role') !== 'option' && !item.hasAttribute('disabled'),
    )
    const first = items[0]
    const last = items[items.length - 1]
    if (!first || !last) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!themeId) {
      setError('请选择主题')
      return
    }
    const trimmed = name.trim()
    if (!trimmed) {
      setError('请填写关卡名称')
      return
    }
    const waves = Number(waveCount)
    if (waveCount.trim() === '' || !Number.isInteger(waves) || waves < 1 || waves > 99) {
      setError('怪物波次要填 1 到 99 的整数')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const level = await createLevel({ themeId, name: trimmed, waveCount: waves })
      onCreated(level)
      onClose()
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : '关卡没有建成')
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <h2 id={titleId}>新建关卡</h2>
        <form onSubmit={(event) => void onSubmit(event)}>
          <label className="form-row">
            <span>主题</span>
            <LedgerSelect
              buttonRef={themeRef}
              label="主题"
              value={themeId}
              options={themes.map((theme) => ({ value: theme.id, label: `${theme.name}（编号 ${theme.number}）` }))}
              onChange={setThemeId}
            />
          </label>
          <label className="form-row">
            <span>关卡名称</span>
            <input value={name} maxLength={40} autoComplete="off" onChange={(event) => setName(event.target.value)} />
          </label>
          <div className="form-row">
            <span>怪物波次</span>
            <LedgerNumber label="怪物波次" value={waveCount} min={1} max={99} onChange={setWaveCount} />
          </div>
          {error ? (
            <p className="alert" role="alert">
              {error}
            </p>
          ) : null}
          <div className="modal-actions">
            <button className="btn" type="button" onClick={onClose} disabled={saving}>
              取消
            </button>
            <button className="btn btn-gold" type="submit" disabled={saving || themes.length === 0}>
              确定
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
