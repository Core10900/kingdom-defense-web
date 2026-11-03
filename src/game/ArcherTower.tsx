import { useEffect, useRef } from 'react'

const meadow = '#4E8A45'
const young = '#8FBF56'
const deep = '#2F5E38'
const dirt = '#C6A36A'
const mud = '#8D6840'
const stone = '#A08A6A'
const stoneShade = '#6B5340'
const timber = '#6B4E32'
const timberDark = '#4A3424'
const cloak = '#8E2E2E'
const tunic = '#F3E6C8'
const gold = '#E4C27A'
const ink = '#241C14'
const skin = '#C9956A'

function drawArcherTower(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  interval: number,
  moving: boolean,
) {
  const scale = height / 300
  const ground = height * 0.8
  const x = width * 0.36
  const cycle = Math.max(interval, 0.1) * 1000
  const phase = moving ? (time % cycle) / cycle : 0.5
  const draw = phase < 0.55 ? phase / 0.55 : phase < 0.64 ? 1 - (phase - 0.55) / 0.09 : 0
  const flight = phase >= 0.55 && phase < 0.9 ? (phase - 0.55) / 0.35 : -1

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = meadow
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = deep
  ctx.globalAlpha = 0.4
  ctx.beginPath()
  ctx.ellipse(width * 0.55, height * 0.2, width * 0.62, height * 0.16, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  ctx.fillStyle = mud
  ctx.fillRect(0, ground - 4 * scale, width, height - ground + 4 * scale)
  ctx.fillStyle = dirt
  ctx.fillRect(0, ground + 2 * scale, width, 14 * scale)
  drawTuft(ctx, x - 120 * scale, ground, scale, Math.sin(time / 700) * 0.25)
  drawTuft(ctx, x + 250 * scale, ground, scale * 0.85, Math.sin(time / 640 + 1) * 0.25)

  const deck = ground - 78 * scale
  ctx.fillStyle = deep
  ctx.globalAlpha = 0.2
  ctx.beginPath()
  ctx.ellipse(x + 8 * scale, ground + 2 * scale, 54 * scale, 10 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  ctx.fillStyle = stoneShade
  ctx.beginPath()
  ctx.ellipse(x, ground - 8 * scale, 46 * scale, 16 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = stone
  ctx.beginPath()
  ctx.ellipse(x - 2 * scale, ground - 14 * scale, 40 * scale, 14 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#E7D3A4'
  ctx.globalAlpha = 0.55
  ctx.beginPath()
  ctx.ellipse(x - 12 * scale, ground - 18 * scale, 12 * scale, 5 * scale, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  ctx.fillStyle = timberDark
  for (const post of [-22, -8, 8, 22]) {
    ctx.fillRect(x + post * scale, deck + 8 * scale, 6 * scale, ground - deck - 10 * scale)
  }
  ctx.fillStyle = timber
  ctx.fillRect(x - 34 * scale, deck, 68 * scale, 10 * scale)
  ctx.fillStyle = '#8A6844'
  ctx.fillRect(x - 32 * scale, deck + 2 * scale, 64 * scale, 3 * scale)

  ctx.strokeStyle = timberDark
  ctx.lineWidth = 3 * scale
  ctx.beginPath()
  ctx.moveTo(x - 30 * scale, deck)
  ctx.lineTo(x - 30 * scale, deck - 16 * scale)
  ctx.lineTo(x + 30 * scale, deck - 16 * scale)
  ctx.lineTo(x + 30 * scale, deck)
  ctx.stroke()

  drawBanner(ctx, x - 38 * scale, deck - 62 * scale, scale, Math.sin(time / 520) * (moving ? 1 : 0))

  const bodyX = x + 2 * scale
  const bodyY = deck - 28 * scale
  const pull = draw * 16 * scale
  ctx.fillStyle = cloak
  ctx.beginPath()
  ctx.ellipse(bodyX - 8 * scale, bodyY + 4 * scale, 16 * scale, 18 * scale, -0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = tunic
  ctx.beginPath()
  ctx.ellipse(bodyX, bodyY, 12 * scale, 16 * scale, 0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = gold
  ctx.fillRect(bodyX - 8 * scale, bodyY - 2 * scale, 16 * scale, 2.4 * scale)

  ctx.fillStyle = skin
  ctx.beginPath()
  ctx.ellipse(bodyX + 2 * scale, bodyY - 20 * scale, 8 * scale, 9 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = timberDark
  ctx.beginPath()
  ctx.ellipse(bodyX + 1 * scale, bodyY - 26 * scale, 9 * scale, 5 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = gold
  ctx.fillRect(bodyX - 8 * scale, bodyY - 24 * scale, 18 * scale, 2 * scale)
  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.ellipse(bodyX + 6 * scale, bodyY - 20 * scale, 1.4 * scale, 1.4 * scale, 0, 0, Math.PI * 2)
  ctx.fill()

  const bowX = bodyX + 18 * scale
  const bowY = bodyY - 6 * scale
  const stringX = bowX - 4 * scale - pull
  ctx.strokeStyle = timberDark
  ctx.lineWidth = 3 * scale
  ctx.beginPath()
  ctx.moveTo(bowX, bowY - 22 * scale)
  ctx.quadraticCurveTo(bowX + 16 * scale, bowY, bowX, bowY + 22 * scale)
  ctx.stroke()
  ctx.strokeStyle = tunic
  ctx.lineWidth = 1.4 * scale
  ctx.beginPath()
  ctx.moveTo(bowX, bowY - 20 * scale)
  ctx.lineTo(stringX, bowY)
  ctx.lineTo(bowX, bowY + 20 * scale)
  ctx.stroke()

  ctx.strokeStyle = skin
  ctx.lineWidth = 4 * scale
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(bodyX + 6 * scale, bodyY - 2 * scale)
  ctx.lineTo(bowX - 2 * scale, bowY + 4 * scale)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(bodyX - 2 * scale, bodyY)
  ctx.lineTo(stringX, bowY)
  ctx.stroke()

  if (flight < 0) {
    drawArrow(ctx, stringX, bowY, bowX + 28 * scale, bowY - 2 * scale, scale, 1)
  } else {
    const startX = bowX + 10 * scale
    const endX = width * 0.86
    const arrowX = startX + (endX - startX) * flight
    ctx.globalAlpha = 1 - flight * 0.35
    drawArrow(ctx, arrowX, bowY - flight * 6 * scale, arrowX + 28 * scale, bowY - 4 * scale - flight * 6 * scale, scale, 1)
    ctx.globalAlpha = 1
  }
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  scale: number,
  alpha: number,
) {
  ctx.save()
  ctx.globalAlpha *= alpha
  ctx.strokeStyle = '#C6A36A'
  ctx.lineWidth = 1.6 * scale
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()
  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.moveTo(x2, y2)
  ctx.lineTo(x2 - 7 * scale, y2 - 3 * scale)
  ctx.lineTo(x2 - 7 * scale, y2 + 3 * scale)
  ctx.fill()
  ctx.strokeStyle = cloak
  ctx.lineWidth = 1.4 * scale
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 + 5 * scale, y1 - 3 * scale)
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 + 5 * scale, y1 + 3 * scale)
  ctx.stroke()
  ctx.restore()
}

function drawBanner(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, sway: number) {
  ctx.fillStyle = timberDark
  ctx.fillRect(x, y, 3 * scale, 78 * scale)
  ctx.fillStyle = gold
  ctx.beginPath()
  ctx.arc(x + 1.5 * scale, y, 4 * scale, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = cloak
  ctx.beginPath()
  ctx.moveTo(x + 3 * scale, y + 6 * scale)
  ctx.lineTo(x + (26 + sway * 4) * scale, y + (12 + sway) * scale)
  ctx.lineTo(x + (22 + sway * 3) * scale, y + 24 * scale)
  ctx.lineTo(x + 3 * scale, y + 20 * scale)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = gold
  ctx.fillRect(x + 8 * scale, y + 12 * scale, 8 * scale, 2 * scale)
}

function drawTuft(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, bend: number) {
  for (let index = 0; index < 5; index += 1) {
    const lean = (index - 2) * 0.22 + bend
    ctx.strokeStyle = index % 2 === 0 ? deep : meadow
    ctx.lineWidth = 1.6 * scale
    ctx.beginPath()
    ctx.moveTo(x + index * 3 * scale, y)
    ctx.quadraticCurveTo(x + lean * 10 * scale, y - 12 * scale, x + lean * 18 * scale, y - 22 * scale)
    ctx.stroke()
    ctx.strokeStyle = young
    ctx.lineWidth = 1.2 * scale
    ctx.beginPath()
    ctx.moveTo(x + lean * 12 * scale, y - 16 * scale)
    ctx.lineTo(x + lean * 18 * scale, y - 22 * scale)
    ctx.stroke()
  }
}

export function ArcherTower({
  animate = true,
  className = 'creature-plate',
  label = '皇家箭术师',
  decorative = false,
  interval = 0.9,
}: {
  animate?: boolean
  className?: string
  label?: string
  decorative?: boolean
  interval?: number
}) {
  const node = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = node.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const moving = animate && !reduce
    let frame = 0

    const paint = (time: number) => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (width === 0 || height === 0) {
        frame = requestAnimationFrame(paint)
        return
      }
      const density = Math.min(window.devicePixelRatio || 1, 2)
      const pixelWidth = Math.round(width * density)
      const pixelHeight = Math.round(height * density)
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth
        canvas.height = pixelHeight
      }
      ctx.setTransform(density, 0, 0, density, 0, 0)
      drawArcherTower(ctx, width, height, moving ? time : 0, interval, moving)
      if (moving) frame = requestAnimationFrame(paint)
    }

    frame = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(frame)
  }, [animate, interval])

  return (
    <canvas
      ref={node}
      className={className}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
    />
  )
}
