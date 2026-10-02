import type { ProjectSummary } from '../domain/project'
import { ProjectCard } from './project-card'
import styles from './project-grid.module.css'

const CARD_SIZES = '(min-width: 1280px) 30vw, (min-width: 768px) 50vw, 100vw'

/** Results grid; the first card is the largest paint on phones and loads first. */
export function ProjectGrid({
  projects,
  hrefOf,
}: {
  readonly projects: readonly ProjectSummary[]
  /** Where each card leads; the project page by default. */
  readonly hrefOf?: (project: ProjectSummary) => string
}) {
  return (
    <ul className={styles.grid}>
      {projects.map((project, index) => (
        <li key={project.id}>
          <ProjectCard
            project={project}
            sizes={CARD_SIZES}
            priority={index === 0}
            headingLevel="h2"
            {...(hrefOf === undefined ? {} : { href: hrefOf(project) })}
          />
        </li>
      ))}
    </ul>
  )
}
