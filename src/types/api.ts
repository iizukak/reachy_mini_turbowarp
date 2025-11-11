/**
 * TypeScript type definitions for Reachy Mini REST API
 * Based on FastAPI implementation in reachy_mini/daemon/app
 *
 * API Base URL: http://localhost:8000/api
 * OpenAPI Docs: http://localhost:8000/docs
 */

// ============================================================================
// Pose Types
// ============================================================================

/**
 * 3D pose using position (x, y, z) in meters and orientation (roll, pitch, yaw) in radians
 */
export interface XYZRPYPose {
  x: number; // meters
  y: number; // meters
  z: number; // meters
  roll: number; // radians
  pitch: number; // radians
  yaw: number; // radians
}

/**
 * 3D pose represented as a flattened 4x4 transformation matrix
 */
export interface Matrix4x4Pose {
  m: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
}

/**
 * Union type for pose representations
 */
export type AnyPose = XYZRPYPose | Matrix4x4Pose;

// ============================================================================
// Motor Control
// ============================================================================

/**
 * Motor control modes
 */
export type MotorControlMode = 'enabled' | 'disabled' | 'gravity_compensation';

/**
 * Motor status response
 */
export interface MotorStatus {
  mode: MotorControlMode;
}

// ============================================================================
// Movement Control
// ============================================================================

/**
 * Interpolation modes for movement
 */
export type InterpolationMode = 'linear' | 'minjerk' | 'ease' | 'cartoon';

/**
 * Request model for the /move/goto endpoint
 */
export interface GotoRequest {
  head_pose?: XYZRPYPose | null;
  antennas?: [number, number] | null; // [left, right] in radians
  body_yaw?: number | null; // radians
  duration: number; // seconds
  interpolation?: InterpolationMode;
}

/**
 * UUID response for move operations
 */
export interface MoveUUID {
  uuid: string;
}

// ============================================================================
// Robot State
// ============================================================================

/**
 * Full robot state
 */
export interface FullState {
  control_mode?: MotorControlMode | null;
  head_pose?: AnyPose | null;
  head_joints?: number[] | null;
  body_yaw?: number | null; // radians
  antennas_position?: number[] | null; // [left, right] in radians
  timestamp?: string | null; // ISO 8601 datetime
  passive_joints?: number[] | null;
}

/**
 * Full body target
 */
export interface FullBodyTarget {
  target_head_pose?: AnyPose | null;
  target_antennas?: [number, number] | null; // [left, right] in radians
  target_body_yaw?: number | null; // radians
  timestamp?: string | null; // ISO 8601 datetime
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Generic success response with message
 */
export interface StatusResponse {
  status: string;
}

/**
 * Generic message response
 */
export interface MessageResponse {
  message: string;
}

/**
 * Daemon status response
 */
export interface DaemonStatus {
  state: string;
  wireless_version: boolean;
  simulation_enabled: boolean;
  backend_status: {
    motor_control_mode: MotorControlMode;
    error: string | null;
  };
  error: string | null;
  wlan_ip: string | null;
}

// ============================================================================
// API Client Type Helpers
// ============================================================================

/**
 * API endpoint paths
 */
export const API_ENDPOINTS = {
  // Movement
  MOVE_WAKE_UP: '/move/play/wake_up',
  MOVE_GOTO_SLEEP: '/move/play/goto_sleep',
  MOVE_GOTO: '/move/goto',
  MOVE_RUNNING: '/move/running',
  MOVE_STOP: '/move/stop',
  MOVE_RECORDED_DATASETS_LIST: '/move/recorded-move-datasets/list',
  MOVE_PLAY_RECORDED: '/move/play/recorded-move-dataset',

  // State
  STATE_FULL: '/state/full',
  STATE_HEAD_POSE: '/state/present_head_pose',
  STATE_BODY_YAW: '/state/present_body_yaw',
  STATE_ANTENNA_POSITIONS: '/state/present_antenna_joint_positions',

  // Motors
  MOTORS_STATUS: '/motors/status',
  MOTORS_SET_MODE: '/motors/set_mode',
} as const;

/**
 * Type guard to check if a pose is XYZRPYPose
 */
export function isXYZRPYPose(pose: AnyPose): pose is XYZRPYPose {
  return 'x' in pose && 'y' in pose && 'z' in pose;
}

/**
 * Type guard to check if a pose is Matrix4x4Pose
 */
export function isMatrix4x4Pose(pose: AnyPose): pose is Matrix4x4Pose {
  return 'm' in pose;
}
