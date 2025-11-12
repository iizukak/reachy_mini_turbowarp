/**
 * Integration test utilities
 * Helper functions for testing with MuJoCo daemon
 */

const API_BASE = 'http://localhost:8000/api';
const DAEMON_CHECK_TIMEOUT = 10000; // 10 seconds
const MOVE_COMPLETION_BUFFER = 3000; // Extra 3000ms after duration for simulator

/**
 * Wait for daemon to be ready
 */
export async function waitForDaemon(timeoutMs: number = DAEMON_CHECK_TIMEOUT): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(`${API_BASE}/daemon/status`, {
        method: 'GET',
      });

      if (response.ok) {
        return;
      }
    } catch (_error) {
      // Daemon not ready yet, continue waiting
    }

    // Wait 500ms before retrying
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Daemon did not become ready within ${timeoutMs}ms`);
}

/**
 * Reset robot to default pose
 */
export async function resetRobotPose(): Promise<void> {
  const response = await fetch(`${API_BASE}/move/goto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      head_pose: {
        x: 0,
        y: 0,
        z: 0,
        pitch: 0,
        yaw: 0,
        roll: 0,
      },
      antennas: [0, 0],
      body_yaw: 0,
      duration: 2.0,
      interpolation: 'minjerk',
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to reset robot pose: ${response.status}`);
  }

  // Wait for movement to complete with polling
  await waitForMovement(2.0);

  // Additional settling time to ensure robot is completely stopped and state is updated
  // Increased to 2000ms to allow simulator and state cache to fully settle
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

/**
 * Wait for movement to complete
 * First waits for the expected duration, then polls until movement actually stops
 */
export async function waitForMovement(durationSeconds: number): Promise<void> {
  // Wait for expected duration + buffer
  const waitTimeMs = durationSeconds * 1000 + MOVE_COMPLETION_BUFFER;
  await new Promise((resolve) => setTimeout(resolve, waitTimeMs));

  // Poll until movement is actually stopped (max 10 seconds additional wait)
  const maxPollTime = 10000; // 10 seconds
  const pollInterval = 200; // Check every 200ms
  const startTime = Date.now();

  while (Date.now() - startTime < maxPollTime) {
    const isRunning = await isMovementRunning();
    if (!isRunning) {
      // Movement stopped, wait a bit more for settling
      await new Promise((resolve) => setTimeout(resolve, 300));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  // If we get here, movement is still running after max wait time
  console.warn(`Movement still running after ${durationSeconds}s + ${maxPollTime}ms`);
}

/**
 * Wait for pre-programmed animation to complete (wake_up, goto_sleep, etc.)
 * These animations have unknown durations, so we poll immediately
 */
export async function waitForAnimation(): Promise<void> {
  // Give animation a moment to start
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Poll until animation is complete (max 30 seconds for long animations)
  const maxPollTime = 30000; // 30 seconds
  const pollInterval = 300; // Check every 300ms
  const startTime = Date.now();

  while (Date.now() - startTime < maxPollTime) {
    const isRunning = await isMovementRunning();
    if (!isRunning) {
      // Animation stopped, wait for settling
      await new Promise((resolve) => setTimeout(resolve, 500));
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  // If we get here, animation is still running after max wait time
  console.warn(`Animation still running after ${maxPollTime}ms`);
}

/**
 * Check if a movement is currently running
 */
export async function isMovementRunning(): Promise<boolean> {
  const response = await fetch(`${API_BASE}/move/running`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to check movement status: ${response.status}`);
  }

  // API returns array of running movement UUIDs
  const data = (await response.json()) as string[];
  return data.length > 0;
}

/**
 * Get current robot state
 */
export async function getRobotState(): Promise<{
  head_pose?: {
    pitch?: number;
    yaw?: number;
    roll?: number;
  };
  antennas_position?: number[];
  body_yaw?: number;
}> {
  const response = await fetch(`${API_BASE}/state/full`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to get robot state: ${response.status}`);
  }

  return response.json();
}

/**
 * Custom matcher for comparing angles with tolerance
 */
export function expectAngleCloseTo(
  actual: number,
  expected: number,
  tolerance: number = 0.1,
): void {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(
      `Expected angle ${actual} to be close to ${expected} (tolerance: ${tolerance}), but difference was ${diff}`,
    );
  }
}
