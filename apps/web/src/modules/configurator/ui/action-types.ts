/** Contract of the save action the page hands to the configurator. */
export type SaveActionResult =
  | { readonly ok: true; readonly code: string; readonly url: string }
  | { readonly ok: false; readonly reason: 'invalid' | 'unavailable' | 'limited' | 'failed' }

export type SaveAction = (form: FormData) => Promise<SaveActionResult>

/** Address of a saved configuration's proposal PDF in the given language. */
export const proposalHref = (code: string, locale: string) =>
  `/files/c/${code}/proposal?lang=${locale}`
