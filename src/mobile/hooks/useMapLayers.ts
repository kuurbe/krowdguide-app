/**
 * Central hook for managing toggleable map data layers.
 * Each layer type can be independently toggled on/off.
 */

import { useState, useCallback } from 'react';
import type { DataLayerType } from '../types';

type LayerState = Record<DataLayerType, boolean>;

const DEFAULT_STATE: LayerState = {
  isochrone: false,
  weather: false,
  aqi: false,
  transit: false,
  ev: false,
  bikes: false,
  accessibility: false,
};

export function useMapLayers() {
  const [layers, setLayers] = useState<LayerState>(DEFAULT_STATE);

  const toggleLayer = useCallback((layer: DataLayerType) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const isLayerActive = useCallback(
    (layer: DataLayerType) => layers[layer],
    [layers],
  );

  const setLayerActive = useCallback((layer: DataLayerType, active: boolean) => {
    setLayers(prev => ({ ...prev, [layer]: active }));
  }, []);

  const activeLayers = Object.entries(layers)
    .filter(([, v]) => v)
    .map(([k]) => k as DataLayerType);

  return {
    layers,
    activeLayers,
    toggleLayer,
    isLayerActive,
    setLayerActive,
  };
}
