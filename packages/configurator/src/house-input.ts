import { mirrorDesign, resizeDesign, type HouseInput, type HouseOptions } from '@cedarline/house'

import { blueprintOf } from './choices'
import type { Configuration } from './configuration'
import { footprintOf, sameFootprint } from './footprint'
import type { ConfiguratorModel } from './model'

/**
 * The house a configuration describes: the project's design resized and mirrored as chosen,
 * with the chosen options. The project's own roof pitch is kept while its roof kind is chosen;
 * another kind gets the factory default pitch of that kind.
 */
export function houseInputOf(model: ConfiguratorModel, configuration: Configuration): HouseInput {
  const blueprint = blueprintOf(model, configuration.project)
  const defaults = blueprint.defaults.options
  const resized = sameFootprint(configuration.footprint, footprintOf(blueprint.design))
    ? blueprint.design
    : resizeDesign(blueprint.design, configuration.footprint.width, configuration.footprint.depth)
  const design = configuration.mirrored ? mirrorDesign(resized) : resized

  const options: HouseOptions = {
    roofKind: configuration.roof,
    ...(configuration.roof === defaults.roofKind && defaults.roofPitch !== undefined
      ? { roofPitch: defaults.roofPitch }
      : {}),
    facadeFinish: configuration.facade,
    facadeColor: configuration.colour,
    windowStyle: configuration.windows,
    insulation: configuration.insulation,
    ...(design.terrace === null
      ? {}
      : { terraceDepth: configuration.terrace === 0 ? null : configuration.terrace }),
  }
  return { design, options, rooms: model.house.rooms, standards: model.house.standards }
}
