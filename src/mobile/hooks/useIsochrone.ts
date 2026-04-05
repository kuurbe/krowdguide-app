/**
 * React hook for Mapbox Isochrone — manages polygon state,
 * caching, and loading/error lifecycle.
 */

import { useState, useCallback, useRef } from 'react';
import { fetchIsochrone } from '../services/isochroneService';
import { errorMessage } from '../services/fetchUtil';

interface IsochroneState {
  polygon: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
}

export function useIsochrone() {
  const [state, setState] = useState<IsochroneState>({
    polygon: null,
    loading: false,
    error: null,
  });

  const cache = useRef<Record<string, Record<string, unknown>>>({});
  const cancelRef = useRef(false);

  const fetchPolygon = useCallback(
    async (
      center: [number, number],
      minutes: number[] = [5, 10, 15],
      mode: string = 'walking',
    ) => {
      const key = `${center[0]},${center[1]}-${minutes.join(',')}`;

      // Return cached result if available
      if (cache.current[key]) {
        setState({ polygon: cache.current[key], loading: false, error: null });
        return;
      }

      cancelRef.current = false;
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const geojson = await fetchIsochrone(center, minutes, mode);
        if (cancelRef.current) return;

        cache.current[key] = geojson;
        setState({ polygon: geojson, loading: false, error: null });
      } catch (err) {
        if (cancelRef.current) return;
        setState({ polygon: null, loading: false, error: errorMessage(err) });
      }
    },
    [],
  );

  const clearPolygon = useCallback(() => {
    cancelRef.current = true;
    setState({ polygon: null, loading: false, error: null });
  }, []);

  return {
    polygon: state.polygon,
    loading: state.loading,
    error: state.error,
    fetchPolygon,
    clearPolygon,
  };
}
