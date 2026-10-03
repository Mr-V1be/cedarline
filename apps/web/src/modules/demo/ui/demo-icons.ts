import {
  ArticleIcon,
  BuildingsIcon,
  CalculatorIcon,
  EnvelopeSimpleIcon,
  HeadsetIcon,
  HouseLineIcon,
  LinkSimpleIcon,
  ListChecksIcon,
  NotePencilIcon,
  ShieldCheckIcon,
  SquaresFourIcon,
  TrayIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react/ssr'

import type { IconGlyph } from '@/ui/components/icon/icon'

import type { DemoRole } from '../domain/demo-tours'

export const ROLE_ICONS: Readonly<Record<DemoRole, IconGlyph>> = {
  'sales-manager': HeadsetIcon,
  'content-manager': NotePencilIcon,
  admin: ShieldCheckIcon,
}

/** Icons of the tour stops; a stop without one is shown with the dashboard icon. */
export const STOP_ICONS: Readonly<Record<string, IconGlyph>> = {
  leads: TrayIcon,
  mailbox: EnvelopeSimpleIcon,
  configurations: LinkSimpleIcon,
  projects: HouseLineIcon,
  rules: ListChecksIcon,
  tariff: CalculatorIcon,
  articles: ArticleIcon,
  dashboard: SquaresFourIcon,
  users: UsersThreeIcon,
  company: BuildingsIcon,
}

export const stopIconOf = (key: string): IconGlyph => STOP_ICONS[key] ?? SquaresFourIcon
