import { existsSync } from 'node:fs'
import path from 'node:path'

const WORKSPACE_MARKER = 'pnpm-workspace.yaml'
const ENV_FILE = '.env'

/** Walks up from the working directory to the workspace root (the folder holding `.env`). */
function findWorkspaceRoot(start: string): string | undefined {
  let current = path.resolve(start)
  for (;;) {
    if (existsSync(path.join(current, WORKSPACE_MARKER))) return current
    const parent = path.dirname(current)
    if (parent === current) return undefined
    current = parent
  }
}

/**
 * The repository keeps one `.env` at its root for Docker Compose, the Next.js server and the
 * Payload CLI. Variables already present in the environment win, so containers and CI that
 * pass real variables are never overridden by a file.
 */
export function loadRootEnv(): void {
  const root = findWorkspaceRoot(process.cwd())
  if (root === undefined) return
  const file = path.join(root, ENV_FILE)
  if (existsSync(file)) process.loadEnvFile(file)
}
