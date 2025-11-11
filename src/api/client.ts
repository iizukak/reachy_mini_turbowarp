/**
 * REST API client for Reachy Mini daemon
 * Provides type-safe API calls with error handling
 */

import type {
  DaemonStatus,
  FullState,
  GotoRequest,
  MotorControlMode,
  MotorStatus,
  MoveUUID,
  StatusResponse,
} from '../types/api.js';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Default API configuration
 */
export const DEFAULT_API_CONFIG = {
  baseUrl: 'http://localhost:8000/api',
  timeout: 30000, // 30 seconds (needed for simulator movements)
} as const;

/**
 * API client configuration
 */
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ============================================================================
// HTTP Request Helper
// ============================================================================

/**
 * Makes an HTTP request with timeout and error handling
 */
async function makeRequest<T>(url: string, options: RequestInit, timeout: number): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', undefined, error);
      }
      throw new ApiError(`Network error: ${error.message}`, undefined, error);
    }

    throw new ApiError('Unknown error occurred');
  }
}

// ============================================================================
// API Client Class
// ============================================================================

/**
 * Reachy Mini API client
 */
export class ReachyMiniApiClient {
  private config: ApiConfig;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      ...DEFAULT_API_CONFIG,
      ...config,
    };
  }

  /**
   * Updates the API configuration
   */
  updateConfig(config: Partial<ApiConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Gets the current base URL
   */
  getBaseUrl(): string {
    return this.config.baseUrl;
  }

  // ==========================================================================
  // Movement Control
  // ==========================================================================

  /**
   * Wakes up the robot (pre-programmed animation)
   */
  async wakeUp(): Promise<MoveUUID> {
    const url = `${this.config.baseUrl}/move/play/wake_up`;
    return makeRequest<MoveUUID>(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      this.config.timeout
    );
  }

  /**
   * Puts the robot to sleep (pre-programmed animation)
   */
  async gotoSleep(): Promise<MoveUUID> {
    const url = `${this.config.baseUrl}/move/play/goto_sleep`;
    return makeRequest<MoveUUID>(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      this.config.timeout
    );
  }

  /**
   * Moves the robot to a specified pose
   */
  async goto(request: GotoRequest): Promise<MoveUUID> {
    const url = `${this.config.baseUrl}/move/goto`;
    return makeRequest<MoveUUID>(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      },
      this.config.timeout
    );
  }

  /**
   * Checks if a movement is currently running
   */
  async isMovementRunning(): Promise<boolean> {
    const url = `${this.config.baseUrl}/move/running`;
    const response = await makeRequest<string[]>(
      url,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
      this.config.timeout
    );
    // Returns array of running movement UUIDs, empty if none
    return response.length > 0;
  }

  /**
   * Stops all current movements
   */
  async stopMovement(): Promise<StatusResponse> {
    const url = `${this.config.baseUrl}/move/stop`;
    return makeRequest<StatusResponse>(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      this.config.timeout
    );
  }

  // ==========================================================================
  // State Queries
  // ==========================================================================

  /**
   * Gets the full robot state
   */
  async getFullState(): Promise<FullState> {
    const url = `${this.config.baseUrl}/state/full`;
    return makeRequest<FullState>(
      url,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
      this.config.timeout
    );
  }

  /**
   * Gets the current head pose
   */
  async getHeadPose(): Promise<{
    x: number;
    y: number;
    z: number;
    roll: number;
    pitch: number;
    yaw: number;
  }> {
    const url = `${this.config.baseUrl}/state/present_head_pose`;
    return makeRequest<{
      x: number;
      y: number;
      z: number;
      roll: number;
      pitch: number;
      yaw: number;
    }>(
      url,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
      this.config.timeout
    );
  }

  /**
   * Gets the current body yaw angle
   */
  async getBodyYaw(): Promise<number> {
    const url = `${this.config.baseUrl}/state/present_body_yaw`;
    return makeRequest<number>(
      url,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
      this.config.timeout
    );
  }

  /**
   * Gets the current antenna positions
   */
  async getAntennaPositions(): Promise<[number, number]> {
    const url = `${this.config.baseUrl}/state/present_antenna_joint_positions`;
    return makeRequest<[number, number]>(
      url,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
      this.config.timeout
    );
  }

  // ==========================================================================
  // Motor Control
  // ==========================================================================

  /**
   * Gets the current motor status
   */
  async getMotorStatus(): Promise<MotorStatus> {
    const url = `${this.config.baseUrl}/motors/status`;
    return makeRequest<MotorStatus>(
      url,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
      this.config.timeout
    );
  }

  /**
   * Sets the motor control mode
   */
  async setMotorMode(mode: MotorControlMode): Promise<StatusResponse> {
    const url = `${this.config.baseUrl}/motors/set_mode/${mode}`;
    return makeRequest<StatusResponse>(
      url,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      this.config.timeout
    );
  }

  // ==========================================================================
  // Daemon Status
  // ==========================================================================

  /**
   * Gets the daemon status
   */
  async getDaemonStatus(): Promise<DaemonStatus> {
    const url = `${this.config.baseUrl}/daemon/status`;
    return makeRequest<DaemonStatus>(
      url,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
      this.config.timeout
    );
  }

  /**
   * Checks if the daemon is reachable
   */
  async ping(): Promise<boolean> {
    try {
      await this.getDaemonStatus();
      return true;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// Singleton Instance (default)
// ============================================================================

/**
 * Default API client instance
 */
export const apiClient = new ReachyMiniApiClient();
