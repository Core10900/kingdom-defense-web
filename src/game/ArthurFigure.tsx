import { useEffect, useRef } from 'react'

const meadow = '#4E8A45'
const young = '#8FBF56'
const deep = '#2F5E38'
const dirt = '#C6A36A'
const mud = '#8D6840'
const plate = '#C8C2B6'
const plateLight = '#F4F0E6'
const plateShade = '#6E685F'
const plateDark = '#3A3632'
const gold = '#E4C27A'
const goldDeep = '#8F6420'
const banner = '#8E2E2E'
const bannerDeep = '#641F1F'
const leather = '#6B4E32'
const ink = '#241C14'

function tuft(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, lean: number) {
  ctx.strokeStyle = deep
  ctx.lineWidth = 2 * scale
  ctx.lineCap = 'round'
  for (const side of [-1, 0, 1]) {
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.quadraticCurveTo(x + side * 8 * scale + lean * 10 * scale, y - 14 * scale, x + side * 12 * scale + lean * 16 * scale, y - 26 * scale)
    ctx.stroke()
  }
  ctx.strokeStyle = young
  ctx.lineWidth = 1.4 * scale
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.quadraticCurveTo(x + lean * 8 * scale, y - 12 * scale, x + lean * 14 * scale, y - 20 * scale)
  ctx.stroke()
}

function limb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.fillStyle = plateShade
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
  ctx.fill()
  ctx.fillStyle = plate
  ctx.beginPath()
  ctx.roundRect(x, y, width * 0.68, height, radius)
  ctx.fill()
  ctx.fillStyle = plateLight
  ctx.globalAlpha = 0.7
  ctx.beginPath()
  ctx.ellipse(x + width * 0.28, y + height * 0.18, width * 0.18, height * 0.12, -0.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
}

function drawArthur(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, moving: boolean) {
  const scale = height / 300
  const ground = height * 0.86
  const x = width * 0.48
  const breathe = moving ? Math.sin(time / 980) * 2.2 * scale : 0
  const crest = moving ? Math.sin(time / 760) * 0.12 : 0

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = meadow
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = deep
  ctx.globalAlpha = 0.35
  ctx.beginPath()
  ctx.ellipse(width * 0.5, height * 0.18, width * 0.7, height * 0.16, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.fillStyle = mud
  ctx.fillRect(0, ground - 2 * scale, width, height)
  ctx.fillStyle = dirt
  ctx.fillRect(0, ground + 4 * scale, width, 16 * scale)
  tuft(ctx, x - 150 * scale, ground, scale, crest)
  tuft(ctx, x + 170 * scale, ground, scale * 0.9, -crest)

  ctx.fillStyle = deep
  ctx.globalAlpha = 0.22
  ctx.beginPath()
  ctx.ellipse(x + 6 * scale, ground + 2 * scale, 54 * scale, 10 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  const hip = ground - 78 * scale - breathe
  const shoulder = hip - 78 * scale

  limb(ctx, x + 8 * scale, hip + 8 * scale, 22 * scale, 62 * scale, 10 * scale)
  limb(ctx, x - 24 * scale, hip + 4 * scale, 24 * scale, 68 * scale, 11 * scale)
  ctx.fillStyle = goldDeep
  ctx.beginPath()
  ctx.ellipse(x - 12 * scale, hip + 36 * scale, 14 * scale, 8 * scale, 0, 0, Math.PI * 2)
  ctx.ellipse(x + 18 * scale, hip + 40 * scale, 12 * scale, 7 * scale, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = plateDark
  ctx.beginPath()
  ctx.ellipse(x - 16 * scale, ground - 6 * scale, 16 * scale, 7 * scale, -0.2, 0, Math.PI * 2)
  ctx.ellipse(x + 20 * scale, ground - 4 * scale, 14 * scale, 6 * scale, 0.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = plate
  ctx.beginPath()
  ctx.ellipse(x - 18 * scale, ground - 9 * scale, 14 * scale, 5 * scale, -0.2, 0, Math.PI * 2)
  ctx.ellipse(x + 18 * scale, ground - 7 * scale, 12 * scale, 4.5 * scale, 0.15, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = bannerDeep
  ctx.beginPath()
  ctx.moveTo(x - 28 * scale, hip - 8 * scale)
  ctx.lineTo(x + 34 * scale, hip - 4 * scale)
  ctx.lineTo(x + 26 * scale, hip + 28 * scale)
  ctx.lineTo(x - 20 * scale, hip + 32 * scale)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = banner
  ctx.beginPath()
  ctx.moveTo(x - 24 * scale, hip - 10 * scale)
  ctx.lineTo(x + 22 * scale, hip - 6 * scale)
  ctx.lineTo(x + 16 * scale, hip + 22 * scale)
  ctx.lineTo(x - 16 * scale, hip + 26 * scale)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = plateShade
  ctx.beginPath()
  ctx.moveTo(x - 34 * scale, shoulder + 28 * scale)
  ctx.quadraticCurveTo(x, shoulder - 8 * scale, x + 38 * scale, shoulder + 34 * scale)
  ctx.lineTo(x + 30 * scale, hip + 4 * scale)
  ctx.quadraticCurveTo(x, hip + 16 * scale, x - 28 * scale, hip)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = plate
  ctx.beginPath()
  ctx.moveTo(x - 30 * scale, shoulder + 30 * scale)
  ctx.quadraticCurveTo(x - 4 * scale, shoulder - 2 * scale, x + 18 * scale, shoulder + 36 * scale)
  ctx.lineTo(x + 12 * scale, hip)
  ctx.quadraticCurveTo(x - 6 * scale, hip + 12 * scale, x - 26 * scale, hip - 2 * scale)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = goldDeep
  ctx.lineWidth = 3 * scale
  ctx.beginPath()
  ctx.moveTo(x - 2 * scale, shoulder + 18 * scale)
  ctx.lineTo(x - 2 * scale, hip - 2 * scale)
  ctx.moveTo(x - 16 * scale, shoulder + 42 * scale)
  ctx.lineTo(x + 14 * scale, shoulder + 46 * scale)
  ctx.stroke()
  ctx.fillStyle = plateLight
  ctx.globalAlpha = 0.75
  ctx.beginPath()
  ctx.ellipse(x - 12 * scale, shoulder + 24 * scale, 16 * scale, 10 * scale, -0.6, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 1

  limb(ctx, x - 58 * scale, shoulder + 8 * scale, 36 * scale, 22 * scale, 11 * scale)
  limb(ctx, x + 28 * scale, shoulder + 12 * scale, 34 * scale, 20 * scale, 10 * scale)
  ctx.fillStyle = gold
  ctx.beginPath()
  ctx.arc(x - 40 * scale, shoulder + 16 * scale, 4 * scale, 0, Math.PI * 2)
  ctx.arc(x + 44 * scale, shoulder + 20 * scale, 3.5 * scale, 0, Math.PI * 2)
  ctx.fill()

  const shieldX = x - 78 * scale
  const shieldY = shoulder + 18 * scale
  ctx.fillStyle = goldDeep
  ctx.beginPath()
  ctx.moveTo(shieldX + 28 * scale, shieldY)
  ctx.lineTo(shieldX + 62 * scale, shieldY + 18 * scale)
  ctx.lineTo(shieldX + 52 * scale, shieldY + 78 * scale)
  ctx.lineTo(shieldX + 28 * scale, shieldY + 98 * scale)
  ctx.lineTo(shieldX + 4 * scale, shieldY + 78 * scale)
  ctx.lineTo(shieldX - 6 * scale, shieldY + 18 * scale)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = banner
  ctx.beginPath()
  ctx.moveTo(shieldX + 28 * scale, shieldY + 6 * scale)
  ctx.lineTo(shieldX + 54 * scale, shieldY + 20 * scale)
  ctx.lineTo(shieldX + 46 * scale, shieldY + 72 * scale)
  ctx.lineTo(shieldX + 28 * scale, shieldY + 88 * scale)
  ctx.lineTo(shieldX + 10 * scale, shieldY + 72 * scale)
  ctx.lineTo(shieldX, shieldY + 20 * scale)
  ctx.closePath()
  ctx.fill()
  ctx.strokeStyle = gold
  ctx.lineWidth = 3 * scale
  ctx.beginPath()
  ctx.moveTo(shieldX + 28 * scale, shieldY + 16 * scale)
  ctx.lineTo(shieldX + 28 * scale, shieldY + 74 * scale)
  ctx.moveTo(shieldX + 8 * scale, shieldY + 36 * scale)
  ctx.lineTo(shieldX + 48 * scale, shieldY + 36 * scale)
  ctx.stroke()
  limb(ctx, x - 46 * scale, shoulder + 34 * scale, 16 * scale, 28 * scale, 7 * scale)

  ctx.strokeStyle = plateShade
  ctx.lineWidth = 7 * scale
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x + 48 * scale, shoulder + 36 * scale)
  ctx.lineTo(x + 78 * scale, hip + 8 * scale)
  ctx.stroke()
  ctx.strokeStyle = plateLight
  ctx.lineWidth = 3 * scale
  ctx.beginPath()
  ctx.moveTo(x + 46 * scale, shoulder + 34 * scale)
  ctx.lineTo(x + 74 * scale, hip + 4 * scale)
  ctx.stroke()
  ctx.fillStyle = goldDeep
  ctx.fillRect(x + 70 * scale, hip + 2 * scale, 22 * scale, 6 * scale)
  ctx.fillStyle = plateLight
  ctx.beginPath()
  ctx.moveTo(x + 80 * scale, hip + 4 * scale)
  ctx.lineTo(x + 86 * scale, ground - 8 * scale)
  ctx.lineTo(x + 80 * scale, ground - 8 * scale)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = plateShade
  ctx.beginPath()
  ctx.moveTo(x + 86 * scale, hip + 6 * scale)
  ctx.lineTo(x + 90 * scale, ground - 8 * scale)
  ctx.lineTo(x + 86 * scale, ground - 8 * scale)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = gold
  ctx.beginPath()
  ctx.arc(x + 66 * scale, hip + 6 * scale, 5 * scale, 0, Math.PI * 2)
  ctx.fill()
  limb(ctx, x + 40 * scale, shoulder + 30 * scale, 16 * scale, 22 * scale, 7 * scale)

  const helmY = shoulder - 52 * scale - breathe
  ctx.fillStyle = plateDark
  ctx.beginPath()
  ctx.roundRect(x - 24 * scale, helmY + 8 * scale, 52 * scale, 58 * scale, 8 * scale)
  ctx.fill()
  ctx.fillStyle = plate
  ctx.beginPath()
  ctx.roundRect(x - 22 * scale, helmY + 6 * scale, 36 * scale, 56 * scale, 8 * scale)
  ctx.fill()
  ctx.fillStyle = plateLight
  ctx.beginPath()
  ctx.roundRect(x - 20 * scale, helmY + 4 * scale, 22 * scale, 18 * scale, 6 * scale)
  ctx.fill()
  ctx.fillStyle = ink
  ctx.fillRect(x - 16 * scale, helmY + 28 * scale, 34 * scale, 5 * scale)
  ctx.fillStyle = gold
  ctx.fillRect(x - 3 * scale, helmY + 16 * scale, 4 * scale, 36 * scale)
  ctx.fillRect(x - 12 * scale, helmY + 30 * scale, 22 * scale, 3 * scale)
  for (const hole of [0, 1, 2, 3]) {
    ctx.fillStyle = ink
    ctx.beginPath()
    ctx.arc(x - 8 * scale + hole * 6 * scale, helmY + 46 * scale, 1.4 * scale, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.strokeStyle = banner
  ctx.lineWidth = 5 * scale
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(x + 8 * scale, helmY + 6 * scale)
  ctx.quadraticCurveTo(x + 28 * scale, helmY - 18 * scale + crest * 30 * scale, x + 46 * scale, helmY - 8 * scale + crest * 40 * scale)
  ctx.stroke()
  ctx.strokeStyle = bannerDeep
  ctx.lineWidth = 3 * scale
  ctx.beginPath()
  ctx.moveTo(x + 10 * scale, helmY + 4 * scale)
  ctx.quadraticCurveTo(x + 24 * scale, helmY - 8 * scale + crest * 20 * scale, x + 38 * scale, helmY + 2 * scale + crest * 24 * scale)
  ctx.stroke()

  ctx.fillStyle = leather
  ctx.fillRect(x - 8 * scale, shoulder - 4 * scale, 18 * scale, 8 * scale)
}

export function ArthurFigure({
  animate = true,
  className = 'creature-plate',
  decorative = false,
}: {
  animate?: boolean
  className?: string
  decorative?: boolean
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
      drawArthur(ctx, width, height, moving ? time : 0, moving)
      if (moving) frame = requestAnimationFrame(paint)
    }

    frame = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(frame)
  }, [animate])

  return (
    <canvas
      ref={node}
      className={className}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : '亚瑟，中世纪重甲战士'}
      aria-hidden={decorative || undefined}
    />
  )
}
