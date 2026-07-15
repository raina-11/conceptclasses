import { describe, expect, it, vi } from 'vitest'
import {
  CREDENTIAL_BATCH_CONCURRENCY,
  mapWithConcurrency,
  validateCredentialBatchTargets,
  type ConcurrentBatchResult,
} from './concurrent-batch'

type Deferred<T> = {
  promise: Promise<T>
  resolve: (value: T) => void
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((settle) => {
    resolve = settle
  })

  return { promise, resolve }
}

describe('mapWithConcurrency', () => {
  it('defaults credential batches to six concurrent operations', async () => {
    expect(CREDENTIAL_BATCH_CONCURRENCY).toBe(6)

    const items = Array.from({ length: 8 }, (_, index) => index)
    const gates = items.map(() => deferred<number>())
    const started: number[] = []
    let active = 0
    let maximumActive = 0

    const operation = vi.fn(async (_item: number, index: number) => {
      started.push(index)
      active += 1
      maximumActive = Math.max(maximumActive, active)

      try {
        return await gates[index].promise
      } finally {
        active -= 1
      }
    })

    const batch = mapWithConcurrency(items, operation)

    expect(started).toEqual([0, 1, 2, 3, 4, 5])
    expect(maximumActive).toBe(6)

    gates[0].resolve(100)
    await vi.waitFor(() => expect(started).toEqual([0, 1, 2, 3, 4, 5, 6]))

    for (const [index, gate] of gates.entries()) {
      if (index !== 0) gate.resolve(index + 100)
    }

    const results = await batch

    expect(operation).toHaveBeenCalledTimes(items.length)
    expect(maximumActive).toBe(6)
    expect(results).toEqual(
      items.map((_, index) => ({
        index,
        status: 'fulfilled',
        value: index + 100,
      })),
    )
  })

  it('preserves input order while reporting settlements in completion order', async () => {
    const gates = [deferred<string>(), deferred<string>(), deferred<string>()]
    const settlements: Array<{
      result: ConcurrentBatchResult<string>
      completed: number
      total: number
    }> = []

    const batch = mapWithConcurrency(
      ['first', 'second', 'third'],
      (_item, index) => gates[index].promise,
      3,
      (result, completed, total) => {
        settlements.push({ result, completed, total })
      },
    )

    gates[2].resolve('THIRD')
    await vi.waitFor(() => expect(settlements).toHaveLength(1))
    gates[1].resolve('SECOND')
    await vi.waitFor(() => expect(settlements).toHaveLength(2))
    gates[0].resolve('FIRST')

    await expect(batch).resolves.toEqual([
      { index: 0, status: 'fulfilled', value: 'FIRST' },
      { index: 1, status: 'fulfilled', value: 'SECOND' },
      { index: 2, status: 'fulfilled', value: 'THIRD' },
    ])
    expect(settlements.map(({ result }) => result.index)).toEqual([2, 1, 0])
    expect(settlements.map(({ completed, total }) => [completed, total])).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ])
  })

  it('captures individual failures and continues processing later items', async () => {
    const visited: number[] = []

    const results = await mapWithConcurrency(
      [0, 1, 2, 3, 4],
      async (item) => {
        visited.push(item)
        if (item === 1 || item === 3) throw new Error(`failed-${item}`)
        return item * 10
      },
      2,
    )

    expect(visited).toEqual(expect.arrayContaining([0, 1, 2, 3, 4]))
    expect(visited).toHaveLength(5)
    expect(results[0]).toEqual({ index: 0, status: 'fulfilled', value: 0 })
    expect(results[1]).toEqual({
      index: 1,
      status: 'rejected',
      reason: expect.objectContaining({ message: 'failed-1' }),
    })
    expect(results[2]).toEqual({ index: 2, status: 'fulfilled', value: 20 })
    expect(results[3]).toEqual({
      index: 3,
      status: 'rejected',
      reason: expect.objectContaining({ message: 'failed-3' }),
    })
    expect(results[4]).toEqual({ index: 4, status: 'fulfilled', value: 40 })
  })

  it('handles an empty batch without invoking the operation or callback', async () => {
    const operation = vi.fn()
    const onSettled = vi.fn()

    await expect(
      mapWithConcurrency([], operation, CREDENTIAL_BATCH_CONCURRENCY, onSettled),
    ).resolves.toEqual([])
    expect(operation).not.toHaveBeenCalled()
    expect(onSettled).not.toHaveBeenCalled()
  })

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid concurrency %s before starting work',
    async (concurrency) => {
      const operation = vi.fn()

      await expect(mapWithConcurrency([1], operation, concurrency)).rejects.toThrow(
        'Concurrency must be a positive integer.',
      )
      expect(operation).not.toHaveBeenCalled()
    },
  )
})

describe('validateCredentialBatchTargets', () => {
  it('accepts distinct students with distinct existing logins', () => {
    expect(validateCredentialBatchTargets([
      { studentId: 'student-1', loginId: null },
      { studentId: 'student-2', loginId: '0012' },
      { studentId: 'student-3', loginId: '0013' },
    ])).toBeNull()
  })

  it('rejects a duplicate student before credential work starts', () => {
    expect(validateCredentialBatchTargets([
      { studentId: 'student-1', loginId: null },
      { studentId: 'student-1', loginId: null },
    ])).toMatch(/duplicate student/i)
  })

  it('rejects different students that share one existing login', () => {
    expect(validateCredentialBatchTargets([
      { studentId: 'student-1', loginId: 'Student-0012' },
      { studentId: 'student-2', loginId: ' student-0012 ' },
    ])).toMatch(/duplicate login/i)
  })
})
