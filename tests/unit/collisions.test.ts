import { describe, expect, it } from 'vitest'
import { resolveCollisions, SETTLE_PX } from '@/app/lib/collisions'
import { getTaskDiameter } from '@/app/lib/task'
import { Task } from '@/app/types'

const CONFIG = { containerWidth: 1200, containerHeight: 800, padding: 20 }
const NOW = Date.parse('2026-10-24T12:00:00Z')

const task = (
  id: string,
  pos_x: number,
  pos_y: number,
  extra: Partial<Task> = {}
): Task => ({
  id,
  title: id,
  createdAt: new Date(NOW).toISOString(),
  pos_x,
  pos_y,
  categoryId: '',
  workspaceId: 'w',
  recurrence: 'never',
  priority: 0,
  ...extra,
})

// Runs resolution like the hook does, until nothing moves.
function settle(tasks: Task[], now = NOW, maxRounds = 200) {
  let current = tasks
  for (let round = 0; round < maxRounds; round++) {
    const next = resolveCollisions(current, CONFIG, now)
    if (!next) return { tasks: current, rounds: round }
    current = next
  }
  return { tasks: current, rounds: Infinity }
}

const px = (t: Task) => ({
  x: (t.pos_x / 100) * CONFIG.containerWidth,
  y: (t.pos_y / 100) * CONFIG.containerHeight,
})

describe('resolveCollisions', () => {
  it('does nothing before the container is measured', () => {
    expect(
      resolveCollisions([task('a', 50, 50)], { ...CONFIG, containerWidth: 0 })
    ).toBeNull()
  })

  it('returns null when circles already have room', () => {
    expect(
      resolveCollisions([task('a', 20, 50), task('b', 80, 50)], CONFIG, NOW)
    ).toBeNull()
  })

  it('separates circles stacked on the same spot', () => {
    const { tasks, rounds } = settle([task('a', 50, 50), task('b', 50, 50)])
    expect(rounds).toBeLessThan(Infinity)
    const [a, b] = tasks.map(px)
    const minGap = getTaskDiameter(tasks[0], NOW) + 20
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(
      minGap - SETTLE_PX - 1e-9
    )
  })

  it('keeps circles inside the container', () => {
    const { tasks } = settle([task('edge', 0, 100)])
    const r = getTaskDiameter(tasks[0], NOW) / 2
    const { x, y } = px(tasks[0])
    expect(x).toBeGreaterThanOrEqual(r + CONFIG.padding - SETTLE_PX)
    expect(y).toBeLessThanOrEqual(
      CONFIG.containerHeight - r - CONFIG.padding + SETTLE_PX
    )
  })

  it('does not mutate its input', () => {
    const input = [task('a', 50, 50), task('b', 50, 50)]
    const snapshot = JSON.stringify(input)
    resolveCollisions(input, CONFIG, NOW)
    expect(JSON.stringify(input)).toBe(snapshot)
  })

  // Regression: circles grow every millisecond, so touching circles used to be nudged
  // ~30 times a second forever, and their positions were never saved.
  it('stays settled while touching circles keep growing', () => {
    const { tasks } = settle([task('a', 50, 50), task('b', 50, 50)])
    let movesWhileGrowing = 0
    for (let ms = 32; ms <= 60_000; ms += 32) {
      if (resolveCollisions(tasks, CONFIG, NOW + ms)) movesWhileGrowing++
    }
    expect(movesWhileGrowing).toBe(0)
  })
})
