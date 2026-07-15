const UPPERCASE = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijkmnopqrstuvwxyz'
const DIGITS = '23456789'
const SYMBOLS = '!@#$%*+?=_-'
const ALL_CHARACTERS = `${UPPERCASE}${LOWERCASE}${DIGITS}${SYMBOLS}`

export const MINIMUM_PASSWORD_LENGTH = 10
export const MAXIMUM_PASSWORD_LENGTH = 128
export const TEMPORARY_PASSWORD_LENGTH = 18

export type RandomIndex = (maximumExclusive: number) => number

function secureRandomIndex(maximumExclusive: number): number {
  if (!Number.isSafeInteger(maximumExclusive) || maximumExclusive < 1 || maximumExclusive > 256) {
    throw new Error('The random index range is invalid.')
  }

  const upperBound = 256 - (256 % maximumExclusive)
  const byte = new Uint8Array(1)
  do {
    crypto.getRandomValues(byte)
  } while (byte[0] >= upperBound)
  return byte[0] % maximumExclusive
}

function randomCharacter(characters: string, randomIndex: RandomIndex): string {
  const index = randomIndex(characters.length)
  if (!Number.isSafeInteger(index) || index < 0 || index >= characters.length) {
    throw new Error('The random source returned an invalid index.')
  }
  return characters[index]
}

export function generateTemporaryPassword(
  length = TEMPORARY_PASSWORD_LENGTH,
  randomIndex: RandomIndex = secureRandomIndex,
): string {
  if (!Number.isSafeInteger(length) || length < 14 || length > 64) {
    throw new Error('Temporary passwords must contain between 14 and 64 characters.')
  }

  const characters = [
    randomCharacter(UPPERCASE, randomIndex),
    randomCharacter(LOWERCASE, randomIndex),
    randomCharacter(DIGITS, randomIndex),
    randomCharacter(SYMBOLS, randomIndex),
  ]
  while (characters.length < length) {
    characters.push(randomCharacter(ALL_CHARACTERS, randomIndex))
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1)
    if (!Number.isSafeInteger(swapIndex) || swapIndex < 0 || swapIndex > index) {
      throw new Error('The random source returned an invalid shuffle index.')
    }
    ;[characters[index], characters[swapIndex]] = [
      characters[swapIndex],
      characters[index],
    ]
  }
  return characters.join('')
}

export function passwordPolicyError(password: string): string | null {
  if (
    password.length < MINIMUM_PASSWORD_LENGTH ||
    password.length > MAXIMUM_PASSWORD_LENGTH
  ) {
    return `Use between ${MINIMUM_PASSWORD_LENGTH} and ${MAXIMUM_PASSWORD_LENGTH} characters.`
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Include an uppercase letter, a lowercase letter, and a number.'
  }
  return null
}
