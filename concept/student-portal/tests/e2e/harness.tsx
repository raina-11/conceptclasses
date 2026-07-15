import { createRoot } from 'react-dom/client'
import { App } from '../../src/App'
import '../../src/styles.css'
import { createSyntheticRepository, type HarnessState } from './synthetic-repository'

const allowedStates = new Set<HarnessState>([
  'guest',
  'student',
  'admin',
])
const requestedState = new URLSearchParams(window.location.search).get('state')
const state = allowedStates.has(requestedState as HarnessState)
  ? (requestedState as HarnessState)
  : 'guest'
const root = document.getElementById('root')

if (!root) throw new Error('E2E harness root was not found')

window.__PORTAL_E2E_EVENTS__ = []

createRoot(root).render(
  <App
    repository={createSyntheticRepository(state)}
  />,
)
