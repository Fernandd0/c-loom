import { Task } from '@/app/types'
import { PRIORITY_LEVELS } from '@/app/lib/task'
import { addDays, buildDeadline, toLocalDateValue } from '@/lib/dates'

const [, MEDIUM, HIGH] = PRIORITY_LEVELS.map((l) => l.value)

// Due at the end of the local day, `days` from now (0 = today).
const dueIn = (days: number, now: Date) =>
  buildDeadline(toLocalDateValue(addDays(now, days)))

// A brand-new guest's first galaxy starts with these instead of an empty board, so the
// idea (circles grow toward their due date; done = gone) is learned by doing it.
export function sampleTasks(
  workspaceId: string,
  categoryId: string,
  now = new Date()
): Task[] {
  const createdAt = now.toISOString()
  const task = (
    fields: Pick<Task, 'title' | 'description' | 'priority' | 'deadline'> & {
      pos_x: number
      pos_y: number
    }
  ): Task => ({
    ...fields,
    id: crypto.randomUUID(),
    createdAt,
    categoryId,
    workspaceId,
    recurrence: 'never',
  })

  return [
    task({
      title: 'Biggest one goes first',
      description:
        'Circles grow as they get older and as their due date gets closer. Higher priority starts bigger and grows faster. Whatever is biggest is what to do next.',
      priority: HIGH,
      deadline: dueIn(0, now),
      pos_x: 50,
      pos_y: 45,
    }),
    task({
      title: 'Click me to see what I am',
      description:
        'Every circle is a task. Click one to change its title, due date, priority or category. Changes save on their own.',
      priority: MEDIUM,
      pos_x: 22,
      pos_y: 35,
    }),
    task({
      title: 'Double-click me when done',
      description:
        'Finished tasks disappear: this board shows what is left, not what you did. Repeating tasks move to their next date instead.',
      priority: MEDIUM,
      deadline: dueIn(2, now),
      pos_x: 78,
      pos_y: 40,
    }),
    task({
      title: 'Add your own: press N',
      description:
        'Or use the button at the bottom. Try "Call mom tomorrow !high" and the date and priority are filled in for you.',
      priority: MEDIUM,
      pos_x: 40,
      pos_y: 72,
    }),
  ]
}
