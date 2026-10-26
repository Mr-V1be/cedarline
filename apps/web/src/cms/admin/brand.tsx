import { BRAND_NAME } from '@/ui/brand/brand'
import { BrandMark } from '@/ui/brand/brand-mark'

/** The product's mark in the CMS, drawn like the site logo; the colour follows the admin theme. */
const ICON_SIZE = 28
const LOGO_MARK_SIZE = 44

export function Icon() {
  return <BrandMark size={ICON_SIZE} />
}

export function Logo() {
  return (
    <span className="cedarline-logo">
      <BrandMark size={LOGO_MARK_SIZE} />
      {BRAND_NAME}
    </span>
  )
}
