import React, { useState, useEffect } from 'react';
import { Footprints, Utensils, Droplets, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodaySteps, getTodayNutrition, getTodayHydration, calculateGrowthIndex, getGrowthTrend } from '../utils/storage.js';

export default function HomeWidget() {
    const [activeSlide, setActiveSlide] = useState(0);
    const [data, setData] = useState({
        steps: getTodaySteps(),
        nutrition: getTodayNutrition(),
        hydration: getTodayHydration(),
        growth: calculateGrowthIndex(),
        trend: getGrowthTrend()
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setData({
                steps: getTodaySteps(),
                nutrition: getTodayNutrition(),
                hydration: getTodayHydration(),
                growth: calculateGrowthIndex(),
                trend: getGrowthTrend()
            });
        }, 10000); // UI Refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const slides = [
        {
            id: 'steps',
            title: 'Steps Counter',
            icon: Footprints,
            value: data.steps.count,
            goal: 10000,
            unit: 'steps',
            color: '#4f8cff',
            detail: `${Math.round((data.steps.count / 10000) * 100)}% of goal`
        },
        {
            id: 'nutrition',
            title: 'Nutrition Summary',
            icon: Utensils,
            value: data.nutrition.calories,
            goal: 2200,
            unit: 'kcal',
            color: '#ff9100',
            detail: `${data.nutrition.protein}g P • ${data.nutrition.carbs}g C • ${data.nutrition.fats}g F`
        },
        {
            id: 'hydration',
            title: 'Hydration Progress',
            icon: Droplets,
            value: data.hydration.glasses,
            goal: 8,
            unit: 'glasses',
            color: '#00d4ff',
            detail: `${8 - data.hydration.glasses} glasses to go`
        },
        {
            id: 'growth',
            title: 'Growth Index',
            icon: TrendingUp,
            value: data.growth.growthIndex,
            goal: 100,
            unit: 'points',
            color: '#00e676',
            detail: `7-day trend: ${data.trend.improved ? '+' : '-'}${data.trend.value}%`
        }
    ];

    const nextSlide = () => {
        if (activeSlide < slides.length - 1) setActiveSlide(activeSlide + 1);
    };

    const prevSlide = () => {
        if (activeSlide > 0) setActiveSlide(activeSlide - 1);
    };

    return (
        <div className="home-widget-container">
            <div className="widget-slides" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
                {slides.map((slide, index) => (
                    <div key={slide.id} className="widget-slide">
                        <div className="widget-card" style={{ borderLeft: `4px solid ${slide.color}` }}>
                            <div className="widget-header">
                                <div className="widget-icon-box" style={{ background: `${slide.color}15` }}>
                                    <slide.icon size={20} style={{ color: slide.color }} />
                                </div>
                                <span className="widget-title">{slide.title}</span>
                                <div className="widget-trend">
                                    <TrendingUp size={14} style={{ color: '#00e676' }} />
                                </div>
                            </div>

                            <div className="widget-content">
                                <div className="widget-main-value">
                                    <span className="value-num">{slide.value.toLocaleString()}</span>
                                    <span className="value-unit">{slide.unit}</span>
                                </div>

                                <div className="widget-progress-container">
                                    <div className="widget-progress-bar">
                                        <div
                                            className="widget-progress-fill"
                                            style={{
                                                width: `${Math.min(100, (slide.value / slide.goal) * 100)}%`,
                                                background: slide.color
                                            }}
                                        />
                                    </div>
                                    <span className="widget-detail">{slide.detail}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="widget-controls">
                <button
                    onClick={prevSlide}
                    className="widget-control-btn"
                    style={{ opacity: activeSlide === 0 ? 0.3 : 1, cursor: activeSlide === 0 ? 'default' : 'pointer' }}
                    disabled={activeSlide === 0}
                >
                    <ChevronLeft size={16} />
                </button>
                <div className="widget-dots">
                    {slides.map((_, i) => (
                        <div
                            key={i}
                            className={`widget-dot ${activeSlide === i ? 'active' : ''}`}
                            onClick={() => setActiveSlide(i)}
                        />
                    ))}
                </div>
                <button
                    onClick={nextSlide}
                    className="widget-control-btn"
                    style={{ opacity: activeSlide === slides.length - 1 ? 0.3 : 1, cursor: activeSlide === slides.length - 1 ? 'default' : 'pointer' }}
                    disabled={activeSlide === slides.length - 1}
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            <style>{`
                .home-widget-container {
                    position: relative;
                    width: 100%;
                    overflow: hidden;
                    border-radius: 20px;
                    background: var(--bg-card);
                    margin-bottom: 20px;
                    box-shadow: var(--shadow-sm);
                }
                .widget-slides {
                    display: flex;
                    transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .widget-slide {
                    min-width: 100%;
                    padding: 4px;
                }
                .widget-card {
                    padding: 16px;
                    background: var(--bg-card);
                    border-radius: 16px;
                }
                .widget-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                }
                .widget-icon-box {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .widget-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-secondary);
                    flex: 1;
                }
                .widget-main-value {
                    display: flex;
                    align-items: baseline;
                    gap: 6px;
                    margin-bottom: 12px;
                }
                .value-num {
                    font-size: 32px;
                    font-weight: 800;
                    font-family: var(--font-display);
                    color: var(--text-primary);
                }
                .value-unit {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-muted);
                }
                .widget-progress-bar {
                    height: 8px;
                    background: var(--bg-elevated);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 8px;
                }
                .widget-progress-fill {
                    height: 100%;
                    border-radius: 4px;
                    transition: width 1s ease-out;
                }
                .widget-detail {
                    font-size: 12px;
                    color: var(--text-muted);
                    font-weight: 500;
                }
                .widget-controls {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 16px 12px;
                }
                .widget-control-btn {
                    background: none;
                    border: none;
                    color: var(--text-muted);
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                }
                .widget-dots {
                    display: flex;
                    gap: 6px;
                }
                .widget-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--border-subtle);
                    transition: all 0.3s ease;
                    cursor: pointer;
                }
                .widget-dot.active {
                    width: 18px;
                    border-radius: 3px;
                    background: var(--accent-blue);
                }
            `}</style>
        </div>
    );
}
