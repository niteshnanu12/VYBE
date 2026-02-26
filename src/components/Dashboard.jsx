import React, { useState, useEffect, useRef } from 'react';
import { Flame, Footprints, MapPin, Droplets, Moon, TrendingUp, Bell, Zap, ChevronRight, Heart, Activity as ActivityIcon, Sun } from 'lucide-react';
import ProgressRing from './ProgressRing.jsx';
import { getStepsForDate, getWeeklySteps, getSleepForDate, getNutritionForDate, getHydrationForDate, calculateGrowthIndexForDate, getYesterdayPerformance } from '../utils/storage.js';
import { formatNumber, getScoreColor, getScoreLabel } from '../utils/algorithms.js';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { isSensorTracking } from '../utils/sensors.js';
import HomeWidget from './HomeWidget.jsx';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler);

export default function Dashboard({ user, selectedDate, liveSteps }) {
    const today = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === today;

    const [steps, setSteps] = useState(getStepsForDate(selectedDate));
    const [sleep, setSleep] = useState(getSleepForDate(selectedDate));
    const [nutrition, setNutrition] = useState(getNutritionForDate(selectedDate));
    const [hydration, setHydration] = useState(getHydrationForDate(selectedDate));
    const [growth, setGrowth] = useState(null);
    const [weeklySteps, setWeeklySteps] = useState([]);
    const [time, setTime] = useState(new Date());
    const [yesterdayPerf, setYesterdayPerf] = useState(null);

    // Auto-refresh data every 10 seconds when viewing today
    useEffect(() => {
        const refreshData = () => {
            setSteps(getStepsForDate(selectedDate));
            setSleep(getSleepForDate(selectedDate));
            setNutrition(getNutritionForDate(selectedDate));
            setHydration(getHydrationForDate(selectedDate));
            setWeeklySteps(getWeeklySteps());
            setGrowth(calculateGrowthIndexForDate(selectedDate));
            setYesterdayPerf(getYesterdayPerformance());
        };

        refreshData();
        const timer = setInterval(() => setTime(new Date()), 60000);
        const dataRefresh = isToday ? setInterval(refreshData, 10000) : null;

        return () => {
            clearInterval(timer);
            if (dataRefresh) clearInterval(dataRefresh);
        };
    }, [selectedDate, isToday]);

    // Update steps when liveSteps changes (real-time tracking)
    useEffect(() => {
        if (liveSteps && isToday) {
            setSteps(liveSteps);
        }
    }, [liveSteps, isToday]);

    const stepsProgress = Math.min((steps.count / steps.goal) * 100, 100);
    const hydrationProgress = Math.min((hydration.glasses / hydration.goal) * 100, 100);
    const maxWeeklySteps = Math.max(...weeklySteps.map(d => d.steps), 1);

    const greeting = (() => {
        const h = time.getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        return 'Good Evening';
    })();

    const greetingIcon = (() => {
        const h = time.getHours();
        if (h < 6) return '🌙';
        if (h < 12) return '☀️';
        if (h < 17) return '🌤️';
        if (h < 20) return '🌅';
        return '🌙';
    })();

    // Performance Radar - uses YESTERDAY's data
    const radarData = yesterdayPerf ? {
        labels: ['Steps', 'Calories', 'Sleep Score', 'Hydration %', 'Activity'],
        datasets: [{
            label: 'Yesterday',
            data: [
                Math.round(yesterdayPerf.steps),
                Math.round(yesterdayPerf.calories),
                Math.round(yesterdayPerf.sleepScore),
                Math.round(yesterdayPerf.hydrationPct),
                Math.round(yesterdayPerf.activityDuration),
            ],
            backgroundColor: 'rgba(79, 140, 255, 0.15)',
            borderColor: '#4f8cff',
            borderWidth: 2,
            pointBackgroundColor: '#4f8cff',
            pointBorderColor: '#fff',
            pointBorderWidth: 1,
            pointRadius: 4,
            fill: true,
        }],
    } : null;

    const radarOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
            r: {
                beginAtZero: true,
                max: 100,
                ticks: { display: false, stepSize: 25 },
                grid: {
                    color: 'rgba(255,255,255,0.06)',
                    circular: true,
                },
                angleLines: {
                    color: 'rgba(255,255,255,0.06)',
                },
                pointLabels: {
                    font: { size: 11, family: 'Inter' },
                    color: 'var(--text-secondary)',
                },
            },
        },
    };

    const formatStepLabel = (count) => {
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <p className="greeting-text">{greetingIcon} {greeting}</p>
                    <h1 className="greeting-name">{user.name} 👋</h1>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {isToday && isSensorTracking() && (
                        <div className="live-indicator">
                            <span className="live-dot" />
                            LIVE
                        </div>
                    )}
                    {!isToday && (
                        <span className="stat-badge stat-badge-orange" style={{ fontSize: 11 }}>
                            📅 Historical
                        </span>
                    )}
                </div>
            </div>

            {/* Home Widget (Multi-Slide) */}
            <HomeWidget />

            {/* Step Ring - Hero Card */}
            <div className="step-ring-card" id="card-steps">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <ProgressRing size={180} strokeWidth={10} progress={stepsProgress} color="#4f8cff">
                        <Footprints size={24} style={{ color: '#4f8cff', marginBottom: 4 }} />
                        <span className="card-value" style={{ fontSize: 40 }}>{formatNumber(steps.count)}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                            of {formatNumber(steps.goal)} steps
                        </span>
                    </ProgressRing>
                </div>

                {/* Metrics row */}
                <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                    <div style={{ textAlign: 'center' }}>
                        <Flame size={16} style={{ color: '#ff9100', marginBottom: 4 }} />
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{steps.calories}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>kcal</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <MapPin size={16} style={{ color: '#00d4ff', marginBottom: 4 }} />
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{steps.distance}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>km</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <Zap size={16} style={{ color: '#76ff03', marginBottom: 4 }} />
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{Math.round(steps.count / Math.max(1, (time.getHours() || 1)))}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>steps/hr</div>
                    </div>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="metric-row">
                {/* Sleep */}
                <div className="metric-item" id="card-sleep-quick">
                    <div className="metric-icon" style={{ background: 'rgba(179, 136, 255, 0.12)' }}>
                        <Moon size={18} style={{ color: '#b388ff' }} />
                    </div>
                    <div className="metric-value" style={{ color: '#b388ff' }}>{sleep.duration || '—'}</div>
                    <div className="metric-label">Hours Sleep</div>
                    <div className="progress-bar-container" style={{ marginTop: 8 }}>
                        <div className="progress-bar-fill" style={{ width: `${Math.min((sleep.duration / 8) * 100, 100)}%`, background: 'var(--gradient-purple)' }} />
                    </div>
                </div>

                {/* Hydration */}
                <div className="metric-item" id="card-hydration-quick">
                    <div className="metric-icon" style={{ background: 'rgba(0, 212, 255, 0.12)' }}>
                        <Droplets size={18} style={{ color: '#00d4ff' }} />
                    </div>
                    <div className="metric-value" style={{ color: '#00d4ff' }}>{hydration.glasses}/{hydration.goal}</div>
                    <div className="metric-label">Glasses</div>
                    <div className="progress-bar-container" style={{ marginTop: 8 }}>
                        <div className="progress-bar-fill" style={{ width: `${hydrationProgress}%`, background: 'linear-gradient(90deg, #00d4ff, #4f8cff)' }} />
                    </div>
                </div>
            </div>

            {/* Calories & Growth Quick */}
            <div className="metric-row">
                <div className="metric-item" id="card-cal-quick">
                    <div className="metric-icon" style={{ background: 'rgba(255, 145, 0, 0.12)' }}>
                        <Flame size={18} style={{ color: '#ff9100' }} />
                    </div>
                    <div className="metric-value" style={{ color: '#ff9100' }}>{nutrition.calories}</div>
                    <div className="metric-label">Cal Eaten</div>
                    <div className="progress-bar-container" style={{ marginTop: 8 }}>
                        <div className="progress-bar-fill" style={{ width: `${Math.min((nutrition.calories / nutrition.goals.calories) * 100, 100)}%`, background: 'var(--gradient-orange)' }} />
                    </div>
                </div>

                <div className="metric-item" id="card-growth-quick">
                    <div className="metric-icon" style={{ background: 'rgba(0, 230, 118, 0.12)' }}>
                        <TrendingUp size={18} style={{ color: '#00e676' }} />
                    </div>
                    <div className="metric-value" style={{ color: growth ? getScoreColor(growth.growthIndex) : '#00e676' }}>
                        {growth?.growthIndex || 0}
                    </div>
                    <div className="metric-label">Growth Index</div>
                    <div className="progress-bar-container" style={{ marginTop: 8 }}>
                        <div className="progress-bar-fill" style={{ width: `${growth?.growthIndex || 0}%`, background: 'var(--gradient-green)' }} />
                    </div>
                </div>
            </div>

            {/* Weekly Steps - Enhanced with step count above bars */}
            <div className="section">
                <div className="section-header">
                    <h3 className="section-title">Weekly Steps</h3>
                    <span className="section-link">Details <ChevronRight size={14} style={{ display: 'inline' }} /></span>
                </div>
                <div className="card" id="card-weekly-steps">
                    <div className="weekly-bars">
                        {weeklySteps.map((day, i) => (
                            <div className="weekly-bar-col" key={i}>
                                {/* Step count label above bar */}
                                <span className="weekly-step-label" style={{
                                    color: day.isToday ? 'var(--accent-blue)' : 'var(--text-muted)',
                                    fontWeight: day.isToday ? 700 : 500,
                                }}>
                                    {day.steps > 0 ? formatStepLabel(day.steps) : '—'}
                                </span>
                                <div
                                    className={`weekly-bar ${day.isToday ? 'today' : ''}`}
                                    style={{
                                        height: `${Math.max(8, (day.steps / maxWeeklySteps) * 100)}%`,
                                        background: day.isToday ? 'var(--gradient-primary)' : day.date === selectedDate ? 'var(--gradient-purple)' : 'var(--bg-elevated)',
                                        marginTop: 'auto',
                                        transition: `height 1s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.1}s`,
                                        boxShadow: day.isToday ? '0 0 12px rgba(79, 140, 255, 0.4)' : 'none',
                                    }}
                                />
                                <span className="weekly-label" style={{
                                    color: day.isToday ? 'var(--accent-blue)' : day.date === selectedDate ? '#b388ff' : 'var(--text-muted)',
                                    fontWeight: day.isToday ? 700 : day.date === selectedDate ? 600 : 400,
                                }}>
                                    {day.day}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Performance Radar - Yesterday's Data */}
            {yesterdayPerf && radarData && (
                <div className="section">
                    <div className="section-header">
                        <h3 className="section-title">Yesterday's Performance</h3>
                        <span className="stat-badge stat-badge-blue" style={{ fontSize: 10 }}>Radar</span>
                    </div>
                    <div className="card" id="card-radar">
                        <div style={{ maxWidth: 280, margin: '0 auto' }}>
                            <Radar data={radarData} options={radarOptions} />
                        </div>
                        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                            Based on yesterday's data — {growth ? getScoreLabel(growth.growthIndex) : 'No data'}
                        </p>
                    </div>
                </div>
            )}

            {/* Recovery Score */}
            {sleep.recoveryScore > 0 && (
                <div className="section">
                    <div className="section-header">
                        <h3 className="section-title">Recovery</h3>
                        <span className="stat-badge" style={{
                            background: `${getScoreColor(sleep.recoveryScore)}18`,
                            color: getScoreColor(sleep.recoveryScore)
                        }}>
                            {getScoreLabel(sleep.recoveryScore)}
                        </span>
                    </div>
                    <div className="card" id="card-recovery" style={{ textAlign: 'center' }}>
                        <ProgressRing size={120} strokeWidth={8} progress={sleep.recoveryScore} color={getScoreColor(sleep.recoveryScore)}>
                            <span className="score-number" style={{ fontSize: 36, color: getScoreColor(sleep.recoveryScore) }}>
                                {sleep.recoveryScore}
                            </span>
                        </ProgressRing>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12 }}>
                            {sleep.recoveryScore >= 70 ? 'Your body is well recovered. Go for it! 💪' : 'Consider a lighter day. Focus on recovery. 🧘'}
                        </p>
                    </div>
                </div>
            )}

            {/* Growth Breakdown */}
            {growth && (
                <div className="section">
                    <div className="section-header">
                        <h3 className="section-title">{isToday ? "Today's" : "Day's"} Growth</h3>
                    </div>
                    <div className="card" id="card-growth-detail">
                        {[
                            { label: 'Activity (30%)', value: growth.activityConsistency, color: '#4f8cff' },
                            { label: 'Sleep (30%)', value: growth.sleepScore, color: '#b388ff' },
                            { label: 'Nutrition (20%)', value: growth.nutritionScore, color: '#ff9100' },
                            { label: 'Hydration (20%)', value: growth.hydrationScore, color: '#00d4ff' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < 3 ? 14 : 0 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)', width: 100, fontWeight: 500 }}>{item.label}</span>
                                <div style={{ flex: 1, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${item.value}%`,
                                        background: item.color,
                                        borderRadius: 3,
                                        transition: `width 1s ease ${i * 0.15}s`,
                                    }} />
                                </div>
                                <span style={{ fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 700, color: item.color, width: 36, textAlign: 'right' }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
