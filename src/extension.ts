/**
 * Reachy Mini TurboWarp Extension
 * Main extension class implementing Scratch extension interface
 */

import { apiClient } from './api/client.js';
import { degToRad, radToDeg } from './utils/angle.js';
import type { ExtensionState, HeadDirection, HeadDirectionPresets } from './types/extension.js';
import type { MotorControlMode } from './types/api.js';

// ============================================================================
// Constants
// ============================================================================

/**
 * Head direction presets (in radians)
 */
const HEAD_DIRECTION_PRESETS: HeadDirectionPresets = {
  UP: { pitch: 0.3, yaw: 0, roll: 0 },
  DOWN: { pitch: -0.3, yaw: 0, roll: 0 },
  LEFT: { pitch: 0, yaw: 0.5, roll: 0 },
  RIGHT: { pitch: 0, yaw: -0.5, roll: 0 },
  UP_LEFT: { pitch: 0.3, yaw: 0.5, roll: 0 },
  UP_RIGHT: { pitch: 0.3, yaw: -0.5, roll: 0 },
  DOWN_LEFT: { pitch: -0.3, yaw: 0.5, roll: 0 },
  DOWN_RIGHT: { pitch: -0.3, yaw: -0.5, roll: 0 },
  CENTER: { pitch: 0, yaw: 0, roll: 0 },
};

// ============================================================================
// Extension Class
// ============================================================================

/**
 * Reachy Mini TurboWarp Extension
 */
export class ReachyMiniExtension {
  private state: ExtensionState;

  constructor() {
    this.state = {
      connectionStatus: 'disconnected',
      apiBaseUrl: 'http://localhost:8000/api',
      currentMoveUuid: null,
      lastKnownState: null,
      lastStateUpdate: null,
    };
  }

  /**
   * Returns extension metadata and block definitions
   */
  getInfo(): ExtensionInfo {
    return {
      id: 'reachymini',
      name: 'Reachy Mini',
      color1: '#4C97FF',
      color2: '#3373CC',
      color3: '#2E5BA6',
      blocks: [
        // Basic movements
        {
          opcode: 'wakeUp',
          blockType: BlockType.COMMAND,
          text: 'wake up robot',
        },
        {
          opcode: 'gotoSleep',
          blockType: BlockType.COMMAND,
          text: 'put robot to sleep',
        },
        '---',

        // Head control - simple
        {
          opcode: 'moveHeadDirection',
          blockType: BlockType.COMMAND,
          text: 'move head [DIRECTION] for [DURATION] seconds',
          arguments: {
            DIRECTION: {
              type: ArgumentType.STRING,
              menu: 'headDirection',
              defaultValue: 'CENTER',
            },
            DURATION: {
              type: ArgumentType.NUMBER,
              defaultValue: 2,
            },
          },
        },

        // Head control - custom
        {
          opcode: 'moveHeadCustom',
          blockType: BlockType.COMMAND,
          text: 'move head pitch [PITCH]° yaw [YAW]° roll [ROLL]° for [DURATION]s',
          arguments: {
            PITCH: {
              type: ArgumentType.NUMBER,
              defaultValue: 0,
            },
            YAW: {
              type: ArgumentType.NUMBER,
              defaultValue: 0,
            },
            ROLL: {
              type: ArgumentType.NUMBER,
              defaultValue: 0,
            },
            DURATION: {
              type: ArgumentType.NUMBER,
              defaultValue: 2,
            },
          },
        },
        '---',

        // Antenna control
        {
          opcode: 'moveAntennas',
          blockType: BlockType.COMMAND,
          text: 'move antennas left [LEFT]° right [RIGHT]° for [DURATION]s',
          arguments: {
            LEFT: {
              type: ArgumentType.NUMBER,
              defaultValue: 0,
            },
            RIGHT: {
              type: ArgumentType.NUMBER,
              defaultValue: 0,
            },
            DURATION: {
              type: ArgumentType.NUMBER,
              defaultValue: 2,
            },
          },
        },
        {
          opcode: 'moveAntennasBoth',
          blockType: BlockType.COMMAND,
          text: 'move both antennas [ANGLE]° for [DURATION]s',
          arguments: {
            ANGLE: {
              type: ArgumentType.NUMBER,
              defaultValue: 0,
            },
            DURATION: {
              type: ArgumentType.NUMBER,
              defaultValue: 2,
            },
          },
        },
        '---',

        // Motor control
        {
          opcode: 'setMotorMode',
          blockType: BlockType.COMMAND,
          text: 'set motor mode [MODE]',
          arguments: {
            MODE: {
              type: ArgumentType.STRING,
              menu: 'motorMode',
              defaultValue: 'enabled',
            },
          },
        },
        '---',

        // Reporter blocks (getters)
        {
          opcode: 'getHeadPitch',
          blockType: BlockType.REPORTER,
          text: 'head pitch (degrees)',
        },
        {
          opcode: 'getHeadYaw',
          blockType: BlockType.REPORTER,
          text: 'head yaw (degrees)',
        },
        {
          opcode: 'getHeadRoll',
          blockType: BlockType.REPORTER,
          text: 'head roll (degrees)',
        },
        {
          opcode: 'getLeftAntenna',
          blockType: BlockType.REPORTER,
          text: 'left antenna angle (degrees)',
        },
        {
          opcode: 'getRightAntenna',
          blockType: BlockType.REPORTER,
          text: 'right antenna angle (degrees)',
        },
        {
          opcode: 'getBodyYaw',
          blockType: BlockType.REPORTER,
          text: 'body yaw (degrees)',
        },
        {
          opcode: 'getMotorMode',
          blockType: BlockType.REPORTER,
          text: 'motor mode',
        },
        '---',

        // System
        {
          opcode: 'isDaemonConnected',
          blockType: BlockType.BOOLEAN,
          text: 'daemon connected?',
        },
      ],
      menus: {
        headDirection: {
          acceptReporters: true,
          items: [
            { text: 'center', value: 'CENTER' },
            { text: 'up', value: 'UP' },
            { text: 'down', value: 'DOWN' },
            { text: 'left', value: 'LEFT' },
            { text: 'right', value: 'RIGHT' },
            { text: 'up left', value: 'UP_LEFT' },
            { text: 'up right', value: 'UP_RIGHT' },
            { text: 'down left', value: 'DOWN_LEFT' },
            { text: 'down right', value: 'DOWN_RIGHT' },
          ],
        },
        motorMode: {
          acceptReporters: true,
          items: [
            { text: 'enabled', value: 'enabled' },
            { text: 'disabled', value: 'disabled' },
            { text: 'gravity compensation', value: 'gravity_compensation' },
          ],
        },
      },
    };
  }

  // ==========================================================================
  // Block Implementations - Basic Movements
  // ==========================================================================

  /**
   * Wake up the robot
   */
  async wakeUp(): Promise<void> {
    try {
      const result = await apiClient.wakeUp();
      this.state.currentMoveUuid = result.uuid;
    } catch (error) {
      console.error('Failed to wake up robot:', error);
      throw error;
    }
  }

  /**
   * Put the robot to sleep
   */
  async gotoSleep(): Promise<void> {
    try {
      const result = await apiClient.gotoSleep();
      this.state.currentMoveUuid = result.uuid;
    } catch (error) {
      console.error('Failed to put robot to sleep:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Block Implementations - Head Control
  // ==========================================================================

  /**
   * Move head to a predefined direction
   */
  async moveHeadDirection(args: { DIRECTION: HeadDirection; DURATION: number }): Promise<void> {
    try {
      const direction = args.DIRECTION as HeadDirection;
      const duration = Math.max(0.1, Number(args.DURATION));
      const preset = HEAD_DIRECTION_PRESETS[direction];

      if (!preset) {
        throw new Error(`Invalid direction: ${direction}`);
      }

      const result = await apiClient.goto({
        head_pose: {
          x: 0,
          y: 0,
          z: 0,
          pitch: preset.pitch,
          yaw: preset.yaw,
          roll: preset.roll,
        },
        duration,
        interpolation: 'minjerk',
      });

      this.state.currentMoveUuid = result.uuid;
    } catch (error) {
      console.error('Failed to move head:', error);
      throw error;
    }
  }

  /**
   * Move head with custom angles (degrees input)
   */
  async moveHeadCustom(args: {
    PITCH: number;
    YAW: number;
    ROLL: number;
    DURATION: number;
  }): Promise<void> {
    try {
      const pitch = degToRad(Number(args.PITCH));
      const yaw = degToRad(Number(args.YAW));
      const roll = degToRad(Number(args.ROLL));
      const duration = Math.max(0.1, Number(args.DURATION));

      const result = await apiClient.goto({
        head_pose: {
          x: 0,
          y: 0,
          z: 0,
          pitch,
          yaw,
          roll,
        },
        duration,
        interpolation: 'minjerk',
      });

      this.state.currentMoveUuid = result.uuid;
    } catch (error) {
      console.error('Failed to move head with custom angles:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Block Implementations - Antenna Control
  // ==========================================================================

  /**
   * Move antennas individually (degrees input)
   */
  async moveAntennas(args: { LEFT: number; RIGHT: number; DURATION: number }): Promise<void> {
    try {
      const left = degToRad(Number(args.LEFT));
      const right = degToRad(Number(args.RIGHT));
      const duration = Math.max(0.1, Number(args.DURATION));

      const result = await apiClient.goto({
        antennas: [left, right],
        duration,
        interpolation: 'minjerk',
      });

      this.state.currentMoveUuid = result.uuid;
    } catch (error) {
      console.error('Failed to move antennas:', error);
      throw error;
    }
  }

  /**
   * Move both antennas symmetrically (degrees input)
   */
  async moveAntennasBoth(args: { ANGLE: number; DURATION: number }): Promise<void> {
    try {
      const angle = degToRad(Number(args.ANGLE));
      const duration = Math.max(0.1, Number(args.DURATION));

      const result = await apiClient.goto({
        antennas: [angle, angle],
        duration,
        interpolation: 'minjerk',
      });

      this.state.currentMoveUuid = result.uuid;
    } catch (error) {
      console.error('Failed to move both antennas:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Block Implementations - Motor Control
  // ==========================================================================

  /**
   * Set motor control mode
   */
  async setMotorMode(args: { MODE: MotorControlMode }): Promise<void> {
    try {
      const mode = args.MODE as MotorControlMode;
      await apiClient.setMotorMode(mode);
    } catch (error) {
      console.error('Failed to set motor mode:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Block Implementations - Reporter Blocks
  // ==========================================================================

  /**
   * Get current head pitch (degrees)
   */
  async getHeadPitch(): Promise<number> {
    try {
      await this.updateStateCache();
      return this.state.lastKnownState?.headPitch
        ? radToDeg(this.state.lastKnownState.headPitch)
        : 0;
    } catch (error) {
      console.error('Failed to get head pitch:', error);
      return 0;
    }
  }

  /**
   * Get current head yaw (degrees)
   */
  async getHeadYaw(): Promise<number> {
    try {
      await this.updateStateCache();
      return this.state.lastKnownState?.headYaw ? radToDeg(this.state.lastKnownState.headYaw) : 0;
    } catch (error) {
      console.error('Failed to get head yaw:', error);
      return 0;
    }
  }

  /**
   * Get current head roll (degrees)
   */
  async getHeadRoll(): Promise<number> {
    try {
      await this.updateStateCache();
      return this.state.lastKnownState?.headRoll ? radToDeg(this.state.lastKnownState.headRoll) : 0;
    } catch (error) {
      console.error('Failed to get head roll:', error);
      return 0;
    }
  }

  /**
   * Get current left antenna angle (degrees)
   */
  async getLeftAntenna(): Promise<number> {
    try {
      await this.updateStateCache();
      return this.state.lastKnownState?.leftAntenna
        ? radToDeg(this.state.lastKnownState.leftAntenna)
        : 0;
    } catch (error) {
      console.error('Failed to get left antenna angle:', error);
      return 0;
    }
  }

  /**
   * Get current right antenna angle (degrees)
   */
  async getRightAntenna(): Promise<number> {
    try {
      await this.updateStateCache();
      return this.state.lastKnownState?.rightAntenna
        ? radToDeg(this.state.lastKnownState.rightAntenna)
        : 0;
    } catch (error) {
      console.error('Failed to get right antenna angle:', error);
      return 0;
    }
  }

  /**
   * Get current body yaw (degrees)
   */
  async getBodyYaw(): Promise<number> {
    try {
      await this.updateStateCache();
      return this.state.lastKnownState?.bodyYaw ? radToDeg(this.state.lastKnownState.bodyYaw) : 0;
    } catch (error) {
      console.error('Failed to get body yaw:', error);
      return 0;
    }
  }

  /**
   * Get current motor mode
   */
  async getMotorMode(): Promise<string> {
    try {
      await this.updateStateCache();
      return this.state.lastKnownState?.motorMode ?? 'unknown';
    } catch (error) {
      console.error('Failed to get motor mode:', error);
      return 'unknown';
    }
  }

  // ==========================================================================
  // Block Implementations - System
  // ==========================================================================

  /**
   * Check if daemon is connected
   */
  async isDaemonConnected(): Promise<boolean> {
    try {
      const connected = await apiClient.ping();
      this.state.connectionStatus = connected ? 'connected' : 'disconnected';
      return connected;
    } catch (_error) {
      this.state.connectionStatus = 'error';
      return false;
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Updates the cached robot state
   */
  private async updateStateCache(): Promise<void> {
    try {
      const fullState = await apiClient.getFullState();
      const motorStatus = await apiClient.getMotorStatus();

      // Extract head pose
      const headPose = fullState.head_pose;
      let pitch = 0,
        yaw = 0,
        roll = 0;

      if (headPose && 'pitch' in headPose) {
        pitch = headPose.pitch ?? 0;
        yaw = headPose.yaw ?? 0;
        roll = headPose.roll ?? 0;
      }

      // Extract antenna positions
      const antennas = fullState.antennas_position ?? [0, 0];
      const leftAntenna = antennas[0] ?? 0;
      const rightAntenna = antennas[1] ?? 0;

      // Extract body yaw
      const bodyYaw = fullState.body_yaw ?? 0;

      // Update cache
      this.state.lastKnownState = {
        headPitch: pitch,
        headYaw: yaw,
        headRoll: roll,
        leftAntenna,
        rightAntenna,
        bodyYaw,
        motorMode: motorStatus.mode,
      };

      this.state.lastStateUpdate = Date.now();
      this.state.connectionStatus = 'connected';
    } catch (error) {
      console.error('Failed to update state cache:', error);
      this.state.connectionStatus = 'error';
      throw error;
    }
  }
}

// ============================================================================
// Scratch Extension API Types (from @turbowarp/types)
// ============================================================================

/**
 * Block type enum
 */
enum BlockType {
  COMMAND = 'command',
  REPORTER = 'reporter',
  BOOLEAN = 'Boolean',
}

/**
 * Argument type enum
 */
enum ArgumentType {
  NUMBER = 'number',
  STRING = 'string',
  BOOLEAN = 'Boolean',
}

/**
 * Extension info interface
 */
interface ExtensionInfo {
  id: string;
  name: string;
  color1?: string;
  color2?: string;
  color3?: string;
  blocks: (BlockDefinition | string)[];
  menus?: Record<string, MenuDefinition>;
}

/**
 * Block definition interface
 */
interface BlockDefinition {
  opcode: string;
  blockType: BlockType;
  text: string;
  arguments?: Record<string, ArgumentDefinition>;
}

/**
 * Argument definition interface
 */
interface ArgumentDefinition {
  type: ArgumentType;
  menu?: string;
  defaultValue?: string | number | boolean;
}

/**
 * Menu definition interface
 */
interface MenuDefinition {
  acceptReporters?: boolean;
  items: MenuItem[];
}

/**
 * Menu item interface
 */
interface MenuItem {
  text: string;
  value: string | number;
}
