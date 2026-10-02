export { ConfiguratorError, type ConfiguratorErrorCode } from './errors'
export type {
  CompatibilityRule,
  ConfiguratorModel,
  ConfiguratorOffer,
  EngineeringOffer,
  FacadeOffer,
  Footprint,
  HouseContext,
  ProjectBlueprint,
  ProjectDefaults,
  TerraceOffer,
} from './model'
export {
  GEOMETRY_GROUPS,
  MULTI_GROUPS,
  OPTION_GROUPS,
  isOptionGroup,
  type Choice,
  type Configuration,
  type OptionGroup,
} from './configuration'
export { footprintKey, footprintOf, footprintsOf, sameFootprint, storeyKey } from './footprint'
export {
  SELECTION_OPTIONS,
  designSelections,
  selectionsOf,
  type SelectionOption,
} from './selections'
export {
  applyChoice,
  blueprintOf,
  choicesOf,
  initialConfiguration,
  isChosen,
  terraceDepthsOf,
  unofferedGroups,
} from './choices'
export { houseInputOf } from './house-input'
export {
  compatibilityRestrictions,
  introducedBy,
  restrictionKey,
  type Restriction,
} from './restrictions'
export { completenessCovering } from './pricing-scope'
export {
  Configurator,
  type ChoiceState,
  type ConfigurationState,
  type GroupState,
} from './configurator'
export { parseConfiguration } from './parse'
export { SHARE_CODE_ALPHABET, SHARE_CODE_LENGTH, isShareCode, shareCodeFrom } from './share-code'
export { blueprintIssues, validateOffer, type BlueprintIssue, type OfferField } from './validate'
