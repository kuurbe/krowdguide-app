import { useState, useEffect } from 'react';

export function useWalkingMode(enabled = true) {
  const [isWalking, setIsWalking] = useState(false);
  const [speed, setSpeed] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled || typeof navigator === 'undefined' || !navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const s = pos.coords.speed; // m/s, may be null
        setSpeed(s);
        if (s == null) return;
        // walking: 0.7–2.5 m/s (~2.5–9 km/h)
        setIsWalking(s >= 0.7 && s <= 2.5);
      },
      () => { /* silent */ },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [enabled]);

  return { isWalking, speed };
}
