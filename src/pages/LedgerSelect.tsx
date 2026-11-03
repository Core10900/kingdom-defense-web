import { useEffect, useId, useRef, useState, type KeyboardEvent, type Ref } from 'react'

export type LedgerOption = {
  value: string
  label: string
}

export function LedgerSelect({
  value,
  options,
  onChange,
  label,
  buttonRef,
}: {
  value: string
  options: LedgerOption[]
  onChange: (value: string) => void
  label?: string
  buttonRef?: Ref<HTMLButtonElement>
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [placeAbove, setPlaceAbove] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listId = useId()
  const selected = Math.max(0, options.findIndex((option) => option.value === value))
  const current = options[selected]

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function setTrigger(node: HTMLButtonElement | null) {
    triggerRef.current = node
    if (typeof buttonRef === 'function') buttonRef(node)
    else if (buttonRef) buttonRef.current = node
  }

  function openMenu(next = selected) {
    const rect = triggerRef.current?.getBoundingClientRect()
    const spaceBelow = rect ? window.innerHeight - rect.bottom : 240
    const spaceAbove = rect ? rect.top : 0
    setPlaceAbove(spaceBelow < 220 && spaceAbove > spaceBelow)
    setActive(Math.min(Math.max(next, 0), Math.max(options.length - 1, 0)))
    setOpen(true)
  }

  function choose(index: number) {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    setOpen(false)
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        openMenu(selected)
        return
      }
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((index) => Math.min(Math.max(index + step, 0), options.length - 1))
      return
    }
    if (event.key === 'Home' && open) {
      event.preventDefault()
      setActive(0)
      return
    }
    if (event.key === 'End' && open) {
      event.preventDefault()
      setActive(options.length - 1)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!open) openMenu(selected)
      else choose(active)
      return
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
    }
  }

  return (
    <div className="ledger-select" ref={rootRef}>
      <button
        ref={setTrigger}
        type="button"
        className="ledger-select-trigger"
        aria-label={label ? `${label}，${current?.label ?? ''}` : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu(selected))}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node)) setOpen(false)
        }}
      >
        <span>{current?.label ?? ''}</span>
        <svg className="ledger-select-chevron" viewBox="0 0 12 8" aria-hidden="true">
          <path d="M1 1.5 L6 6.5 L11 1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
      {open ? (
        <ul id={listId} className={placeAbove ? 'ledger-select-menu is-above' : 'ledger-select-menu'} role="listbox">
          {options.map((option, index) => (
            <li key={option.value || 'empty'} role="presentation">
              <button
                id={`${listId}-${index}`}
                type="button"
                role="option"
                className={index === active ? 'ledger-select-option is-active' : 'ledger-select-option'}
                aria-selected={option.value === value}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(index)}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
