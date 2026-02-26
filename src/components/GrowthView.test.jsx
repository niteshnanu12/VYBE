import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GrowthView from './GrowthView';
import * as storage from '../utils/storage';
import * as algorithms from '../utils/algorithms';

// Mock dependencies
vi.mock('../utils/storage', () => ({
    calculateGrowthIndex: vi.fn(),
    getWeeklyGrowth: vi.fn(),
    getGrowthTrend: vi.fn(),
}));

vi.mock('../utils/algorithms', () => ({
    getScoreColor: vi.fn(),
    getScoreLabel: vi.fn(),
}));

describe('GrowthView', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('renders correctly with default mocked values', () => {
        storage.calculateGrowthIndex.mockReturnValue({
            growthIndex: 85,
            activityConsistency: 90,
            sleepScore: 80,
            nutritionScore: 85,
            hydrationScore: 100
        });

        storage.getWeeklyGrowth.mockReturnValue([
            { day: 'Mon', growthIndex: 80, isToday: false },
            { day: 'Tue', growthIndex: 85, isToday: true },
        ]);

        storage.getGrowthTrend.mockReturnValue({
            improved: true,
            value: 5
        });

        algorithms.getScoreColor.mockReturnValue('#00e676');
        algorithms.getScoreLabel.mockReturnValue('Excellent');

        render(<GrowthView />);

        // Assert main elements
        expect(screen.getByText('Phase 2 Analysis')).toBeInTheDocument();
        expect(screen.getByText('Growth Index 📈')).toBeInTheDocument();

        // Check score
        expect(screen.getAllByText('85').length).toBeGreaterThan(0);
        expect(screen.getByText('Excellent')).toBeInTheDocument();

        // Check trend
        expect(screen.getByText('▲ 5%')).toBeInTheDocument();

        // Check pillars section
        expect(screen.getByText('Growth Pillars')).toBeInTheDocument();

        // Check pillars values
        expect(screen.getByText('90%')).toBeInTheDocument(); // Activity
        expect(screen.getByText('80%')).toBeInTheDocument(); // Sleep

        // Check weekly trends
        expect(screen.getByText('7-Day Consistency')).toBeInTheDocument();
        expect(screen.getByText('Mon')).toBeInTheDocument();
        expect(screen.getByText('Tue')).toBeInTheDocument();
    });

    it('displays a downward trend if not improved', () => {
        storage.calculateGrowthIndex.mockReturnValue({
            growthIndex: 65,
            activityConsistency: 50,
            sleepScore: 60,
            nutritionScore: 70,
            hydrationScore: 80
        });

        storage.getWeeklyGrowth.mockReturnValue([]);

        storage.getGrowthTrend.mockReturnValue({
            improved: false,
            value: 10
        });

        algorithms.getScoreColor.mockReturnValue('#ffd740');
        algorithms.getScoreLabel.mockReturnValue('Good');

        render(<GrowthView />);

        expect(screen.getByText('▼ 10%')).toBeInTheDocument();
    });
});
