import { THEME_ATTRIBUTE, THEME_STORAGE_KEY, THEMES } from './theme'

/*
 * Applies a stored explicit theme before the first paint, so there is no flash of the wrong
 * theme. Without a stored choice the CSS follows prefers-color-scheme on its own. Storage may
 * be unavailable (private mode, blocked site data); the page then simply follows the system.
 */
const script = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(${JSON.stringify(THEMES)}.indexOf(t)>-1){document.documentElement.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)},t)}}catch(e){}})()`

export function ThemeScript() {
  // A static string built from constants above: no user input reaches it.
  // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
