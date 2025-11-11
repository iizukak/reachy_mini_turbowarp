import { describe, test, expect } from 'vitest';
import { degToRad, radToDeg } from '../../../src/utils/angle.js';

describe('Angle Conversion Utilities', () => {
  describe('degToRad', () => {
    test('should convert 0 degrees to 0 radians', () => {
      expect(degToRad(0)).toBe(0);
    });

    test('should convert 90 degrees to PI/2 radians', () => {
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
    });

    test('should convert 180 degrees to PI radians', () => {
      expect(degToRad(180)).toBeCloseTo(Math.PI);
    });

    test('should convert 270 degrees to 3*PI/2 radians', () => {
      expect(degToRad(270)).toBeCloseTo((3 * Math.PI) / 2);
    });

    test('should convert 360 degrees to 2*PI radians', () => {
      expect(degToRad(360)).toBeCloseTo(2 * Math.PI);
    });

    test('should convert negative angles correctly', () => {
      expect(degToRad(-90)).toBeCloseTo(-Math.PI / 2);
      expect(degToRad(-180)).toBeCloseTo(-Math.PI);
    });

    test('should handle decimal degrees', () => {
      expect(degToRad(45.5)).toBeCloseTo(0.7941248);
    });
  });

  describe('radToDeg', () => {
    test('should convert 0 radians to 0 degrees', () => {
      expect(radToDeg(0)).toBe(0);
    });

    test('should convert PI/2 radians to 90 degrees', () => {
      expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
    });

    test('should convert PI radians to 180 degrees', () => {
      expect(radToDeg(Math.PI)).toBeCloseTo(180);
    });

    test('should convert 3*PI/2 radians to 270 degrees', () => {
      expect(radToDeg((3 * Math.PI) / 2)).toBeCloseTo(270);
    });

    test('should convert 2*PI radians to 360 degrees', () => {
      expect(radToDeg(2 * Math.PI)).toBeCloseTo(360);
    });

    test('should convert negative angles correctly', () => {
      expect(radToDeg(-Math.PI / 2)).toBeCloseTo(-90);
      expect(radToDeg(-Math.PI)).toBeCloseTo(-180);
    });

    test('should handle decimal radians', () => {
      expect(radToDeg(1)).toBeCloseTo(57.29577951);
    });
  });

  describe('Round-trip conversion', () => {
    test('should preserve value after deg->rad->deg conversion', () => {
      const originalDegrees = 45;
      const radians = degToRad(originalDegrees);
      const backToDegrees = radToDeg(radians);
      expect(backToDegrees).toBeCloseTo(originalDegrees);
    });

    test('should preserve value after rad->deg->rad conversion', () => {
      const originalRadians = Math.PI / 3;
      const degrees = radToDeg(originalRadians);
      const backToRadians = degToRad(degrees);
      expect(backToRadians).toBeCloseTo(originalRadians);
    });

    test('should handle multiple round-trips correctly', () => {
      let value = 120;
      // deg -> rad -> deg -> rad -> deg
      value = radToDeg(degToRad(value));
      value = radToDeg(degToRad(value));
      expect(value).toBeCloseTo(120);
    });
  });

  describe('Edge cases', () => {
    test('should handle very small angles', () => {
      expect(degToRad(0.001)).toBeCloseTo(0.000017453);
      expect(radToDeg(0.001)).toBeCloseTo(0.057296);
    });

    test('should handle very large angles', () => {
      expect(degToRad(720)).toBeCloseTo(4 * Math.PI);
      expect(radToDeg(10 * Math.PI)).toBeCloseTo(1800);
    });
  });
});
