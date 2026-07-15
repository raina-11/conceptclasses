import { createProductionDependencies } from './dependencies.ts'
import { createStudentAccountHandler } from './handler.ts'

const handler = createStudentAccountHandler(createProductionDependencies())

Deno.serve(handler)
