/** The product's mark in the CMS, drawn like the site logo; the colour follows the admin theme. */
function Mark({ size }: { readonly size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable="false">
      <path
        d="M4 15 16 5l12 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M8 13v14h16V13" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M16 11v16M12 17l4-3 4 3M11.5 22l4.5-3.5 4.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  )
}

const BRAND = 'Кедровник'
const ICON_SIZE = 28
const LOGO_MARK_SIZE = 44

export function Icon() {
  return <Mark size={ICON_SIZE} />
}

export function Logo() {
  return (
    <span className="kedrovnik-logo">
      <Mark size={LOGO_MARK_SIZE} />
      {BRAND}
    </span>
  )
}
