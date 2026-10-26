import { t } from './localized'

export const SITE = {
  phone: '+7 (812) 000-46-10',
  email: 'hello@cedarline.example',
  leadsEmail: 'sales@cedarline.example',
  address: t(
    'Ленинградская область, Тосненский район, производственная зона «Северная», 4',
    'Leningrad Oblast, Tosno District, Severnaya industrial zone, 4',
  ),
  hours: t('Пн–пт 9:00–19:00, сб 10:00–16:00', 'Mon–Fri 9:00–19:00, Sat 10:00–16:00'),
  region: t(
    'Санкт-Петербург и Ленинградская область, до 250 км',
    'St Petersburg and Leningrad Oblast, within 250 km',
  ),
  /** The factory near Tosno, [longitude, latitude]. */
  location: [30.8693, 59.5512] as [number, number],
  legalName: t('ООО «Cedarline» (вымышленная компания)', 'Cedarline LLC (a fictional company)'),
  // Obviously fictional identifiers: the company does not exist.
  taxId: '0000000000',
  registrationNumber: '0000000000000',
  privacyEmail: 'privacy@cedarline.example',
  privacyEdition: '2026-09-01',
}

export const HOME = {
  hero: 'sosny',
  featured: ['sosny', 'listvennitsa', 'kedr', 'yasen', 'bereza', 'mozhzhevelnik'],
  builtObjects: [
    'sosny-roshchino',
    'kedr-toksovo',
    'olkha-sosnovo',
    'mozhzhevelnik-luga',
    'yasen-kirovsk',
  ],
}
