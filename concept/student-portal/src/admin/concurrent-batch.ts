export const CREDENTIAL_BATCH_CONCURRENCY = 6

export type ConcurrentBatchFulfilledResult<Result> = {
  index: number
  status: 'fulfilled'
  value: Result
}

export type ConcurrentBatchRejectedResult = {
  index: number
  status: 'rejected'
  reason: unknown
}

export type ConcurrentBatchResult<Result> =
  | ConcurrentBatchFulfilledResult<Result>
  | ConcurrentBatchRejectedResult

export type ConcurrentBatchOperation<Item, Result> = (
  item: Item,
  index: number,
) => Result | PromiseLike<Result>

export type ConcurrentBatchSettledCallback<Result> = (
  result: ConcurrentBatchResult<Result>,
  completed: number,
  total: number,
) => void

export type CredentialBatchTarget = {
  studentId: string
  loginId: string | null
}

export function validateCredentialBatchTargets(
  targets: readonly CredentialBatchTarget[],
): string | null {
  const studentIds = new Set<string>()
  const loginIds = new Set<string>()

  for (const target of targets) {
    if (studentIds.has(target.studentId)) {
      return 'A duplicate student was found. No credentials were changed.'
    }
    studentIds.add(target.studentId)

    if (!target.loginId) continue
    const normalizedLoginId = target.loginId.trim().toLowerCase()
    if (loginIds.has(normalizedLoginId)) {
      return 'A duplicate login was found. No credentials were changed.'
    }
    loginIds.add(normalizedLoginId)
  }

  return null
}

export async function mapWithConcurrency<Item, Result>(
  items: readonly Item[],
  operation: ConcurrentBatchOperation<Item, Result>,
  concurrency = CREDENTIAL_BATCH_CONCURRENCY,
  onSettled?: ConcurrentBatchSettledCallback<Result>,
): Promise<ConcurrentBatchResult<Result>[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error('Concurrency must be a positive integer.')
  }

  const results = Array.from<ConcurrentBatchResult<Result>>({
    length: items.length,
  })
  let nextIndex = 0
  let completed = 0

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1

      let result: ConcurrentBatchResult<Result>

      try {
        result = {
          index,
          status: 'fulfilled',
          value: await operation(items[index], index),
        }
      } catch (reason) {
        result = { index, status: 'rejected', reason }
      }

      results[index] = result
      completed += 1
      onSettled?.(result, completed, items.length)
    }
  }

  const workerCount = Math.min(concurrency, items.length)
  await Promise.all(Array.from({ length: workerCount }, () => worker()))

  return results
}
