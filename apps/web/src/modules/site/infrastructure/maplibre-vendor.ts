import 'server-only'

import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { MaplibreFile } from '@/ui/components/map/vendor'

// Read from the app's dependencies at build time (the route is static); resolving the module
// through the bundler would compile the library into the server build instead.
const distDirectory = () => path.join(process.cwd(), 'node_modules', 'maplibre-gl', 'dist')

export const readMaplibreFile = (file: MaplibreFile): Promise<Buffer> =>
  readFile(path.join(distDirectory(), file))
