/**
 * Sleep utility for waiting in async functions
 */

/**
 * Sleeps for the specified duration in milliseconds
 * @param ms Duration in milliseconds
 * @returns Promise that resolves after the specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
