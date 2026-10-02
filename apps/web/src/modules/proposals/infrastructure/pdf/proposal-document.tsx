import { Document, Image, Page, Path, Svg, Text, View } from '@react-pdf/renderer'

import { QrCode } from './qr-code'
import { PDF_COLOURS, styles } from './proposal-styles'
import type { ProposalView } from './proposal-view'

const QR_SIZE = 92
/** Phases alternate between two greens on the chart. */
const PHASE_COLOURS = [PDF_COLOURS.band, PDF_COLOURS.bar] as const

function Mark() {
  return (
    <Svg width={22} height={22} viewBox="0 0 32 32">
      <Path d="M4 15 16 5l12 10" stroke={PDF_COLOURS.onBand} strokeWidth={1.6} fill="none" />
      <Path d="M8 13v14h16V13" stroke={PDF_COLOURS.onBand} strokeWidth={1.6} fill="none" />
      <Path
        d="M16 11v16M12 17l4-3 4 3M11.5 22l4.5-3.5 4.5 3.5"
        stroke={PDF_COLOURS.onBand}
        strokeWidth={1.3}
        fill="none"
      />
    </Svg>
  )
}

function Footer({ view }: { view: ProposalView }) {
  return (
    <View style={styles.footer} fixed>
      <Text>{view.footer.company}</Text>
      <Text render={({ pageNumber, totalPages }) => view.pageLabel(pageNumber, totalPages)} />
    </View>
  )
}

function Header({ view }: { view: ProposalView }) {
  return (
    <View style={styles.band}>
      <View style={styles.brand}>
        <Mark />
        <Text style={styles.brandName}>{view.brand}</Text>
      </View>
      <View style={styles.bandMeta}>
        <Text style={styles.bandTitle}>{view.title}</Text>
        <Text>
          {view.number} {view.date}
        </Text>
      </View>
    </View>
  )
}

function Schedule({ view }: { view: ProposalView }) {
  const phaseColour = (phase: string) =>
    PHASE_COLOURS[view.phases.findIndex((item) => item.key === phase) % PHASE_COLOURS.length] ??
    PDF_COLOURS.band
  return (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>{view.scheduleTitle}</Text>
      <View style={styles.phases}>
        {view.phases.map((phase) => (
          <Text key={phase.key}>{phase.label}</Text>
        ))}
      </View>
      {view.gantt.map((row) => (
        <View key={row.name} style={styles.ganttRow}>
          <Text style={styles.ganttLabel}>{row.name}</Text>
          <View style={styles.ganttTrack}>
            <View
              style={[
                styles.ganttBar,
                {
                  left: `${(row.from * 100).toFixed(2)}%`,
                  width: `${Math.max(1, (row.to - row.from) * 100).toFixed(2)}%`,
                  backgroundColor: phaseColour(row.phase),
                },
              ]}
            />
          </View>
        </View>
      ))}
      <View style={styles.ganttScale}>
        <Text>{view.weeksLabel} 1</Text>
        <Text>{view.totalWeeks}</Text>
      </View>
    </View>
  )
}

/** The commercial proposal: render and key figures, configuration, estimate, schedule, link. */
export function ProposalDocument({ view }: { view: ProposalView }) {
  return (
    <Document title={`${view.title} ${view.number}`} author={view.brand} language={view.locale}>
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          <Header view={view} />
          <Text style={styles.heading}>{view.heading}</Text>
          <Text style={styles.subheading}>{view.subheading}</Text>
          {view.render === null ? (
            <View style={styles.noRender}>
              <Text>{view.noRender}</Text>
            </View>
          ) : (
            <Image style={styles.render} src={view.render} />
          )}
          <View style={styles.facts}>
            {view.facts.map((fact) => (
              <View key={fact.label} style={styles.fact}>
                <Text style={styles.factLabel}>{fact.label}</Text>
                <Text style={fact.large === true ? styles.factValueLarge : styles.factValue}>
                  {fact.value}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.sectionTitle}>{view.configurationTitle}</Text>
          <View style={styles.rows}>
            {view.configuration.map((row) => (
              <View key={row.group} style={styles.row} wrap={false}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <View style={styles.rowValue}>
                  {row.swatch === undefined ? null : (
                    <View style={[styles.swatch, { backgroundColor: row.swatch }]} />
                  )}
                  <Text>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
        <Footer view={view} />
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
          <Header view={view} />
          <Text style={styles.sectionTitle}>{view.estimateTitle}</Text>
          <View style={styles.table}>
            <View style={styles.tableHead} fixed>
              <Text style={styles.cellItem}>{view.columns.item}</Text>
              <Text style={styles.cellQuantity}>{view.columns.quantity}</Text>
              <Text style={styles.cellPrice}>{view.columns.price}</Text>
              <Text style={styles.cellAmount}>{view.columns.amount}</Text>
            </View>
            {view.sections.map((section) => (
              <View key={section.name}>
                <View style={styles.sectionRow} wrap={false}>
                  <Text style={{ width: '80%' }}>{section.name}</Text>
                  <Text style={styles.cellAmount}>{section.subtotal}</Text>
                </View>
                {section.lines.map((line) => (
                  <View key={line.name} style={styles.lineRow} wrap={false}>
                    <Text style={styles.cellItem}>{line.name}</Text>
                    <Text style={styles.cellQuantity}>{line.quantity}</Text>
                    <Text style={styles.cellPrice}>{line.price}</Text>
                    <Text style={styles.cellAmount}>{line.amount}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
          <View style={styles.totalRow} wrap={false}>
            <Text style={styles.totalLabel}>{view.totalLabel}</Text>
            <Text style={styles.totalValue}>{view.total}</Text>
          </View>
          <Schedule view={view} />
          <View style={styles.linkBlock} wrap={false}>
            <QrCode value={view.link} size={QR_SIZE} colour={PDF_COLOURS.ink} />
            <View style={styles.linkText}>
              <Text style={styles.linkTitle}>{view.linkTitle}</Text>
              <Text style={styles.linkUrl}>{view.link}</Text>
              <Text style={styles.linkNote}>{view.linkNote}</Text>
            </View>
          </View>
          <Text style={styles.terms}>{view.terms}</Text>
          <Text style={styles.terms}>{view.footer.demo}</Text>
        </View>
        <Footer view={view} />
      </Page>
    </Document>
  )
}
