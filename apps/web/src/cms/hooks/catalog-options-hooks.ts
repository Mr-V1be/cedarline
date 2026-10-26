import { ConfiguratorError, validateOffer, type OfferField } from '@cedarline/configurator'
import { ValidationError, type GlobalBeforeChangeHook, type PayloadRequest } from 'payload'

import { loadRoomKindIndex } from '@/modules/catalog/infrastructure/room-kind-index'
import {
  blueprintProblems,
  describeProblem,
} from '@/modules/configurator/application/blueprint-problems'
import { toBlueprint } from '@/modules/configurator/infrastructure/blueprint-mapper'
import {
  toConfiguratorOffer,
  type CatalogOptionSource,
} from '@/modules/configurator/infrastructure/options-mapper'
import { PayloadTariffRepository } from '@/modules/pricing/infrastructure/payload-tariff-repository'
import { standardsFor } from '@/modules/technology/application/standards'
import { PayloadTechnologyRepository } from '@/modules/technology/infrastructure/payload-technology-repository'

import { requestLocale } from './request-locale'

/** Form field of each part of the offer. */
const OFFER_PATHS: Readonly<Record<OfferField, string>> = {
  roofs: 'roofKinds',
  facades: 'facadePalettes',
  windowStyles: 'windowStyles',
  terrace: 'terraceDepths',
  insulation: 'rules',
  engineering: 'engineeringSystems',
  rules: 'rules',
}

const invalid = (path: string, message: string, req: PayloadRequest) =>
  new ValidationError({ global: 'catalog-options', errors: [{ path, message }], req })

/**
 * Set by bulk imports that save every project right after the offer: each project is then
 * checked against the new offer on its own save, so the cross-check here is skipped.
 */
export const DEFER_PROJECT_CHECKS = 'deferProjectChecks'

/**
 * Keeps the offer consistent and every project buildable: a rule or a removed option must
 * not leave a project that opens in a state the configurator itself would refuse.
 */
export const validateCatalogOptions: GlobalBeforeChangeHook = async ({ data, req, context }) => {
  const source = data as CatalogOptionSource
  // Reads share the save's transaction (one connection, so one after another) and its locale.
  const locale = requestLocale(req)
  const technology = await new PayloadTechnologyRepository(req.payload, locale, req).load()
  const offer = toConfiguratorOffer(source, technology.insulationOptions)
  try {
    validateOffer(offer)
  } catch (error) {
    if (!(error instanceof ConfiguratorError)) throw error
    const field = error.details.field as OfferField | undefined
    throw invalid(field === undefined ? 'rules' : OFFER_PATHS[field], error.message, req)
  }

  if (context[DEFER_PROJECT_CHECKS] === true) return source

  const rooms = await loadRoomKindIndex(req.payload, locale, req)
  const tariff = await new PayloadTariffRepository(req.payload, locale, req).load()
  const projects = await req.payload.find({
    collection: 'projects',
    req,
    depth: 0,
    pagination: false,
    overrideAccess: true,
    select: { slug: true, design: true, defaults: true, configurator: true },
  })
  const problems = blueprintProblems(
    projects.docs.map((document) => toBlueprint(document, rooms.keyOf)),
    offer,
    {
      rooms: rooms.catalog,
      standards: standardsFor(technology.layers, technology.insulationOptions[0] ?? 0),
    },
    tariff.grid,
  )
  if (problems.length > 0) {
    throw invalid(
      'rules',
      `Проекты окажутся в недопустимом состоянии: ${problems.map(describeProblem).join(' | ')}`,
      req,
    )
  }
  return source
}
