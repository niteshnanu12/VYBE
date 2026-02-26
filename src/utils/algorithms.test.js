import { describe, it, expect } from 'vitest';
import {
    calculateCaloriesFromSteps,
    calculateDistance,
    calculateBMI,
    getBMICategory,
    getScoreColor
} from './algorithms';

describe('Algorithms Utility', () => {
    describe('calculateCaloriesFromSteps', () => {
        it('should calculate calories correctly based on defaults', () => {
            // 10000 steps * 0.000762 km/step * 70 kg * 3.5 MET / 10 = 186.69 => 187
            expect(calculateCaloriesFromSteps(10000)).toBe(187);
        });

        it('should calculate calories with custom weight and MET', () => {
            // 5000 steps * 0.000762 * 80 * 4.0 / 10 = 121.92 => 122
            expect(calculateCaloriesFromSteps(5000, 80, 4.0)).toBe(122);
        });
    });

    describe('calculateDistance', () => {
        it('should calculate distance correctly', () => {
            // 10000 steps * (170 * 0.415 / 100) / 1000 = 7.055 => 7.05 (due to JS floating point precision)
            expect(calculateDistance(10000)).toBeCloseTo(7.05);
        });

        it('should calculate distance with custom height', () => {
            // 10000 steps * (180 * 0.415 / 100) / 1000 = 7.47
            expect(calculateDistance(10000, 180)).toBeCloseTo(7.47);
        });
    });

    describe('calculateBMI', () => {
        it('should calculate BMI correctly', () => {
            // 70 / (1.7 * 1.7) = 24.22 => 24.2
            expect(calculateBMI(70, 170)).toBe(24.2);
        });

        it('should return null if weight or height is missing', () => {
            expect(calculateBMI(null, 170)).toBeNull();
            expect(calculateBMI(70, null)).toBeNull();
        });
    });

    describe('getBMICategory', () => {
        it('should return correct categories', () => {
            expect(getBMICategory(18)).toBe('Underweight');
            expect(getBMICategory(22)).toBe('Normal Weight');
            expect(getBMICategory(27)).toBe('Overweight');
            expect(getBMICategory(32)).toBe('Obese');
            expect(getBMICategory(null)).toBe('Unknown');
        });
    });

    describe('getScoreColor', () => {
        it('should return correct colors for scores', () => {
            expect(getScoreColor(85)).toBe('#00e676');
            expect(getScoreColor(65)).toBe('#ffd740');
            expect(getScoreColor(45)).toBe('#ff9100');
            expect(getScoreColor(20)).toBe('#ff4757');
        });
    });
});
