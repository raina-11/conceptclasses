import { createProductionDependencies } from './dependencies.ts'
import { createParseResultHandler } from './handler.ts'

const handler = createParseResultHandler(createProductionDependencies())

Deno.serve(handler)
