/** Structured data for search engines (schema.org), rendered as a JSON-LD script. */
export function JsonLd({ data }: { readonly data: Readonly<Record<string, unknown>> }) {
  // `<` is escaped so that text from the CMS cannot close the script element.
  const json = JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(
    /</g,
    '\\u003c',
  )
  return (
    <script
      type="application/ld+json"
      // Serialised data with `<` escaped above, the form Next.js documents for JSON-LD.
      // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
