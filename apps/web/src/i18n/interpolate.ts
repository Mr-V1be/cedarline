/**
 * Fills `{name}` placeholders in a message that is read as structured content (a document of
 * sections and paragraphs) rather than looked up key by key.
 */
export function interpolate(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in values ? String(values[name]) : placeholder,
  )
}
