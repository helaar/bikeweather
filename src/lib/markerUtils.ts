import type { Map as LeafletMap, LatLng } from "leaflet";

/**
 * Beregn en vinkelrett offset i piksler fra en rute-koordinat.
 * @param map Leaflet-kartinstans
 * @param latlng Punktet på ruten (LatLng)
 * @param direction Vinkel (radianer) for vinkelrett retning fra ruten
 * @param pixelOffset Hvor mange piksler markøren skal flyttes ut fra ruten
 * @returns Ny LatLng-posisjon for markøren
 */
export function offsetLatLngByPixels(
  map: LeafletMap,
  latlng: LatLng,
  direction: number,
  pixelOffset: number
): LatLng {
  // Konverter LatLng til container point (pikselkoordinater)
  const point = map.latLngToContainerPoint(latlng);
  // Beregn ny pikselposisjon vinkelrett på ruten
  const offsetX = Math.cos(direction) * pixelOffset;
  const offsetY = Math.sin(direction) * pixelOffset;
  const newPoint = point.add([offsetX, offsetY]);
  // Konverter tilbake til LatLng
  return map.containerPointToLatLng(newPoint);
}

/**
 * Finn vinkel (radianer) vinkelrett på ruten mellom to punkter.
 * @param from Startpunkt (LatLng)
 * @param to Sluttpunkt (LatLng)
 * @returns Vinkel (radianer) vinkelrett til venstre for ruten
 */
export function perpendicularAngle(from: LatLng, to: LatLng): number {
  const dx = to.lng - from.lng;
  const dy = to.lat - from.lat;
  // Vinkel på ruten
  const routeAngle = Math.atan2(dy, dx);
  // Vinkelrett til venstre (90 grader)
  return routeAngle + Math.PI / 2; // Changed from - to + to ensure consistent behavior
}