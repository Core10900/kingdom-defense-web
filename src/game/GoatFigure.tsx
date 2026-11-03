import { useEffect, useRef } from 'react'

const meadow = '#4E8A45'
const young = '#8FBF56'
const deep = '#2F5E38'
const dirt = '#C6A36A'
const mud = '#8D6840'
const wool = '#E4D0A4'
const woolShade = '#C6A56A'
const face = '#C9956A'
const muzzle = '#A56B42'
const horn = '#E7D3B0'
const hornShade = '#8A6A45'
const legNear = '#7A4E32'
const legFar = '#5A3A28'
const hoof = '#3A2A1C'
const ink = '#241C14'

function drawPath(ctx: CanvasRenderingContext2D, width: number, ground: number, scale: number) {
  ctx.fillStyle = mud
  ctx.beginPath()
  ctx.moveTo(0, ground - 8 * scale)
  ctx.quadraticCurveTo(width * 0.35, ground - 16 * scale, width * 0.62, ground - 6 * scale)
  ctx.quadraticCurveTo(width * 0.84, ground + 2 * scale, width, ground - 10 * scale)
  ctx.lineTo(width, ground + 28 * scale)
  ctx.lineTo(0, ground + 28 * scale)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = dirt
  ctx.beginPath()
  ctx.moveTo(0, ground - 2 * scale)
  ctx.quadraticCurveTo(width * 0.4, ground - 8 * scale, width * 0.7, ground + 2 * scale)
  ctx.quadraticCurveTo(width * 0.88, ground + 6 * scale, width, ground)
  ctx.lineTo(width, ground + 16 * scale)
  ctx.lineTo(0, ground + 16 * scale)
  ctx.closePath()
  ctx.fill()
}

function drawGoat(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, speed: number) {
  const scale = (height / 300) * 1.28
  const ground = height * 0.8
  const bodyX = width * 0.42
  const pace = 980 - ((speed - 1) / 9) * 700
  const step = time / pace
  const swing = Math.sin(step) * 16 * scale
  const bob = Math.abs(Math.sin(step)) * 3 * scale
  const bodyY = ground - 86 * scale + bob

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = meadow
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = deep
  ctx.globalAlpha = 0.4
  ctx.beginPath()
  ctx.ellipse(width * 0.5, height * 0.2, width * 0.7, height * 0.18, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  drawPath(ctx, width, ground, scale)
  drawTuft(ctx, bodyX - 150 * scale, ground, scale, Math.sin(time / 700) * 0.3)
  drawTuft(ctx, bodyX + 190 * scale, ground, scale * 0.9, Math.sin(time / 640 + 1) * 0.3)

  ctx.fillStyle = deep
  ctx.globalAlpha = 0.22
  ctx.beginPath()
  ctx.ellipse(bodyX + 12 * scale, ground + 2 * scale, 78 * scale, 11 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  const hipY = bodyY + 22 * scale
  drawLeg(ctx, bodyX - 46 * scale, hipY, ground, -swing, scale, true)
  drawLeg(ctx, bodyX + 36 * scale, hipY, ground, swing, scale, true)

  ctx.fillStyle = woolShade
  ctx.beginPath()
  ctx.ellipse(bodyX - 62 * scale, bodyY + 4 * scale, 34 * scale, 26 * scale, -0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(bodyX + 8 * scale, bodyY + 10 * scale, 58 * scale, 34 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = wool
  ctx.beginPath()
  ctx.ellipse(bodyX - 24 * scale, bodyY - 6 * scale, 42 * scale, 28 * scale, -0.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(bodyX + 28 * scale, bodyY - 2 * scale, 36 * scale, 26 * scale, 0.1, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#F4E7C8'
  ctx.beginPath()
  ctx.ellipse(bodyX - 8 * scale, bodyY - 16 * scale, 28 * scale, 14 * scale, -0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = woolShade
  ctx.beginPath()
  ctx.ellipse(bodyX - 78 * scale, bodyY - 2 * scale, 12 * scale, 9 * scale, -0.8, 0, Math.PI * 2)
  ctx.fill()

  drawLeg(ctx, bodyX - 30 * scale, hipY, ground, swing, scale, false)
  drawLeg(ctx, bodyX + 50 * scale, hipY, ground, -swing, scale, false)

  const headX = bodyX + 86 * scale
  const headY = bodyY - 34 * scale
  ctx.strokeStyle = woolShade
  ctx.lineWidth = 18 * scale
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(bodyX + 42 * scale, bodyY - 6 * scale)
  ctx.quadraticCurveTo(bodyX + 64 * scale, headY + 20 * scale, headX - 10 * scale, headY + 10 * scale)
  ctx.stroke()

  ctx.fillStyle = woolShade
  ctx.beginPath()
  ctx.ellipse(headX - 18 * scale, headY + 4 * scale, 9 * scale, 14 * scale, 0.9, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = face
  ctx.beginPath()
  ctx.ellipse(headX, headY, 30 * scale, 26 * scale, 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = muzzle
  ctx.beginPath()
  ctx.ellipse(headX + 22 * scale, headY + 8 * scale, 16 * scale, 11 * scale, 0.25, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = ink
  ctx.globalAlpha = 0.8
  ctx.beginPath()
  ctx.ellipse(headX + 28 * scale, headY + 6 * scale, 1.8 * scale, 1.8 * scale, 0, 0, Math.PI * 2)
  ctx.ellipse(headX + 22 * scale, headY + 8 * scale, 1.5 * scale, 1.5 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  drawHorn(ctx, headX - 6 * scale, headY - 16 * scale, scale, 8)
  drawHorn(ctx, headX + 2 * scale, headY - 18 * scale, scale, 0)

  ctx.strokeStyle = '#F4E7C8'
  ctx.lineWidth = 3.4 * scale
  ctx.lineCap = 'round'
  for (const offset of [-2, 4, 10]) {
    ctx.beginPath()
    ctx.moveTo(headX + offset * scale, headY + 18 * scale)
    ctx.quadraticCurveTo(headX + (offset - 2) * scale, headY + 34 * scale, headX + (offset + 3) * scale, headY + 40 * scale)
    ctx.stroke()
  }

  ctx.fillStyle = '#F7F1E4'
  ctx.beginPath()
  ctx.ellipse(headX + 8 * scale, headY - 2 * scale, 8 * scale, 5.5 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = ink
  ctx.beginPath()
  ctx.ellipse(headX + 9 * scale, headY - 1.5 * scale, 5 * scale, 1.7 * scale, 0, 0, Math.PI * 2)
  ctx.fill()

  drawTuft(ctx, bodyX + 8 * scale, ground + 4 * scale, scale * 0.7, Math.sin(time / 680) * 0.2)
}

function drawLeg(
  ctx: CanvasRenderingContext2D,
  hipX: number,
  hipY: number,
  ground: number,
  swing: number,
  scale: number,
  far: boolean,
) {
  const kneeX = hipX + swing * 0.45
  const kneeY = hipY + (ground - hipY) * 0.46
  const hoofX = hipX + swing
  const hoofY = ground
  ctx.strokeStyle = far ? legFar : legNear
  ctx.lineWidth = (far ? 8 : 9) * scale
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(hipX, hipY)
  ctx.lineTo(kneeX, kneeY)
  ctx.lineTo(hoofX, hoofY - 4 * scale)
  ctx.stroke()
  ctx.fillStyle = hoof
  ctx.beginPath()
  ctx.ellipse(hoofX - 3 * scale, hoofY, 4 * scale, 2.4 * scale, 0, 0, Math.PI * 2)
  ctx.ellipse(hoofX + 3 * scale, hoofY, 4 * scale, 2.4 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawHorn(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, shift: number) {
  const tipX = x - (40 + shift) * scale
  const tipY = y - 8 * scale
  ctx.strokeStyle = hornShade
  ctx.lineWidth = 8 * scale
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.bezierCurveTo(x - 4 * scale, y - 28 * scale, x - 30 * scale, y - 40 * scale, tipX, tipY)
  ctx.stroke()
  ctx.strokeStyle = horn
  ctx.lineWidth = 4.5 * scale
  ctx.beginPath()
  ctx.moveTo(x + 1 * scale, y - 2 * scale)
  ctx.bezierCurveTo(x - 2 * scale, y - 24 * scale, x - 26 * scale, y - 34 * scale, tipX + 4 * scale, tipY + 2 * scale)
  ctx.stroke()
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

export function GoatFigure({
  animate = true,
  className = 'creature-plate',
  label = '山羊',
  decorative = false,
  speed = 6,
}: {
  animate?: boolean
  className?: string
  label?: string
  decorative?: boolean
  speed?: number
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
      drawGoat(ctx, width, height, moving ? time : 420, speed)
      if (moving) frame = requestAnimationFrame(paint)
    }

    frame = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(frame)
  }, [animate, speed])

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
