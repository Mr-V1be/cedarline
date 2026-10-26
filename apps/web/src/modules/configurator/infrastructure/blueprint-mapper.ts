import type { ProjectBlueprint } from '@cedarline/configurator'

import type { Project } from '@/cms/generated/payload-types'
import {
  relationId,
  toHouseDesign,
  toHouseOptions,
} from '@/modules/catalog/infrastructure/project-design-mapper'

export type BlueprintSource = Pick<Project, 'slug' | 'design' | 'defaults'> & {
  readonly configurator?: Project['configurator']
}

/** CMS project → what the configurator may vary in it. */
export function toBlueprint(
  document: BlueprintSource,
  roomKeyOf: (id: number) => string,
): ProjectBlueprint {
  return {
    slug: document.slug,
    design: toHouseDesign(document.design, roomKeyOf),
    defaults: {
      options: toHouseOptions(document.defaults),
      engineering: document.defaults.engineering ?? [],
    },
    sizes: (document.configurator?.sizes ?? []).map((size) => ({
      width: size.width,
      depth: size.depth,
    })),
    mirrorable: document.configurator?.mirrorable ?? true,
  }
}

/** Id of the main project of the series the document belongs to. */
export const seriesRootOf = (document: Pick<Project, 'id' | 'configurator'>): number => {
  const variantOf = document.configurator?.variantOf
  return variantOf === null || variantOf === undefined ? document.id : relationId(variantOf)
}
