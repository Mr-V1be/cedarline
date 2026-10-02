import { isFacadeFinish, isRoofKindKey, isWindowStyle } from '@kedrovnik/house'

import type { Configuration } from './configuration'
import { ConfiguratorError } from './errors'

const HEX_COLOUR = /^#[0-9a-f]{6}$/
const KEY = /^[a-z0-9][a-z0-9-]{0,63}$/
/** Bounds that keep untrusted numbers sane before the offer is consulted, mm. */
const MAX_LENGTH = 100_000
const MAX_SYSTEMS = 32

type Fields = Readonly<Record<string, unknown>>

const fail = (field: string): never => {
  throw new ConfiguratorError('INVALID_CONFIGURATION', `Invalid configuration field "${field}"`, {
    field,
  })
}

const isRecord = (value: unknown): value is Fields =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function key(fields: Fields, field: string): string {
  const value = fields[field]
  return typeof value === 'string' && KEY.test(value) ? value : fail(field)
}

function length(value: unknown, field: string, allowZero = false): number {
  const valid =
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value <= MAX_LENGTH &&
    (allowZero ? value >= 0 : value > 0)
  return valid ? value : fail(field)
}

/**
 * Reads a configuration from untrusted input (a request body, a stored record). Checks shape and
 * formats only; whether the values are offered and compatible is the configurator's business.
 */
export function parseConfiguration(input: unknown): Configuration {
  if (!isRecord(input)) return fail('configuration')
  const footprint = isRecord(input.footprint) ? input.footprint : fail('footprint')
  const roof = key(input, 'roof')
  const facade = key(input, 'facade')
  const windows = key(input, 'windows')
  const colour = typeof input.colour === 'string' ? input.colour.toLowerCase() : fail('colour')
  const engineering = Array.isArray(input.engineering) ? input.engineering : fail('engineering')
  if (engineering.length > MAX_SYSTEMS) fail('engineering')
  if (typeof input.mirrored !== 'boolean') fail('mirrored')

  return {
    project: key(input, 'project'),
    footprint: {
      width: length(footprint.width, 'footprint.width'),
      depth: length(footprint.depth, 'footprint.depth'),
    },
    mirrored: input.mirrored === true,
    roof: isRoofKindKey(roof) ? roof : fail('roof'),
    facade: isFacadeFinish(facade) ? facade : fail('facade'),
    colour: HEX_COLOUR.test(colour) ? colour : fail('colour'),
    windows: isWindowStyle(windows) ? windows : fail('windows'),
    terrace: length(input.terrace, 'terrace', true),
    insulation: length(input.insulation, 'insulation'),
    engineering: [
      ...new Set(
        engineering.map((value) =>
          typeof value === 'string' && KEY.test(value) ? value : fail('engineering'),
        ),
      ),
    ],
    completeness: key(input, 'completeness'),
  }
}
