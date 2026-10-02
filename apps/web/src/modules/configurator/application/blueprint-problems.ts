import {
  Configurator,
  blueprintIssues,
  type BlueprintIssue,
  type ConfiguratorOffer,
  type HouseContext,
  type ProjectBlueprint,
} from '@kedrovnik/configurator'
import type { TariffGrid } from '@kedrovnik/pricing'

export interface BlueprintProblem {
  readonly slug: string
  readonly issues: readonly BlueprintIssue[]
}

/**
 * Projects that would open in an impossible state or offer a footprint that cannot be built
 * with the given offer. The CMS refuses saves that would create such projects.
 */
export function blueprintProblems(
  blueprints: readonly ProjectBlueprint[],
  offer: ConfiguratorOffer,
  house: HouseContext,
  grid: TariffGrid,
): readonly BlueprintProblem[] {
  return blueprints.flatMap((blueprint) => {
    const configurator = new Configurator({ family: [blueprint], offer, house, grid })
    const issues = blueprintIssues(configurator, blueprint)
    return issues.length === 0 ? [] : [{ slug: blueprint.slug, issues }]
  })
}

/** A short, editor-facing description of a problem: the footprint and the reasons. */
export function describeProblem(problem: BlueprintProblem): string {
  const issue = problem.issues[0]
  if (issue === undefined) return problem.slug
  const { footprint, mirrored } = issue.configuration
  const reasons = issue.restrictions
    .map((restriction) => {
      switch (restriction.kind) {
        case 'rule':
          return `правило «${restriction.rule}»`
        case 'requires':
          return `система «${restriction.system}» требует «${restriction.missing.join(', ')}»`
        case 'attic-roof':
          return `кровля «${restriction.roof}» не перекрывает мансарду`
        case 'geometry':
          return `геометрия: ${restriction.code}`
      }
    })
    .join('; ')
  return `${problem.slug} ${footprint.width}×${footprint.depth}${mirrored ? ' (зеркально)' : ''}: ${reasons}`
}
