import Phaser from 'phaser'
import { useEffect, useRef } from 'react'
import { grasslandTheme } from '../shared/content'

const width = 960
const height = 540

function paint(hex: string) {
  return Number.parseInt(hex.slice(1), 16)
}

function roll(seed: number) {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let value = Math.imul(state ^ (state >>> 15), 1 | state)
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

type Point = { x: number; y: number }

type Blade = {
  x: number
  y: number
  height: number
  lean: number
  thick: number
  color: number
  tip: number
}

type Tuft = {
  x: number
  y: number
  blades: Blade[]
}

type Tree = {
  x: number
  y: number
  scale: number
  shade: number
}

type Flower = {
  x: number
  y: number
  stem: number
  petal: number
}

function smoothRoad(points: Point[]) {
  const curve: Point[] = []
  const steps = 8
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)]
    const p1 = points[index]
    const p2 = points[index + 1]
    const p3 = points[Math.min(points.length - 1, index + 2)]
    for (let step = 0; step < steps; step += 1) {
      const t = step / steps
      const t2 = t * t
      const t3 = t2 * t
      curve.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      })
    }
  }
  curve.push(points[points.length - 1])
  return curve
}

function distanceToSegment(px: number, py: number, a: Point, b: Point) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length = dx * dx + dy * dy || 1
  const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / length))
  return Math.hypot(px - (a.x + dx * t), py - (a.y + dy * t))
}

function distanceToPath(px: number, py: number, points: Point[]) {
  let best = Infinity
  for (let index = 1; index < points.length; index += 1) {
    best = Math.min(best, distanceToSegment(px, py, points[index - 1], points[index]))
  }
  return best
}

function ribbon(points: Point[], widthAt: (point: Point, index: number) => number) {
  const left: Point[] = []
  const right: Point[] = []
  for (let index = 0; index < points.length; index += 1) {
    const previous = points[Math.max(0, index - 1)]
    const next = points[Math.min(points.length - 1, index + 1)]
    const dx = next.x - previous.x
    const dy = next.y - previous.y
    const length = Math.hypot(dx, dy) || 1
    const half = widthAt(points[index], index) / 2
    const nx = -dy / length
    const ny = dx / length
    left.push({ x: points[index].x + nx * half, y: points[index].y + ny * half })
    right.push({ x: points[index].x - nx * half, y: points[index].y - ny * half })
  }
  return [...left, ...right.reverse()]
}

function fillShape(board: Phaser.GameObjects.Graphics, points: Point[], color: number, alpha = 1) {
  board.fillStyle(color, alpha)
  board.beginPath()
  board.moveTo(points[0].x, points[0].y)
  for (const point of points.slice(1)) board.lineTo(point.x, point.y)
  board.closePath()
  board.fillPath()
}

function breeze(x: number, y: number, time: number) {
  const travel = Math.sin(time * 0.00115 - x * 0.011)
  const rustle = Math.sin(time * 0.0023 - x * 0.021 + y * 0.008)
  const depth = 0.35 + (y / height) * 0.9
  return (travel * 0.72 + rustle * 0.28) * depth
}

function strokeBlade(board: Phaser.GameObjects.Graphics, blade: Blade, bend: number) {
  const sway = bend * blade.height
  const baseX = blade.x
  const baseY = blade.y
  const midX = baseX + sway * 0.18 + Math.sin(blade.lean) * blade.height * 0.08
  const midY = baseY - blade.height * 0.46
  const tipX = baseX + sway + Math.sin(blade.lean) * blade.height * 0.16
  const tipY = baseY - blade.height
  board.lineStyle(blade.thick, blade.color, 1)
  board.beginPath()
  board.moveTo(baseX, baseY)
  board.lineTo(midX, midY)
  board.strokePath()
  board.lineStyle(Math.max(1, blade.thick - 0.7), blade.tip, 1)
  board.beginPath()
  board.moveTo(midX, midY)
  board.lineTo(tipX, tipY)
  board.strokePath()
}

function makePlate(routes?: Point[][]) {
  const palette = Object.fromEntries(grasslandTheme.palette.map((entry) => [entry.name, paint(entry.hex)]))
  const meadow = palette['草原']
  const young = palette['嫩草']
  const deep = palette['深草']
  const dirt = palette['土径']
  const mud = palette['泥辙']
  const petal = palette['野花']
  const canopy = 0x244a2c
  const stone = 0xd9d2c5
  const wood = 0x6b4e32
  const worn = 0xe4c98a
  const random = roll(27)

  const sampleRoad = [
    { x: -50, y: 318 },
    { x: 70, y: 332 },
    { x: 180, y: 308 },
    { x: 290, y: 336 },
    { x: 410, y: 300 },
    { x: 530, y: 328 },
    { x: 650, y: 296 },
    { x: 770, y: 322 },
    { x: 880, y: 304 },
    { x: 1020, y: 318 },
  ]
  const decorative = !routes || routes.every((route) => route.length < 2)
  const roads = (decorative ? [sampleRoad] : routes).flatMap((route) => (route.length >= 2 ? [smoothRoad(route)] : []))

  const trees: Tree[] = []
  for (let x = -30; x < width + 40; x += 28 + Math.floor(random() * 18)) {
    trees.push({
      x,
      y: 108 + random() * 28,
      scale: 0.72 + random() * 0.7,
      shade: random(),
    })
  }

  const carpet: Blade[] = []
  for (let index = 0; index < 420; index += 1) {
    const x = random() * width
    const y = 150 + random() * 380
    if (roads.some((road) => distanceToPath(x, y, road) < 20)) continue
    const foreground = y / height
    carpet.push({
      x,
      y,
      height: 5 + foreground * 8 + random() * 4,
      lean: random() * 0.6 - 0.3,
      thick: 1.2,
      color: random() > 0.45 ? deep : meadow,
      tip: random() > 0.5 ? young : meadow,
    })
  }

  const tufts: Tuft[] = []
  for (let index = 0; index < 78; index += 1) {
    const x = random() * width
    const y = 168 + random() * 350
    if (roads.some((road) => distanceToPath(x, y, road) < 16)) continue
    const foreground = y / height
    const blades: Blade[] = []
    const count = 5 + Math.floor(random() * 3)
    for (let blade = 0; blade < count; blade += 1) {
      blades.push({
        x: x + (blade - count / 2) * (2.1 + foreground * 1.4),
        y: y + random() * 3,
        height: 11 + foreground * 20 + random() * 8,
        lean: (blade - count / 2) * 0.12,
        thick: 1.4 + foreground * 0.8,
        color: blade % 2 === 0 ? deep : meadow,
        tip: young,
      })
    }
    tufts.push({ x, y, blades })
  }

  const flowers: Flower[] = []
  for (let index = 0; index < 14; index += 1) {
    const x = 40 + random() * (width - 80)
    const y = 190 + random() * 300
    if (roads.some((road) => distanceToPath(x, y, road) < 26)) continue
    flowers.push({ x, y, stem: 14 + random() * 10, petal: 2 + random() * 1.3 })
  }

  const shrubs = [
    { x: 132, y: 236, scale: 1 },
    { x: 404, y: 214, scale: 0.85 },
    { x: 838, y: 228, scale: 1.05 },
    { x: 246, y: 456, scale: 1.15 },
    { x: 688, y: 468, scale: 1 },
  ]

  const stones = [
    { x: 228, y: 214, w: 20, h: 11 },
    { x: 602, y: 230, w: 14, h: 8 },
    { x: 486, y: 452, w: 18, h: 10 },
    { x: 126, y: 410, w: 12, h: 7 },
  ]

  const posts: Point[] = []
  if (decorative) {
    let walked = 0
    const road = roads[0] ?? []
    for (let index = 1; index < road.length; index += 1) {
      walked += Math.hypot(road[index].x - road[index - 1].x, road[index].y - road[index - 1].y)
      if (walked > 150) {
        posts.push(road[index])
        walked = 0
      }
    }
  }
  const pebbles: Point[] = []
  for (const road of roads) {
    if (road.length < 3) continue
    for (let index = 0; index < 8; index += 1) {
      const along = road[1 + Math.floor(random() * (road.length - 2))]
      pebbles.push({ x: along.x + random() * 16 - 8, y: along.y + random() * 8 - 4 })
    }
  }

  return { meadow, young, deep, dirt, mud, petal, canopy, stone, wood, worn, roads, trees, carpet, tufts, flowers, shrubs, stones, pebbles, posts }
}

type Plate = ReturnType<typeof makePlate>

function drawTree(board: Phaser.GameObjects.Graphics, tree: Tree, plate: Plate) {
  const { x, y, scale } = tree
  board.fillStyle(plate.wood, 1)
  board.fillRect(x - 2 * scale, y - 4 * scale, 4 * scale, 16 * scale)
  board.fillStyle(tree.shade > 0.55 ? plate.canopy : plate.deep, 1)
  board.fillEllipse(x, y - 16 * scale, 34 * scale, 26 * scale)
  board.fillEllipse(x - 12 * scale, y - 10 * scale, 22 * scale, 18 * scale)
  board.fillEllipse(x + 12 * scale, y - 12 * scale, 20 * scale, 16 * scale)
  board.fillStyle(plate.meadow, 0.9)
  board.fillEllipse(x - 4 * scale, y - 22 * scale, 16 * scale, 12 * scale)
  board.fillStyle(plate.young, 0.75)
  board.fillEllipse(x + 6 * scale, y - 18 * scale, 10 * scale, 8 * scale)
}

function drawPlate(board: Phaser.GameObjects.Graphics, plate: Plate, time: number) {
  board.clear()
  board.fillStyle(plate.meadow, 1)
  board.fillRect(0, 0, width, height)

  board.fillStyle(plate.deep, 0.35)
  board.fillEllipse(180, 210, 280, 70)
  board.fillEllipse(700, 190, 320, 80)
  board.fillEllipse(460, 470, 360, 90)

  board.fillStyle(plate.deep, 1)
  board.fillEllipse(width / 2, 168, width + 120, 150)
  for (const tree of plate.trees) drawTree(board, tree, plate)
  board.fillStyle(plate.meadow, 1)
  board.fillEllipse(width / 2, 210, width + 40, 90)

  for (const road of plate.roads) {
    fillShape(
      board,
      ribbon(road, (point, index) => 54 + Math.sin(index * 1.4) * 6 + point.y * 0.02),
      plate.mud,
    )
    fillShape(
      board,
      ribbon(road, (point, index) => 30 + Math.sin(index * 1.9) * 3 + point.y * 0.012),
      plate.dirt,
    )
    fillShape(
      board,
      ribbon(road, (_point, index) => 8 + Math.sin(index) * 2),
      plate.worn,
    )
  }

  board.fillStyle(plate.stone, 0.85)
  for (const pebble of plate.pebbles) board.fillEllipse(pebble.x, pebble.y, 5, 3)

  for (const rock of plate.stones) {
    board.fillStyle(plate.deep, 0.22)
    board.fillEllipse(rock.x + 3, rock.y + 3, rock.w, rock.h)
    board.fillStyle(plate.stone, 1)
    board.fillEllipse(rock.x, rock.y, rock.w, rock.h)
    board.fillStyle(0xf4efe4, 0.7)
    board.fillEllipse(rock.x - rock.w * 0.15, rock.y - 1, rock.w * 0.35, rock.h * 0.35)
  }

  for (const shrub of plate.shrubs) {
    const bend = breeze(shrub.x, shrub.y, time) * 3
    const { x, y, scale } = shrub
    board.fillStyle(plate.deep, 0.2)
    board.fillEllipse(x + 4, y + 8, 40 * scale, 12 * scale)
    board.fillStyle(plate.deep, 1)
    board.fillEllipse(x + bend, y, 42 * scale, 24 * scale)
    board.fillStyle(plate.meadow, 1)
    board.fillEllipse(x - 10 * scale + bend * 1.1, y - 8 * scale, 24 * scale, 16 * scale)
    board.fillStyle(plate.young, 0.9)
    board.fillEllipse(x + 8 * scale + bend * 1.3, y - 6 * scale, 16 * scale, 12 * scale)
  }

  for (const blade of plate.carpet) {
    strokeBlade(board, blade, breeze(blade.x, blade.y, time) * 0.55)
  }
  for (const tuft of plate.tufts) {
    const bend = breeze(tuft.x, tuft.y, time)
    for (const blade of tuft.blades) strokeBlade(board, blade, bend)
  }

  for (const flower of plate.flowers) {
    const bend = breeze(flower.x, flower.y, time)
    const tipX = flower.x + bend * flower.stem * 0.65
    const tipY = flower.y - flower.stem
    board.lineStyle(1.4, plate.deep, 1)
    board.beginPath()
    board.moveTo(flower.x, flower.y)
    board.lineTo(flower.x + bend * flower.stem * 0.25, flower.y - flower.stem * 0.5)
    board.lineTo(tipX, tipY)
    board.strokePath()
    board.fillStyle(plate.petal, 1)
    for (let petal = 0; petal < 5; petal += 1) {
      const angle = (petal / 5) * Math.PI * 2
      board.fillCircle(tipX + Math.cos(angle) * 4.2, tipY + Math.sin(angle) * 4.2, flower.petal)
    }
    board.fillStyle(0xf7e7a0, 1)
    board.fillCircle(tipX, tipY, 1.7)
  }

  for (const point of plate.posts) {
    board.fillStyle(plate.deep, 0.2)
    board.fillRect(point.x - 14, point.y + 18, 6, 14)
    board.fillStyle(plate.wood, 1)
    board.fillRect(point.x - 16, point.y + 14, 6, 15)
  }
}

export function GrasslandMap({ className = 'map-plate', routes }: { className?: string; routes?: Point[][] }) {
  const host = useRef<HTMLDivElement>(null)
  const routeKey = JSON.stringify(routes ?? null)

  useEffect(() => {
    const node = host.current
    if (!node) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const plate = makePlate(routes)

    class PlateScene extends Phaser.Scene {
      private board!: Phaser.GameObjects.Graphics

      constructor() {
        super('grassland-plate')
      }

      create() {
        this.board = this.add.graphics()
        drawPlate(this.board, plate, 0)
      }

      update(time: number) {
        if (reduce) return
        drawPlate(this.board, plate, time)
      }
    }

    const game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: node,
      width,
      height,
      backgroundColor: grasslandTheme.palette.find((entry) => entry.name === '草原')?.hex ?? '#4E8A45',
      scene: PlateScene,
      banner: false,
      audio: { noAudio: true },
      render: { antialias: true },
    })

    return () => {
      game.destroy(true)
    }
  }, [routeKey])

  return <div className={className} ref={host} />
}
