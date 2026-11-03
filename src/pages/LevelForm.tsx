import { useEffect, useRef, useState, type FormEvent } from 'react'
import { updateLevel } from '../api'
import { alignLevelWaves, type Level, type LevelWave, type Monster, type SpawnGroup } from '../shared/content'
import { LedgerNumber } from './LedgerNumber'
import { LedgerSelect } from './LedgerSelect'

function waveTotal(value: string, fallback: number) {
  const count = Number(value)
  return Number.isInteger(count) && count >= 1 && count <= 99 ? count : fallback
}

function boardFor(level: Level, count: number, current: LevelWave[] | undefined) {
  return alignLevelWaves(current ?? level.waves, count, level.routes)
}

export function LevelForm({
  level,
  monsters,
  capMax,
  onSaved,
}: {
  level: Level
  monsters: Monster[]
  capMax: number
  onSaved: (level: Level) => void
}) {
  const [name, setName] = useState(level.name)
  const [waveCount, setWaveCount] = useState(String(level.waveCount))
  const [startingGold, setStartingGold] = useState(String(level.startingGold ?? 0))
  const [towerLevelCap, setTowerLevelCap] = useState(String(level.towerLevelCap ?? capMax))
  const [waves, setWaves] = useState<LevelWave[]>(() => boardFor(level, level.waveCount, level.waves))
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const dirty = useRef(false)
  const waveCountRef = useRef(waveCount)
  waveCountRef.current = waveCount

  useEffect(() => {
    const count = waveTotal(waveCountRef.current, level.waveCount)
    if (dirty.current) {
      setWaves((current) => boardFor(level, count, current))
      return
    }
    setName(level.name)
    setWaveCount(String(level.waveCount))
    setStartingGold(String(level.startingGold ?? 0))
    setTowerLevelCap(String(level.towerLevelCap ?? capMax))
    setWaves(boardFor(level, level.waveCount, level.waves))
  }, [level, capMax])

  function markDirty() {
    dirty.current = true
    setStatus(null)
  }

  function changeWaveCount(value: string) {
    markDirty()
    setWaveCount(value)
    const count = Number(value)
    if (!Number.isInteger(count) || count < 1 || count > 99) return
    setWaves((current) => boardFor(level, count, current))
  }

  function updateGroups(waveIndex: number, spawnIndex: number, change: (groups: SpawnGroup[]) => SpawnGroup[]) {
    markDirty()
    setWaves((current) =>
      boardFor(level, waveTotal(waveCount, level.waveCount), current).map((wave, index) => {
        if (index !== waveIndex) return wave
        return {
          spawns: wave.spawns.map((spawn, spot) => {
            if (spot !== spawnIndex) return spawn
            return { ...spawn, groups: change(spawn.groups) }
          }),
        }
      }),
    )
  }

  function addGroup(waveIndex: number, spawnIndex: number) {
    updateGroups(waveIndex, spawnIndex, (groups) => [...groups, { monsterId: '', count: 0 }])
  }

  function removeGroup(waveIndex: number, spawnIndex: number, groupIndex: number) {
    updateGroups(waveIndex, spawnIndex, (groups) => groups.filter((_, index) => index !== groupIndex))
  }

  function changeGroupMonster(waveIndex: number, spawnIndex: number, groupIndex: number, monsterId: string) {
    updateGroups(waveIndex, spawnIndex, (groups) =>
      groups.map((group, index) => {
        if (index !== groupIndex) return group
        if (!monsterId) return { ...group, monsterId: '' }
        return { ...group, monsterId, count: group.count > 0 ? group.count : 1 }
      }),
    )
  }

  function changeGroupCount(waveIndex: number, spawnIndex: number, groupIndex: number, value: string) {
    const count = value.trim() === '' ? 0 : Number(value)
    if (value.trim() !== '' && (!Number.isInteger(count) || count < 0 || count > 999)) return
    updateGroups(waveIndex, spawnIndex, (groups) =>
      groups.map((group, index) => (index === groupIndex ? { ...group, count } : group)),
    )
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('请填写关卡名称')
      return
    }
    const wavesNumber = Number(waveCount)
    if (waveCount.trim() === '' || !Number.isInteger(wavesNumber) || wavesNumber < 1 || wavesNumber > 99) {
      setError('怪物波次要填 1 到 99 的整数')
      return
    }
    const gold = Number(startingGold)
    if (startingGold.trim() === '' || !Number.isInteger(gold) || gold < 0 || gold > 99999) {
      setError('起始金币要填 0 到 99999 的整数')
      return
    }
    const cap = Number(towerLevelCap)
    if (towerLevelCap.trim() === '' || !Number.isInteger(cap) || cap < 1 || cap > capMax) {
      setError(`防御塔等级上限要填 1 到 ${capMax} 的整数`)
      return
    }
    const nextWaves = boardFor(level, wavesNumber, waves)
    for (const [waveIndex, wave] of nextWaves.entries()) {
      for (const [spawnIndex, spawn] of wave.spawns.entries()) {
        const where = `第 ${waveIndex + 1} 波出怪口 ${spawnIndex + 1}`
        const seen = new Set<string>()
        for (const group of spawn.groups) {
          if (!group.monsterId) {
            setError(`${where}要选择怪物`)
            return
          }
          if (!Number.isInteger(group.count) || group.count < 1 || group.count > 999) {
            setError(`${where}的数量要填 1 到 999`)
            return
          }
          if (seen.has(group.monsterId)) {
            setError(`${where}里同一种怪物只要一行`)
            return
          }
          seen.add(group.monsterId)
        }
      }
    }
    setSaving(true)
    setError(null)
    try {
      const saved = await updateLevel(level.id, {
        name: trimmed,
        waveCount: wavesNumber,
        startingGold: gold,
        towerLevelCap: cap,
        waves: nextWaves,
      })
      dirty.current = false
      onSaved(saved)
      setStatus('关卡已保存')
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : '关卡没有保存')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="level-form" onSubmit={(event) => void onSubmit(event)}>
      <label className="form-row">
        <span>关卡名称</span>
        <input value={name} maxLength={40} autoComplete="off" onChange={(event) => { markDirty(); setName(event.target.value) }} />
      </label>
      <div className="form-row">
        <span>怪物波次</span>
        <LedgerNumber label="怪物波次" value={waveCount} min={1} max={99} onChange={changeWaveCount} />
      </div>
      <div className="form-row">
        <span>起始金币</span>
        <LedgerNumber label="起始金币" value={startingGold} min={0} max={99999} onChange={(value) => { markDirty(); setStartingGold(value) }} />
      </div>
      <div className="form-row">
        <span>防御塔等级上限</span>
        <LedgerNumber label="防御塔等级上限" value={towerLevelCap} min={1} max={capMax} onChange={(value) => { markDirty(); setTowerLevelCap(value) }} />
      </div>
      <p className="map-caption">目前防御塔最高 {capMax} 级。这一关只能造到所填的等级。</p>
      {level.routes.length === 0 ? (
        <p className="map-caption">路线画好之后，可以安排每一波、每个出怪口的怪物种类和数量。</p>
      ) : (
        <>
        <p className="map-caption">同一个出怪口可以同时出好几种怪物，每种一行。</p>
        <div className="wave-board">
          {boardFor(level, waveTotal(waveCount, level.waveCount), waves).map((wave, waveIndex) => (
            <fieldset key={waveIndex} className="wave-card">
              <legend>第 {waveIndex + 1} 波</legend>
              {wave.spawns.map((spawn, spawnIndex) => {
                const where = `第 ${waveIndex + 1} 波出怪口 ${spawnIndex + 1}`
                const pending = spawn.groups.some((group) => !group.monsterId)
                return (
                  <div key={spawn.routeId} className="spawn-block">
                    <span className="spawn-name">出怪口 {spawnIndex + 1}</span>
                    <div className="spawn-groups">
                      {spawn.groups.length === 0 ? <p className="spawn-empty">不出怪</p> : null}
                      {spawn.groups.map((group, groupIndex) => {
                        const taken = new Set(
                          spawn.groups.filter((_, index) => index !== groupIndex).map((item) => item.monsterId),
                        )
                        const options = [
                          ...(group.monsterId ? [] : [{ value: '', label: '选择怪物' }]),
                          ...monsters
                            .filter((monster) => monster.id === group.monsterId || !taken.has(monster.id))
                            .map((monster) => ({ value: monster.id, label: monster.name })),
                        ]
                        return (
                          <div key={groupIndex} className="spawn-group">
                            <LedgerSelect
                              label={`${where} 的第 ${groupIndex + 1} 种怪物`}
                              value={group.monsterId}
                              options={options}
                              onChange={(monsterId) => changeGroupMonster(waveIndex, spawnIndex, groupIndex, monsterId)}
                            />
                            <LedgerNumber
                              label={`${where} 的第 ${groupIndex + 1} 种怪物的数量`}
                              value={group.count === 0 ? '' : String(group.count)}
                              min={0}
                              max={999}
                              placeholder="数量"
                              onChange={(value) => changeGroupCount(waveIndex, spawnIndex, groupIndex, value)}
                            />
                            <button className="btn" type="button" onClick={() => removeGroup(waveIndex, spawnIndex, groupIndex)}>
                              移除
                            </button>
                          </div>
                        )
                      })}
                      <button
                        className="btn"
                        type="button"
                        disabled={pending || spawn.groups.length >= monsters.length}
                        onClick={() => addGroup(waveIndex, spawnIndex)}
                      >
                        添加怪物
                      </button>
                    </div>
                  </div>
                )
              })}
            </fieldset>
          ))}
        </div>
        </>
      )}
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
          保存关卡
        </button>
      </div>
    </form>
  )
}
