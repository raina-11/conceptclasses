import { describe, expect, it, vi } from 'vitest'
import { getOrCreateHotClient } from './hot-client'

describe('hot-reload client cache', () => {
  it('reuses one client while the Vite hot-data object survives module updates', () => {
    const hotData: Record<string, unknown> = {}
    const createClient = vi.fn(() => ({ id: crypto.randomUUID() }))

    const first = getOrCreateHotClient(hotData, 'local-supabase', createClient)
    const second = getOrCreateHotClient(hotData, 'local-supabase', createClient)

    expect(second).toBe(first)
    expect(createClient).toHaveBeenCalledOnce()
  })

  it('creates a replacement when the public Supabase configuration changes', () => {
    const hotData: Record<string, unknown> = {}
    const createClient = vi.fn(() => ({ id: crypto.randomUUID() }))

    const first = getOrCreateHotClient(hotData, 'first-project', createClient)
    const second = getOrCreateHotClient(hotData, 'second-project', createClient)

    expect(second).not.toBe(first)
    expect(createClient).toHaveBeenCalledTimes(2)
  })
})
