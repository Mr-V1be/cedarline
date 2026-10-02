import { Path, Svg } from '@react-pdf/renderer'
import QRCode from 'qrcode'

/** Quiet zone around the code, in modules, as the QR standard asks. */
const QUIET_ZONE = 2

/** A QR code drawn as vector modules, crisp at any print size. */
export function QrCode({ value, size, colour }: { value: string; size: number; colour: string }) {
  const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' })
  const count = modules.size
  const cells: string[] = []
  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (modules.get(row, column) === 1) {
        cells.push(`M${column + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`)
      }
    }
  }
  const extent = count + QUIET_ZONE * 2
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${extent} ${extent}`}>
      <Path d={cells.join('')} fill={colour} />
    </Svg>
  )
}
