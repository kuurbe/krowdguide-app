/** Mapbox GL token — loaded from environment variable (VITE_MAPBOX_TOKEN) */
export const MAPBOX_TOKEN: string =
  import.meta.env.VITE_MAPBOX_TOKEN ??
  (() => {
    console.error('[Mapbox] VITE_MAPBOX_TOKEN not set — map will not load');
    return '';
  })();
