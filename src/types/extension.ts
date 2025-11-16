/**
 * TypeScript type definitions for Reachy Mini TurboWarp Extension
 * Internal types for extension implementation
 */

import type { InterpolationMode, MotorControlMode, XYZRPYPose } from './api.js';

// ============================================================================
// Block Argument Types
// ============================================================================

/**
 * Predefined head directions for simple control
 */
export type HeadDirection =
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT'
  | 'UP_LEFT'
  | 'UP_RIGHT'
  | 'DOWN_LEFT'
  | 'DOWN_RIGHT'
  | 'CENTER';

/**
 * Head direction menu items for Scratch blocks
 */
export interface HeadDirectionMenuItem {
  text: string;
  value: HeadDirection;
}

/**
 * Interpolation mode menu items for Scratch blocks
 */
export interface InterpolationMenuItem {
  text: string;
  value: InterpolationMode;
}

/**
 * Motor control mode menu items for Scratch blocks
 */
export interface MotorModeMenuItem {
  text: string;
  value: MotorControlMode;
}

// ============================================================================
// Extension State
// ============================================================================

/**
 * Connection status to Reachy Mini daemon
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'error';

/**
 * Extension runtime state
 */
export interface ExtensionState {
  /**
   * Connection status to daemon
   */
  connectionStatus: ConnectionStatus;

  /**
   * API base URL (default: http://localhost:8000/api)
   */
  apiBaseUrl: string;

  /**
   * UUID of the currently running movement (if any)
   */
  currentMoveUuid: string | null;

  /**
   * Cache of last known robot state
   */
  lastKnownState: RobotStateCache | null;

  /**
   * Timestamp of last state update
   */
  lastStateUpdate: number | null;
}

/**
 * Cached robot state for reporter blocks
 */
export interface RobotStateCache {
  headPitch: number; // radians
  headYaw: number; // radians
  headRoll: number; // radians
  leftAntenna: number; // radians
  rightAntenna: number; // radians
  bodyYaw: number; // radians
  motorMode: MotorControlMode;
}

// ============================================================================
// Head Direction Presets
// ============================================================================

/**
 * Predefined head poses for simple direction control
 * Values are in radians
 */
export interface HeadDirectionPreset {
  pitch: number;
  yaw: number;
  roll: number;
}

/**
 * Map of head directions to pose presets
 */
export type HeadDirectionPresets = {
  [_K in HeadDirection]: HeadDirectionPreset;
};

// ============================================================================
// Preset Motions
// ============================================================================

/**
 * Identifier for predefined motion presets
 */
export type PresetMotionId = 'HEAD_NOD' | 'HEAD_SHAKE' | 'ANTENNA_WAVE' | 'BODY_SWAY';

/**
 * Single step in a preset motion sequence
 */
export interface PresetMotionStep {
  duration: number;
  head?: Partial<XYZRPYPose>;
  antennas?: [number, number];
  bodyYaw?: number;
}

/**
 * Preset motion definition
 */
export interface PresetMotionDefinition {
  steps: PresetMotionStep[];
  interpolation: InterpolationMode;
}

// ============================================================================
// Block Arguments
// ============================================================================

/**
 * Arguments for moveHeadDirection block
 */
export interface MoveHeadDirectionArgs {
  DIRECTION: HeadDirection;
  DURATION: number;
}

/**
 * Arguments for moveHeadCustom block
 */
export interface MoveHeadCustomArgs {
  PITCH: number; // degrees
  YAW: number; // degrees
  ROLL: number; // degrees
  DURATION: number;
  INTERPOLATION: InterpolationMode;
}

/**
 * Arguments for moveAntennas block (individual control)
 */
export interface MoveAntennasArgs {
  LEFT: number; // degrees
  RIGHT: number; // degrees
  DURATION: number;
}

/**
 * Arguments for moveAntennasBoth block (symmetric control)
 */
export interface MoveAntennasBothArgs {
  ANGLE: number; // degrees
  DURATION: number;
}

/**
 * Arguments for playRecordedMoveDataset block
 */
export interface PlayRecordedMoveArgs {
  MOVE: string;
}

/**
 * Arguments for performPresetMotion block
 */
export interface PerformPresetMotionArgs {
  MOTION: PresetMotionId;
  CYCLES: number;
}

/**
 * Arguments for setMotorMode block
 */
export interface SetMotorModeArgs {
  MODE: MotorControlMode;
}

// ============================================================================
// API Response Handling
// ============================================================================

/**
 * Result of an API call
 */
export interface ApiResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Movement command result
 */
export interface MoveResult {
  success: boolean;
  uuid?: string;
  error?: string;
}

// ============================================================================
// Extension Configuration
// ============================================================================

/**
 * Extension configuration options
 */
export interface ExtensionConfig {
  /**
   * Default API base URL
   */
  defaultApiUrl: string;

  /**
   * Default duration for movements (seconds)
   */
  defaultDuration: number;

  /**
   * Default interpolation mode
   */
  defaultInterpolation: InterpolationMode;

  /**
   * Timeout for API requests (milliseconds)
   */
  apiTimeout: number;

  /**
   * Interval for state polling (milliseconds)
   */
  statePollInterval: number;
}
