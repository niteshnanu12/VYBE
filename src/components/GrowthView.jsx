import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Moon, Utensils, Droplets, Info, ChevronRight, Share2, Award } from 'lucide-react';
import ProgressRing from './ProgressRing.jsx';
import { getWeeklyGrowth, calculateGrowthIndex, getGrowthTrend } from '../utils/storage.js';
import { getScoreColor, getScoreLabel } from '../utils/algorithms.js';

export default function GrowthView() {
    const [growth, setGrowth] = useState(calculateGrowthIndex());
    const [weeklyGrowth, setWeeklyGrowth] = useState(getWeeklyGrowth());
    const [trend, setTrend] = useState(getGrowthTrend());

    useEffect(() => {
        setGrowth(calculateGrowthIndex());
        setWeeklyGrowth(getWeeklyGrowth());
        setTrend(getGrowthTrend());
    }, []);

    const pillars = [
        { label: 'Activity', value: growth.activityConsistency, color: '#4f8cff', icon: Target, weight: '30%' },
        { label: 'Sleep', value: growth.sleepScore, color: '#b388ff', icon: Moon, weight: '30%' },
        { label: 'Nutrition', value: growth.nutritionScore, color: '#ff9100', icon: Utensils, weight: '20%' },
        { label: 'Hydration', value: growth.hydrationScore, color: '#00d4ff', icon: Droplets, weight: '20%' },
    ];

    return (
        <div className="growth-container">
            <div className="page-header">
                <div>
                    <p className="greeting-text">Phase 2 Analysis</p>
                    <h1 className="greeting-name">Growth Index 📈</h1>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="icon-btn-secondary"><Share2 size={18} /></button>
                </div>
            </div>

            {/* Overall Score Card */}
            <div className="hero-card" style={{ textAlign: 'center', marginBottom: 24, padding: '32px 20px' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <ProgressRing size={160} strokeWidth={10} progress={growth.growthIndex} color={getScoreColor(growth.growthIndex)}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 44, fontWeight: 800, color: getScoreColor(growth.growthIndex), fontFamily: 'var(--font-display)' }}>
                                {growth.growthIndex}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '1px' }}>VYBE SCORE</div>
                        </div>
                    </ProgressRing>

                    <div style={{
                        position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
                        background: 'var(--bg-elevated)', padding: '6px 14px', borderRadius: 20,
                        border: '1px solid var(--border-subtle)', whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 6
                    }}>
                        <span style={{
                            fontSize: 12, fontWeight: 700,
                            color: trend.improved ? 'var(--accent-green)' : 'var(--accent-red)'
                        }}>
                            {trend.improved ? '▲' : '▼'} {trend.value}%
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>vs last avg</span>
                    </div>
                </div>

                <div style={{ marginTop: 32 }}>
                    <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{getScoreLabel(growth.growthIndex)}</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        Your lifestyle consistency is {(growth.growthIndex / 100 * 100).toFixed(0)}%.
                        {growth.growthIndex > 70 ? " You're in the elite tier! Keep maintaining this VYBE." : " Consistency in sleep and activity will yield the biggest gains."}
                    </p>
                </div>
            </div>

            {/* Growth Pillars */}
            <div className="section">
                <div className="section-header">
                    <h3 className="section-title">Growth Pillars</h3>
                    <div className="stat-badge" style={{ fontSize: 10 }}>Algorithm V2.1</div>
                </div>
                <div className="pillar-grid">
                    {pillars.map((pillar, i) => (
                        <div key={i} className="card pillar-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 12,
                                    background: `${pillar.color}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <pillar.icon size={20} style={{ color: pillar.color }} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{pillar.weight}</span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{pillar.label}</div>
                            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>{pillar.value}%</div>
                            <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', width: `${pillar.value}%`,
                                    background: pillar.color, borderRadius: 3,
                                    transition: 'width 1.2s ease-out'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 7-Day Performance Trend */}
            <div className="section">
                <div className="section-header">
                    <h3 className="section-title">7-Day Consistency</h3>
                </div>
                <div className="card">
                    <div className="weekly-bars" style={{ height: 120, padding: '10px 0' }}>
                        {weeklyGrowth.map((day, i) => {
                            const color = getScoreColor(day.growthIndex);
                            return (
                                <div className="weekly-bar-col" key={i}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: day.isToday ? color : 'var(--text-muted)', marginBottom: 6 }}>
                                        {day.growthIndex}
                                    </span>
                                    <div style={{
                                        position: 'relative', flex: 1, width: '100%',
                                        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
                                    }}>
                                        <div
                                            className="weekly-bar"
                                            style={{
                                                height: `${Math.max(8, day.growthIndex)}%`,
                                                background: day.isToday ? `linear-gradient(180deg, ${color}, ${color}88)` : day.growthIndex > 0 ? `${color}40` : 'var(--bg-elevated)',
                                                borderRadius: '6px 6px 4px 4px',
                                                transition: `height 1s ease ${i * 0.1}s`,
                                                boxShadow: day.isToday ? `0 0 10px ${color}30` : 'none'
                                            }}
                                        />
                                    </div>
                                    <span style={{
                                        fontSize: 11, fontWeight: day.isToday ? 700 : 500,
                                        color: day.isToday ? color : 'var(--text-muted)', marginTop: 8
                                    }}>
                                        {day.day}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Achievements / Milestones */}
            <div className="section" style={{ marginBottom: 40 }}>
                <div className="section-header">
                    <h3 className="section-title">Milestones</h3>
                </div>
                <div className="card achievement-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 50, height: 50, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ffd700, #ff9100)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(255, 145, 0, 0.3)'
                    }}>
                        <Award size={28} style={{ color: 'white' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>Growth Pioneer</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Completed 7 consecutive days of tracking.</div>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                        <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
                    </div>
                </div>
            </div>

            <style>{`
                .pillar-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }
                .pillar-card {
                    padding: 16px;
                }
                .achievement-card {
                    padding: 16px;
                    border-left: 4px solid #ff9100;
                }
                .hero-card {
                    background: var(--bg-card);
                    border-radius: 24px;
                    box-shadow: var(--shadow-sm);
                }
            `}</style>
        </div>
    );
}
