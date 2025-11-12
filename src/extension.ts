/**
 * Reachy Mini TurboWarp Extension
 * Main extension class implementing Scratch extension interface
 */

import { apiClient } from './api/client.js';
import { degToRad, radToDeg } from './utils/angle.js';
import type { ExtensionState, HeadDirection, HeadDirectionPresets } from './types/extension.js';
import type { MotorControlMode } from './types/api.js';

// ============================================================================
// i18n helpers
// ============================================================================

const EN_MESSAGES = {
  'reachymini.extension.name': 'Reachy Mini',
  'reachymini.blocks.wakeUp': 'wake up robot',
  'reachymini.blocks.gotoSleep': 'put robot to sleep',
  'reachymini.blocks.moveHeadDirection': 'move head [DIRECTION] for [DURATION] seconds',
  'reachymini.blocks.moveHeadCustom':
    'move head pitch [PITCH]° yaw [YAW]° roll [ROLL]° for [DURATION]s',
  'reachymini.blocks.moveAntennas': 'move antennas left [LEFT]° right [RIGHT]° for [DURATION]s',
  'reachymini.blocks.moveAntennasBoth': 'move both antennas [ANGLE]° for [DURATION]s',
  'reachymini.blocks.setMotorMode': 'set motor mode [MODE]',
  'reachymini.blocks.getHeadPitch': 'head pitch (degrees)',
  'reachymini.blocks.getHeadYaw': 'head yaw (degrees)',
  'reachymini.blocks.getHeadRoll': 'head roll (degrees)',
  'reachymini.blocks.getLeftAntenna': 'left antenna angle (degrees)',
  'reachymini.blocks.getRightAntenna': 'right antenna angle (degrees)',
  'reachymini.blocks.getBodyYaw': 'body yaw (degrees)',
  'reachymini.blocks.getMotorMode': 'motor mode',
  'reachymini.blocks.isDaemonConnected': 'daemon connected?',
  'reachymini.menus.headDirection.center': 'center',
  'reachymini.menus.headDirection.up': 'up',
  'reachymini.menus.headDirection.down': 'down',
  'reachymini.menus.headDirection.left': 'left',
  'reachymini.menus.headDirection.right': 'right',
  'reachymini.menus.headDirection.upLeft': 'up left',
  'reachymini.menus.headDirection.upRight': 'up right',
  'reachymini.menus.headDirection.downLeft': 'down left',
  'reachymini.menus.headDirection.downRight': 'down right',
  'reachymini.menus.motorMode.enabled': 'enabled',
  'reachymini.menus.motorMode.disabled': 'disabled',
  'reachymini.menus.motorMode.gravityComp': 'gravity compensation',
} as const;

type MessageId = keyof typeof EN_MESSAGES;

const JA_MESSAGES: Record<MessageId, string> = {
  'reachymini.extension.name': 'Reachy Mini',
  'reachymini.blocks.wakeUp': 'ロボットを起こす',
  'reachymini.blocks.gotoSleep': 'ロボットを寝かせる',
  'reachymini.blocks.moveHeadDirection': '頭を [DIRECTION] に [DURATION] 秒動かす',
  'reachymini.blocks.moveHeadCustom':
    '頭を pitch [PITCH]° yaw [YAW]° roll [ROLL]° で [DURATION] 秒動かす',
  'reachymini.blocks.moveAntennas': 'アンテナを 左 [LEFT]° 右 [RIGHT]° で [DURATION] 秒動かす',
  'reachymini.blocks.moveAntennasBoth': '両方のアンテナを [ANGLE]° で [DURATION] 秒動かす',
  'reachymini.blocks.setMotorMode': 'モーターを [MODE] モードにする',
  'reachymini.blocks.getHeadPitch': '頭のピッチ角 (度)',
  'reachymini.blocks.getHeadYaw': '頭のヨー角 (度)',
  'reachymini.blocks.getHeadRoll': '頭のロール角 (度)',
  'reachymini.blocks.getLeftAntenna': '左アンテナ角度 (度)',
  'reachymini.blocks.getRightAntenna': '右アンテナ角度 (度)',
  'reachymini.blocks.getBodyYaw': '胴体のヨー角 (度)',
  'reachymini.blocks.getMotorMode': 'モード',
  'reachymini.blocks.isDaemonConnected': 'デーモン接続中？',
  'reachymini.menus.headDirection.center': 'まんなか',
  'reachymini.menus.headDirection.up': 'うえ',
  'reachymini.menus.headDirection.down': 'した',
  'reachymini.menus.headDirection.left': 'ひだり',
  'reachymini.menus.headDirection.right': 'みぎ',
  'reachymini.menus.headDirection.upLeft': 'うえ ひだり',
  'reachymini.menus.headDirection.upRight': 'うえ みぎ',
  'reachymini.menus.headDirection.downLeft': 'した ひだり',
  'reachymini.menus.headDirection.downRight': 'した みぎ',
  'reachymini.menus.motorMode.enabled': 'オン',
  'reachymini.menus.motorMode.disabled': 'オフ',
  'reachymini.menus.motorMode.gravityComp': '重力補償',
};

const TRANSLATIONS: Record<'en' | 'ja', Record<MessageId, string>> = {
  en: EN_MESSAGES,
  ja: JA_MESSAGES,
};

type ScratchTranslate = {
  (message: string, variables?: Record<string, string>): string;
  setup?: (translations: Record<string, Record<string, string>>) => void;
  language?: string;
};

type ScratchGlobal = {
  translate?: ScratchTranslate;
  vm?: {
    runtime?: {
      getLocale?: () => string;
    };
  };
};

const getScratch = (): ScratchGlobal | undefined =>
  (globalThis as { Scratch?: ScratchGlobal }).Scratch;

const setupTranslations = (): void => {
  const scratch = getScratch();
  if (!scratch || typeof scratch.translate !== 'function') {
    return;
  }

  const translateFn = scratch.translate;
  const currentLanguage = translateFn.language ?? 'unknown';
  const runtimeLocale = scratch.vm?.runtime?.getLocale?.();
  console.warn('[ReachyMiniExtension] Translation setup', {
    scratchTranslateLanguage: currentLanguage,
    runtimeLocale: runtimeLocale ?? 'unavailable',
  });

  if (typeof translateFn.setup === 'function') {
    translateFn.setup(TRANSLATIONS);
  }
};

const resolveLocale = (): keyof typeof TRANSLATIONS => {
  const scratch = getScratch();
  const runtimeLocale = scratch?.vm?.runtime?.getLocale?.();
  if (runtimeLocale && runtimeLocale in TRANSLATIONS) {
    return runtimeLocale as keyof typeof TRANSLATIONS;
  }

  const translatorLocale = scratch?.translate?.language;
  if (translatorLocale && translatorLocale in TRANSLATIONS) {
    return translatorLocale as keyof typeof TRANSLATIONS;
  }

  return 'en';
};

const formatMessage = (id: MessageId): string => {
  const locale = resolveLocale();
  const messages = TRANSLATIONS[locale] ?? EN_MESSAGES;
  return messages[id] ?? EN_MESSAGES[id];
};

// ============================================================================
// Constants
// ============================================================================

/**
 * Head direction presets (in radians)
 * NOTE: Actual robot coordinate system is inverted from documentation
 * - Negative pitch: look up
 * - Positive pitch: look down
 */
const HEAD_DIRECTION_PRESETS: HeadDirectionPresets = {
  UP: { pitch: -0.3, yaw: 0, roll: 0 },
  DOWN: { pitch: 0.3, yaw: 0, roll: 0 },
  LEFT: { pitch: 0, yaw: 0.5, roll: 0 },
  RIGHT: { pitch: 0, yaw: -0.5, roll: 0 },
  UP_LEFT: { pitch: -0.3, yaw: 0.5, roll: 0 },
  UP_RIGHT: { pitch: -0.3, yaw: -0.5, roll: 0 },
  DOWN_LEFT: { pitch: 0.3, yaw: 0.5, roll: 0 },
  DOWN_RIGHT: { pitch: 0.3, yaw: -0.5, roll: 0 },
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
    setupTranslations();

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
      name: formatMessage('reachymini.extension.name'),
      color1: '#4C97FF',
      color2: '#3373CC',
      color3: '#2E5BA6',
      blocks: [
        // Basic movements
        {
          opcode: 'wakeUp',
          blockType: 'command',
          text: formatMessage('reachymini.blocks.wakeUp'),
        },
        {
          opcode: 'gotoSleep',
          blockType: 'command',
          text: formatMessage('reachymini.blocks.gotoSleep'),
        },
        '---',

        // Head control - simple
        {
          opcode: 'moveHeadDirection',
          blockType: 'command',
          text: formatMessage('reachymini.blocks.moveHeadDirection'),
          arguments: {
            DIRECTION: {
              type: 'string',
              menu: 'headDirection',
              defaultValue: 'CENTER',
            },
            DURATION: {
              type: 'number',
              defaultValue: 2,
            },
          },
        },

        // Head control - custom
        {
          opcode: 'moveHeadCustom',
          blockType: 'command',
          text: formatMessage('reachymini.blocks.moveHeadCustom'),
          arguments: {
            PITCH: {
              type: 'number',
              defaultValue: 0,
            },
            YAW: {
              type: 'number',
              defaultValue: 0,
            },
            ROLL: {
              type: 'number',
              defaultValue: 0,
            },
            DURATION: {
              type: 'number',
              defaultValue: 2,
            },
          },
        },
        '---',

        // Antenna control
        {
          opcode: 'moveAntennas',
          blockType: 'command',
          text: formatMessage('reachymini.blocks.moveAntennas'),
          arguments: {
            LEFT: {
              type: 'number',
              defaultValue: 0,
            },
            RIGHT: {
              type: 'number',
              defaultValue: 0,
            },
            DURATION: {
              type: 'number',
              defaultValue: 2,
            },
          },
        },
        {
          opcode: 'moveAntennasBoth',
          blockType: 'command',
          text: formatMessage('reachymini.blocks.moveAntennasBoth'),
          arguments: {
            ANGLE: {
              type: 'number',
              defaultValue: 0,
            },
            DURATION: {
              type: 'number',
              defaultValue: 2,
            },
          },
        },
        '---',

        // Motor control
        {
          opcode: 'setMotorMode',
          blockType: 'command',
          text: formatMessage('reachymini.blocks.setMotorMode'),
          arguments: {
            MODE: {
              type: 'string',
              menu: 'motorMode',
              defaultValue: 'enabled',
            },
          },
        },
        '---',

        // Reporter blocks (getters)
        {
          opcode: 'getHeadPitch',
          blockType: 'reporter',
          text: formatMessage('reachymini.blocks.getHeadPitch'),
        },
        {
          opcode: 'getHeadYaw',
          blockType: 'reporter',
          text: formatMessage('reachymini.blocks.getHeadYaw'),
        },
        {
          opcode: 'getHeadRoll',
          blockType: 'reporter',
          text: formatMessage('reachymini.blocks.getHeadRoll'),
        },
        {
          opcode: 'getLeftAntenna',
          blockType: 'reporter',
          text: formatMessage('reachymini.blocks.getLeftAntenna'),
        },
        {
          opcode: 'getRightAntenna',
          blockType: 'reporter',
          text: formatMessage('reachymini.blocks.getRightAntenna'),
        },
        {
          opcode: 'getBodyYaw',
          blockType: 'reporter',
          text: formatMessage('reachymini.blocks.getBodyYaw'),
        },
        {
          opcode: 'getMotorMode',
          blockType: 'reporter',
          text: formatMessage('reachymini.blocks.getMotorMode'),
        },
        '---',

        // System
        {
          opcode: 'isDaemonConnected',
          blockType: 'Boolean',
          text: formatMessage('reachymini.blocks.isDaemonConnected'),
        },
      ],
      menus: {
        headDirection: {
          acceptReporters: true,
          items: [
            { text: formatMessage('reachymini.menus.headDirection.center'), value: 'CENTER' },
            { text: formatMessage('reachymini.menus.headDirection.up'), value: 'UP' },
            { text: formatMessage('reachymini.menus.headDirection.down'), value: 'DOWN' },
            { text: formatMessage('reachymini.menus.headDirection.left'), value: 'LEFT' },
            { text: formatMessage('reachymini.menus.headDirection.right'), value: 'RIGHT' },
            { text: formatMessage('reachymini.menus.headDirection.upLeft'), value: 'UP_LEFT' },
            { text: formatMessage('reachymini.menus.headDirection.upRight'), value: 'UP_RIGHT' },
            { text: formatMessage('reachymini.menus.headDirection.downLeft'), value: 'DOWN_LEFT' },
            {
              text: formatMessage('reachymini.menus.headDirection.downRight'),
              value: 'DOWN_RIGHT',
            },
          ],
        },
        motorMode: {
          acceptReporters: true,
          items: [
            { text: formatMessage('reachymini.menus.motorMode.enabled'), value: 'enabled' },
            { text: formatMessage('reachymini.menus.motorMode.disabled'), value: 'disabled' },
            {
              text: formatMessage('reachymini.menus.motorMode.gravityComp'),
              value: 'gravity_compensation',
            },
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
// Scratch Extension API Types
// ============================================================================

/**
 * Block type literal
 */
type BlockType = 'command' | 'reporter' | 'Boolean';

/**
 * Argument type literal
 */
type ArgumentType = 'number' | 'string' | 'Boolean';

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
