type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

type DigestableResult = {
  parserVersion: string
  assessment: object
  subjects?: object[]
  rows: object[]
}

function toJsonValue(value: unknown): JsonValue {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }
  if (Array.isArray(value)) return value.map(toJsonValue)
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, toJsonValue(entry)]),
    )
  }
  return String(value)
}

function withoutSourceCoordinates(
  value: object,
): Record<string, unknown> {
  const { sourceRow: _sourceRow, sourceColumn: _sourceColumn, ...semantic } = value as Record<
    string,
    unknown
  >
  return semantic
}

function stableText(value: unknown): string {
  return JSON.stringify(toJsonValue(value))
}

function normalizedPayload(result: DigestableResult) {
  const subjects = (result.subjects ?? [])
    .map(withoutSourceCoordinates)
    .sort((left, right) => stableText(left).localeCompare(stableText(right)))
  const rows = result.rows
    .map(withoutSourceCoordinates)
    .sort((left, right) => stableText(left).localeCompare(stableText(right)))

  return {
    parserVersion: result.parserVersion,
    assessment: result.assessment,
    subjects,
    rows,
  }
}

export async function normalizedResultDigest(
  result: DigestableResult,
): Promise<string> {
  const bytes = new TextEncoder().encode(stableText(normalizedPayload(result)))
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('')
}
