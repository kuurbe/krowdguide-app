/** Open directions in native maps app (walking mode) */
export function openDirections(lat: number, lng: number, name: string) {
  const dest = `${lat},${lng}`;
  const encodedName = encodeURIComponent(name);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const url = isIOS
    ? `maps://maps.apple.com/?daddr=${dest}&q=${encodedName}&dirflg=w`
    : `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`;
  window.open(url, '_blank');
}
