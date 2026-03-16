/**
 * Haptic feedback utility — uses Web Vibration API
 * Provides tactile feedback on supported devices (mobile browsers)
 */

type HapticStyle = 'light' | 'medium' | 'heavy';

const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 10,    // Tab switches, pill taps
  medium: 20,   // Card presses, drawer opens
  heavy: [15, 10, 15], // Navigation start, arrival
};

/**
 * Trigger haptic feedback if supported
 */
export function haptic(style: HapticStyle = 'light'): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(PATTERNS[style]);
    } catch {
      // Silently fail — vibration not available
    }
  }
}

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}
