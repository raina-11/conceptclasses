const HOT_CLIENT_KEY = 'concept-qpt:supabase-client'

type HotClientEntry<T> = {
  configuration: string
  client: T
}

/**
 * Vite preserves import.meta.hot.data across module replacements. Keeping the
 * browser SDK client there prevents duplicate Auth clients from competing for
 * the same persisted-session lock during development.
 */
export function getOrCreateHotClient<T>(
  hotData: Record<string, unknown> | undefined,
  configuration: string,
  createClient: () => T,
): T {
  if (!hotData) return createClient()

  const existing = hotData[HOT_CLIENT_KEY] as HotClientEntry<T> | undefined
  if (existing?.configuration === configuration && 'client' in existing) {
    return existing.client
  }

  const client = createClient()
  hotData[HOT_CLIENT_KEY] = { configuration, client } satisfies HotClientEntry<T>
  return client
}
