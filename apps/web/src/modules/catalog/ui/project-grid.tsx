import type { ProjectSummary } from '../domain/project'
import { ProjectCard } from './project-card'
import styles from './project-grid.module.css'

const CARD_SIZES = '(min-width: 1280px) 30vw, (min-width: 768px) 50vw, 100vw'

/** Results grid; when it leads the page, its first card is the largest paint on phones. */
export function ProjectGrid({
  projects,
  hrefOf,
  leading = true,
}: {
  readonly projects: readonly ProjectSummary[]
  /** Where each card leads; the project page by default. */
  readonly hrefOf?: (project: ProjectSummary) => string
  /** False for a grid further down a page: nothing in it should compete with the top. */
  readonly leading?: boolean
}) {
  return (
    <ul className={styles.grid}>
      {projects.map((project, index) => (
        <li key={project.id}>
          <ProjectCard
            project={project}
            sizes={CARD_SIZES}
            priority={leading && index === 0}
            headingLevel="h2"
            {...(hrefOf === undefined ? {} : { href: hrefOf(project) })}
          />
        </li>
      ))}
    </ul>
  )
}
