import type { KeyboardEvent } from 'react'

export function LedgerNumber({
  value,
  onChange,
  min,
  max,
  label,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  min: number
  max: number
  label: string
  placeholder?: string
}) {
  const parsed = value.trim() === '' ? null : Number(value)
  const number = parsed !== null && Number.isInteger(parsed) ? parsed : null

  function write(next: number) {
    onChange(String(Math.min(max, Math.max(min, next))))
  }

  function step(delta: number) {
    if (delta < 0 && (number === null || number <= min)) return
    if (number === null) {
      write(Math.max(min, 1))
      return
    }
    write(number + delta)
  }

  function onInput(next: string) {
    if (next === '') {
      onChange('')
      return
    }
    if (!/^\d+$/.test(next)) return
    if (Number(next) > max) return
    onChange(next)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      step(1)
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      step(-1)
    }
  }

  function onBlur() {
    if (number === null) return
    write(number)
  }

  return (
    <div className="ledger-number">
      <button type="button" tabIndex={-1} aria-label={`${label}减一`} disabled={number === null || number <= min} onClick={() => step(-1)}>
        −
      </button>
      <input
        aria-label={label}
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onInput(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      />
      <button type="button" tabIndex={-1} aria-label={`${label}加一`} disabled={number !== null && number >= max} onClick={() => step(1)}>
        +
      </button>
    </div>
  )
}
