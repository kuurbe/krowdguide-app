/** Get current user position as [lng, lat] for Mapbox. Falls back to provided fallback. */
export function getUserLocation(fallback: [number, number]): Promise<[number, number]> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(fallback);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
      () => resolve(fallback),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
    );
  });
}
