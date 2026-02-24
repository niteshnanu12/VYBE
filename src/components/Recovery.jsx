import React, { useState, useEffect } from 'react';
import { Moon, Heart, Brain, Zap, Clock, TrendingUp, ChevronRight, Sun, CloudMoon } from 'lucide-react';
import ProgressRing from './ProgressRing.jsx';
import { getTodaySleep, getWeeklySleep, saveSleep } from '../utils/storage.js';
import { calculateRecoveryScore, getScoreColor, getScoreLabel } from '../utils/algorithms.js';

export default function Recovery() {
    const [sleep, setSleep] = useState(getTodaySleep());
    const [weeklySleep, setWeeklySleep] = useState([]);
    const [showLogModal, setShowLogModal] = useState(false);
    const [sleepForm, setSleepForm] = useState({
        bedtime: '23:00',
        wakeTime: '07:00',
        quality: 'good',
    });

    useEffect(() => {
        setWeeklySleep(getWeeklySleep());
    }, []);

    const recoveryScore = sleep.recoveryScore || calculateRecoveryScore(sleep.quality || 70);
    const recoveryColor = getScoreColor(recoveryScore);

    const handleLogSleep = () => {
        const bedParts = sleepForm.bedtime.split(':').map(Number);
        const wakeParts = sleepForm.wakeTime.split(':').map(Number);
        let duration = (wakeParts[0] + wakeParts[1] / 60) - (bedParts[0] + bedParts[1] / 60);
        if (duration < 0) duration += 24;
        duration = +duration.toFixed(1);

        const qualityMap = { poor: 40, fair: 60, good: 75, great: 90 };
        const quality = qualityMap[sleepForm.quality] || 70;

        const newSleep = {
            duration,
            quality,
            deepSleep: +(duration * 0.2).toFixed(1),
            lightSleep: +(duration * 0.45).toFixed(1),
            rem: +(duration * 0.25).toFixed(1),
            awake: +(duration * 0.1).toFixed(1),
            recoveryScore: calculateRecoveryScore(quality),
            bedtime: sleepForm.bedtime,
            wakeTime: sleepForm.wakeTime,
        };

        saveSleep(newSleep);
        setSleep(newSleep);
        setShowLogModal(false);
    };

    const totalSleepHours = sleep.duration || 0;
    const sleepEfficiency = totalSleepHours > 0 ? Math.round(((totalSleepHours - (sleep.awake || 0)) / totalSleepHours) * 100) : 0;

    const sleepStages = [
        { label: 'Deep', value: sleep.deepSleep || 0, color: '#4f46e5', pct: totalSleepHours > 0 ? ((sleep.deepSleep || 0) / totalSleepHours * 100) : 0 },
        { label: 'Light', value: sleep.lightSleep || 0, color: '#7c3aed', pct: totalSleepHours > 0 ? ((sleep.lightSleep || 0) / totalSleepHours * 100) : 0 },
        { label: 'REM', value: sleep.rem || 0, color: '#b388ff', pct: totalSleepHours > 0 ? ((sleep.rem || 0) / totalSleepHours * 100) : 0 },
        { label: 'Awake', value: sleep.awake || 0, color: '#ff4757', pct: totalSleepHours > 0 ? ((sleep.awake || 0) / totalSleepHours * 100) : 0 },
    ];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Recovery</h1>
                    <p className="header-subtitle">Sleep tracking & recovery score</p>
                </div>
                <button className="btn btn-sm btn-secondary" onClick={() => setShowLogModal(true)} style={{ width: 'auto' }} id="btn-log-sleep">
                    <Moon size={14} /> Log Sleep
                </button>
            </div>

            {/* Recovery Score */}
            <div className="card card-glow" id="card-recovery-score" style={{ textAlign: 'center' }}>
                <div className="card-header" style={{ justifyContent: 'center' }}>
                    <span className="card-title">Recovery Score</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 16px' }}>
                    <ProgressRing size={160} strokeWidth={10} progress={recoveryScore} color={recoveryColor}>
                        <span className="score-number" style={{ fontSize: 48, color: recoveryColor }}>
                            {recoveryScore}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                            {getScoreLabel(recoveryScore)}
                        </span>
                    </ProgressRing>
                </div>

                <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 280, margin: '0 auto' }}>
                    {recoveryScore >= 70
                        ? "You're well recovered! Push hard today. 💪"
                        : recoveryScore >= 50
                            ? "Moderate recovery. Listen to your body. 🧘"
                            : "Low recovery. Consider rest and recovery activities. 😴"}
                </p>
            </div>

            {/* Sleep Duration */}
            <div className="metric-row">
                <div className="metric-item" id="card-sleep-duration">
                    <div className="metric-icon" style={{ background: 'rgba(179, 136, 255, 0.12)' }}>
                        <Clock size={18} style={{ color: '#b388ff' }} />
                    </div>
                    <div className="metric-value" style={{ color: '#b388ff' }}>{totalSleepHours}h</div>
                    <div className="metric-label">Duration</div>
                </div>
                <div className="metric-item" id="card-sleep-efficiency">
                    <div className="metric-icon" style={{ background: 'rgba(0, 230, 118, 0.12)' }}>
                        <Zap size={18} style={{ color: '#00e676' }} />
                    </div>
                    <div className="metric-value" style={{ color: '#00e676' }}>{sleepEfficiency}%</div>
                    <div className="metric-label">Efficiency</div>
                </div>
                <div className="metric-item" id="card-sleep-quality">
                    <div className="metric-icon" style={{ background: 'rgba(255, 145, 0, 0.12)' }}>
                        <Heart size={18} style={{ color: '#ff9100' }} />
                    </div>
                    <div className="metric-value" style={{ color: '#ff9100' }}>{sleep.quality || 0}</div>
                    <div className="metric-label">Quality</div>
                </div>
            </div>

            {/* Bedtime / Wake */}
            {sleep.bedtime && (
                <div className="card" id="card-bedwake">
                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                        <div style={{ textAlign: 'center' }}>
                            <CloudMoon size={20} style={{ color: '#b388ff', marginBottom: 8 }} />
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>{sleep.bedtime}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Bedtime</div>
                        </div>
                        <div style={{ width: 1, background: 'var(--border-subtle)' }} />
                        <div style={{ textAlign: 'center' }}>
                            <Sun size={20} style={{ color: '#ffd740', marginBottom: 8 }} />
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>{sleep.wakeTime}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Wake Up</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sleep Stages */}
            {totalSleepHours > 0 && (
                <div className="section">
                    <div className="section-header">
                        <h3 className="section-title">Sleep Stages</h3>
                    </div>
                    <div className="card" id="card-sleep-stages">
                        <div className="sleep-stages">
                            {sleepStages.map((stage, i) => (
                                <div
                                    key={i}
                                    className="sleep-stage"
                                    style={{
                                        width: `${stage.pct}%`,
                                        background: stage.color,
                                        minWidth: stage.pct > 0 ? 4 : 0,
                                    }}
                                />
                            ))}
                        </div>
                        <div className="sleep-legend">
                            {sleepStages.map((stage, i) => (
                                <div className="sleep-legend-item" key={i}>
                                    <span className="sleep-legend-dot" style={{ background: stage.color }} />
                                    {stage.label}: {stage.value}h ({Math.round(stage.pct)}%)
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Weekly Sleep */}
            <div className="section">
                <div className="section-header">
                    <h3 className="section-title">Weekly Sleep</h3>
                </div>
                <div className="card" id="card-weekly-sleep">
                    <div className="weekly-bars" style={{ height: 80 }}>
                        {weeklySleep.map((day, i) => (
                            <div className="weekly-bar-col" key={i}>
                                <div
                                    className="weekly-bar"
                                    style={{
                                        height: `${Math.max(8, (day.hours / 10) * 100)}%`,
                                        background: day.hours >= 7 ? 'linear-gradient(180deg, #b388ff, #7c3aed)' : day.hours > 0 ? 'linear-gradient(180deg, #ff9100, #ff4757)' : 'var(--bg-elevated)',
                                        marginTop: 'auto',
                                        transition: `height 1s ease ${i * 0.1}s`,
                                    }}
                                />
                                <span className="weekly-label">{day.day}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tips */}
            <div className="card" id="card-sleep-tips">
                <div className="card-header">
                    <span className="card-title">💡 Sleep Tips</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                        'Maintain a consistent sleep schedule',
                        'Avoid screens 30 minutes before bed',
                        'Keep your bedroom cool (65-68°F)',
                        'Limit caffeine after 2:00 PM',
                    ].map((tip, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#b388ff', flexShrink: 0 }} />
                            {tip}
                        </div>
                    ))}
                </div>
            </div>

            {/* Log Sleep Modal */}
            {showLogModal && (
                <div className="modal-overlay" onClick={() => setShowLogModal(false)}>
                    <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <h3 className="modal-title">Log Sleep</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group">
                                <label className="input-label">Bedtime</label>
                                <input
                                    className="input-field"
                                    type="time"
                                    value={sleepForm.bedtime}
                                    onChange={e => setSleepForm({ ...sleepForm, bedtime: e.target.value })}
                                    id="input-bedtime"
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Wake Time</label>
                                <input
                                    className="input-field"
                                    type="time"
                                    value={sleepForm.wakeTime}
                                    onChange={e => setSleepForm({ ...sleepForm, wakeTime: e.target.value })}
                                    id="input-waketime"
                                />
                            </div>
                        </div>

                        <div className="input-group" style={{ marginTop: 8 }}>
                            <label className="input-label">Sleep Quality</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {['poor', 'fair', 'good', 'great'].map(q => (
                                    <button
                                        key={q}
                                        className={`pill ${sleepForm.quality === q ? 'active' : ''}`}
                                        onClick={() => setSleepForm({ ...sleepForm, quality: q })}
                                        style={{ flex: 1, justifyContent: 'center', textTransform: 'capitalize' }}
                                    >
                                        {q === 'poor' ? '😫' : q === 'fair' ? '😐' : q === 'good' ? '😊' : '😴'} {q}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                            <button className="btn btn-secondary" onClick={() => setShowLogModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleLogSleep} id="btn-save-sleep">Save Sleep</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
