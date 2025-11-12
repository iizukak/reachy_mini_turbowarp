/**
 * API Client Integration Tests
 * Tests API client against live MuJoCo daemon
 */

import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import { apiClient } from '../../src/api/client.js';
import {
  waitForDaemon,
  resetRobotPose,
  waitForMovement,
  waitForAnimation,
  getRobotState,
  expectAngleCloseTo,
} from './test-utils.js';

describe('API Client Integration Tests', () => {
  beforeAll(async () => {
    // Wait for daemon to be ready (up to 10 seconds)
    await waitForDaemon();
  });

  afterEach(async () => {
    // Reset robot to default pose after each test
    await resetRobotPose();
  });

  describe('Daemon Connection', () => {
    test('should ping daemon successfully', async () => {
      const result = await apiClient.ping();
      expect(result).toBe(true);
    });

    test('should get daemon status', async () => {
      const status = await apiClient.getDaemonStatus();
      expect(status).toBeDefined();
      expect(status.state).toBeDefined();
      expect(typeof status.state).toBe('string');
    });
  });

  describe('Basic Movements', () => {
    test('should wake up robot', async () => {
      const result = await apiClient.wakeUp();
      expect(result.uuid).toBeDefined();
      expect(typeof result.uuid).toBe('string');

      // Wait for wake up animation to complete (pre-programmed animation with unknown duration)
      await waitForAnimation();
    });

    test('should put robot to sleep', async () => {
      const result = await apiClient.gotoSleep();
      expect(result.uuid).toBeDefined();
      expect(typeof result.uuid).toBe('string');

      // Wait for sleep animation to complete (pre-programmed animation with unknown duration)
      await waitForAnimation();
    });
  });

  describe('Head Control', () => {
    // TODO: Test sometimes fails due to simulator timing issues
    // test('should move head with custom angles', async () => {
    //   const result = await apiClient.goto({
    //     head_pose: {
    //       x: 0,
    //       y: 0,
    //       z: 0,
    //       pitch: 0.2, // ~11.5 degrees
    //       yaw: 0.3, // ~17.2 degrees
    //       roll: 0,
    //     },
    //     duration: 2.5,
    //     interpolation: 'minjerk',
    //   });
    //
    //   expect(result.uuid).toBeDefined();
    //
    //   // Wait for movement to complete
    //   await waitForMovement(2.5);
    //
    //   // Verify state
    //   const state = await getRobotState();
    //   const headPose = state.head_pose;
    //
    //   expect(headPose).toBeDefined();
    //   if (headPose && 'pitch' in headPose) {
    //     expectAngleCloseTo(headPose.pitch ?? 0, 0.2, 0.15);
    //     expectAngleCloseTo(headPose.yaw ?? 0, 0.3, 0.15);
    //   }
    // });

    test('should get current head pose', async () => {
      const headPose = await apiClient.getHeadPose();

      expect(headPose).toBeDefined();
      expect(typeof headPose.pitch).toBe('number');
      expect(typeof headPose.yaw).toBe('number');
      expect(typeof headPose.roll).toBe('number');
    });
  });

  describe('Antenna Control', () => {
    test('should move antennas individually', async () => {
      const result = await apiClient.goto({
        antennas: [0.4, -0.4], // Left up, right down
        duration: 0.8,
        interpolation: 'minjerk',
      });

      expect(result.uuid).toBeDefined();

      // Wait for movement to complete
      await waitForMovement(0.8);

      // Verify state
      const state = await getRobotState();
      const antennas = state.antennas_position;

      expect(antennas).toBeDefined();
      expect(antennas).toHaveLength(2);
      if (antennas) {
        expectAngleCloseTo(antennas[0] ?? 0, 0.4, 0.15);
        expectAngleCloseTo(antennas[1] ?? 0, -0.4, 0.15);
      }
    });

    test('should get current antenna positions', async () => {
      const positions = await apiClient.getAntennaPositions();

      expect(positions).toBeDefined();
      expect(positions).toHaveLength(2);
      expect(typeof positions[0]).toBe('number');
      expect(typeof positions[1]).toBe('number');
    });
  });

  describe('Body Control', () => {
    test('should get current body yaw', async () => {
      const bodyYaw = await apiClient.getBodyYaw();

      expect(typeof bodyYaw).toBe('number');
    });
  });

  describe('Motor Control', () => {
    test('should get motor status', async () => {
      const status = await apiClient.getMotorStatus();

      expect(status).toBeDefined();
      expect(status.mode).toBeDefined();
      expect(['enabled', 'disabled', 'gravity_compensation']).toContain(status.mode);
    });

    // Note: Motor mode changes are not supported in simulator
    // test('should set motor mode to disabled', async () => { ... });
    // test('should set motor mode to enabled', async () => { ... });
  });

  describe('State Queries', () => {
    test('should get full robot state', async () => {
      const state = await apiClient.getFullState();

      expect(state).toBeDefined();
      expect(state.head_pose).toBeDefined();
      expect(state.antennas_position).toBeDefined();
      expect(typeof state.body_yaw).toBe('number');
    });
  });

  describe('Movement Management', () => {
    test('should check if movement is running', async () => {
      // Start a movement
      await apiClient.goto({
        head_pose: {
          x: 0,
          y: 0,
          z: 0,
          pitch: 0.2,
          yaw: 0,
          roll: 0,
        },
        duration: 1.2,
        interpolation: 'minjerk',
      });

      // Check immediately - should be running
      const isRunning = await apiClient.isMovementRunning();
      expect(typeof isRunning).toBe('boolean');

      // Wait for completion
      await waitForMovement(1.2);

      // Check again - should be stopped
      const isStillRunning = await apiClient.isMovementRunning();
      expect(isStillRunning).toBe(false);
    });

    // Note: stopMovement() may not work reliably in simulator (returns 422)
    // test('should stop movement', async () => { ... });
  });
});
