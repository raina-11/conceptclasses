import { HttpError } from './handler.ts'

type ErrorLike = {
  code?: string
}

export function databaseError(
  error: ErrorLike,
  operation: 'confirm' | 'claim' | 'complete' | 'commit',
): HttpError {
  if (error.code === '42501' && operation === 'confirm') {
    return new HttpError(403, 'forbidden', 'You cannot process this import.')
  }
  if (error.code === 'P0002' || error.code === '55000') {
    return new HttpError(409, 'import_conflict', 'The import is not ready for this operation.')
  }
  if (
    operation === 'commit' &&
    (error.code === '22003' ||
      error.code === '23505' ||
      error.code === '23514')
  ) {
    return new HttpError(
      409,
      'staging_conflict',
      'The parsed workbook conflicts with existing portal data.',
    )
  }

  return new HttpError(
    502,
    'database_unavailable',
    'The import service is temporarily unavailable.',
  )
}
