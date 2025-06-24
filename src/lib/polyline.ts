/**
 * Polyline decoding utility
 * Based on the algorithm described in:
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */

/**
 * Decodes an encoded polyline string into an array of coordinates
 * @param encoded The encoded polyline string
 * @returns Array of [latitude, longitude] coordinates
 */
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push([lat * 1e-5, lng * 1e-5]);
  }

  return points;
}

/**
 * Converts polyline coordinates to a format compatible with the application
 * @param coordinates Array of [latitude, longitude] coordinates
 * @returns Array of {lat, lon} objects
 */
export function polylineToRouteCoordinates(coordinates: [number, number][]): {lat: number, lon: number}[] {
  return coordinates.map(([lat, lng]) => ({
    lat,
    lon: lng
  }));
}

/**
 * Creates a simple GPX string from coordinates
 * @param coordinates Array of [latitude, longitude] coordinates
 * @param routeName Name of the route
 * @returns GPX string
 */
export function createGpxFromCoordinates(
  coordinates: [number, number][],
  routeName: string
): string {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<gpx creator="BikeWeather Strava Integration" version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(routeName)}</name>
  </metadata>
  <trk>
    <name>${escapeXml(routeName)}</name>
    <trkseg>`;

  const points = coordinates
    .map(([lat, lng]) => `      <trkpt lat="${lat}" lon="${lng}"></trkpt>`)
    .join('\n');

  const footer = `
    </trkseg>
  </trk>
</gpx>`;

  return header + '\n' + points + footer;
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}