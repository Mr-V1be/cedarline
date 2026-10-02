import { renderToBuffer } from '@react-pdf/renderer'

import type { ProposalInput, ProposalRenderer } from '../ports/proposal-renderer'
import { registerPdfFonts } from './pdf/fonts'
import { ProposalDocument } from './pdf/proposal-document'
import { buildProposalView } from './pdf/proposal-view'

/** Server-side PDF with react-pdf: vector text in the site's fonts, the render as JPEG. */
export class ReactPdfProposalRenderer implements ProposalRenderer {
  async render(input: ProposalInput): Promise<Buffer> {
    registerPdfFonts()
    const view = await buildProposalView(input)
    return renderToBuffer(<ProposalDocument view={view} />)
  }
}
