/**
 * Polyline decoder for browser
 * Based on @mapbox/polyline
 */

function py2Round(value: number): number {
  return Math.floor(Math.abs(value) + 0.5) * (value >= 0 ? 1 : -1)
}

export function decodePolyline(str: string, precision: number = 5): [number, number][] {
  let index = 0
  let lat = 0
  let lng = 0
  const coordinates: [number, number][] = []
  let shift = 0
  let result = 0
  let byte: number | null = null
  let latitudeChange: number
  let longitudeChange: number
  const factor = Math.pow(10, Number.isInteger(precision) ? precision : 5)

  while (index < str.length) {
    byte = null
    shift = 1
    result = 0

    do {
      byte = str.charCodeAt(index++) - 63
      result += (byte & 0x1f) * shift
      shift *= 32
    } while (byte >= 0x20)

    latitudeChange = (result & 1) ? ((-result - 1) / 2) : (result / 2)

    shift = 1
    result = 0

    do {
      byte = str.charCodeAt(index++) - 63
      result += (byte & 0x1f) * shift
      shift *= 32
    } while (byte >= 0x20)

    longitudeChange = (result & 1) ? ((-result - 1) / 2) : (result / 2)

    lat += latitudeChange
    lng += longitudeChange

    coordinates.push([lat / factor, lng / factor])
  }

  return coordinates
}

export function encodePolyline(coordinates: [number, number][], precision: number = 5): string {
  if (!coordinates.length) { return '' }

  const factor = Math.pow(10, Number.isInteger(precision) ? precision : 5)
  
  function encode(current: number, previous: number, factor: number): string {
    current = py2Round(current * factor)
    previous = py2Round(previous * factor)
    let coordinate = (current - previous) * 2
    if (coordinate < 0) {
      coordinate = -coordinate - 1
    }
    let output = ''
    while (coordinate >= 0x20) {
      output += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63)
      coordinate /= 32
    }
    output += String.fromCharCode((coordinate | 0) + 63)
    return output
  }

  let output = encode(coordinates[0][0], 0, factor) + encode(coordinates[0][1], 0, factor)

  for (let i = 1; i < coordinates.length; i++) {
    const a = coordinates[i]
    const b = coordinates[i - 1]
    output += encode(a[0], b[0], factor)
    output += encode(a[1], b[1], factor)
  }

  return output
}
