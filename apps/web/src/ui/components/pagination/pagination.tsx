import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react/ssr'

import { Link } from '@/i18n/navigation'

import { Icon } from '../icon/icon'
import styles from './pagination.module.css'

interface PaginationProps {
  readonly page: number
  readonly pageCount: number
  readonly hrefFor: (page: number) => string
  readonly labels: {
    readonly navigation: string
    readonly previous: string
    readonly next: string
    readonly page: (page: number) => string
  }
}

/** Pages shown around the current one; the first and last are always reachable. */
const NEIGHBOURS = 1

function visiblePages(page: number, pageCount: number): Array<number | 'gap'> {
  const pages: Array<number | 'gap'> = []
  for (let candidate = 1; candidate <= pageCount; candidate += 1) {
    const near = Math.abs(candidate - page) <= NEIGHBOURS
    if (candidate === 1 || candidate === pageCount || near) pages.push(candidate)
    else if (pages[pages.length - 1] !== 'gap') pages.push('gap')
  }
  return pages
}

export function Pagination({ page, pageCount, hrefFor, labels }: PaginationProps) {
  if (pageCount <= 1) return null
  const visible = visiblePages(page, pageCount)
  return (
    <nav aria-label={labels.navigation} className={styles.pagination}>
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className={styles.step}
          aria-label={labels.previous}
          title={labels.previous}
        >
          <Icon glyph={CaretLeftIcon} />
        </Link>
      ) : null}
      <ol className={styles.pages}>
        {visible.map((entry, index) =>
          entry === 'gap' ? (
            <li
              key={`gap-before-${String(visible[index + 1] ?? 'end')}`}
              className={styles.gap}
              aria-hidden
            >
              …
            </li>
          ) : (
            <li key={entry}>
              <Link
                href={hrefFor(entry)}
                className={styles.page}
                aria-label={labels.page(entry)}
                aria-current={entry === page ? 'page' : undefined}
              >
                {entry}
              </Link>
            </li>
          ),
        )}
      </ol>
      {page < pageCount ? (
        <Link
          href={hrefFor(page + 1)}
          className={styles.step}
          aria-label={labels.next}
          title={labels.next}
        >
          <Icon glyph={CaretRightIcon} />
        </Link>
      ) : null}
    </nav>
  )
}
