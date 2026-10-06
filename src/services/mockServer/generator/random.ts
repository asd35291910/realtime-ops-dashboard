/**
 * Returns a random integer between min and max (both included)
 */
export function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Same as randomInRange but with a random sign
 */
export function randomDelta(min: number, max: number): number {
  return (Math.random() < 0.5 ? -1 : 1) * randomInRange(min, max)
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
