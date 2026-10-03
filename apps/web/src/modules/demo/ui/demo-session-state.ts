/** What a one-click sign-in reports back when it does not redirect into the CMS. */
export interface DemoSessionState {
  readonly error: 'limited' | 'unavailable' | null
}

export const DEMO_SESSION_IDLE: DemoSessionState = { error: null }

export type DemoSessionAction = (
  previous: DemoSessionState,
  form: FormData,
) => Promise<DemoSessionState>
