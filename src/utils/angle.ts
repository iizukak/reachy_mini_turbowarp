/**
 * Angle conversion utilities
 *
 * TurboWarp (Scratch) blocks use degrees
 * Reachy Mini REST API uses radians
 */

/**
 * Convert degrees to radians
 * @param degrees - Angle in degrees
 * @returns Angle in radians
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Convert radians to degrees
 * @param radians - Angle in radians
 * @returns Angle in degrees
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}
