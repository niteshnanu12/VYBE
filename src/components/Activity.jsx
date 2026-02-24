import React, { useState, useEffect } from 'react';
import { Footprints, Bike, Dumbbell, Timer, Flame, MapPin, Plus, ChevronDown, Play, Pause, RotateCcw } from 'lucide-react';
import { getTodayActivities, addActivity, getTodaySteps, saveTodaySteps } from '../utils/storage.js';
import { formatDuration } from '../utils/algorithms.js';
import { requestSensorPermissions, startTracking, isSensorTracking, stopTracking } from '../utils/sensors.js';

const activityTypes = [
    { type: 'walking', icon: Footprints, label: 'Walking', color: '#4f8cff', met: 3.5 },
    { type: 'running', icon: Footprints, label: 'Running', color: '#ff4757', met: 8.0 },
    { type: 'cycling', icon: Bike, label: 'Cycling', color: '#00e676', met: 6.0 },
    { type: 'workout', icon: Dumbbell, label: 'Workout', color: '#ff9100', met: 7.0 },
];

export default function Activity() {
    const [activities, setActivities] = useState([]);
    const [steps, setSteps] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedType, setSelectedType] = useState('walking');
    const [duration, setDuration] = useState('30');
    const [tab, setTab] = useState('today');

    // Workout timer
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [timerType, setTimerType] = useState('walking');

    const [trackingActive, setTrackingActive] = useState(false);
    const [sensorError, setSensorError] = useState(null);

    useEffect(() => {
        setActivities(getTodayActivities());
        setSteps(getTodaySteps());
        setTrackingActive(isSensorTracking());
    }, []);

    const handleEnableSensors = async () => {
        const result = await requestSensorPermissions();
        if (result.granted) {
            setTrackingActive(true);
            setSensorError(null);
            startTracking((updatedSteps) => {
                setSteps(updatedSteps);
            });
        } else {
            setSensorError(result.error || 'Permission denied');
        }
    };

    useEffect(() => {
        let interval;
        if (isTimerRunning) {
            interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const totalCalories = activities.reduce((sum, a) => sum + (a.calories || 0), 0);
    const totalDuration = activities.reduce((sum, a) => sum + (a.duration || 0), 0);
    const totalDistance = activities.reduce((sum, a) => sum + (a.distance || 0), 0);

    const handleAddActivity = () => {
        const typeInfo = activityTypes.find(t => t.type === selectedType);
        const dur = parseInt(duration) || 30;
        const cal = Math.round(dur * typeInfo.met * 1.2);
        const dist = selectedType === 'cycling' ? +(dur * 0.4).toFixed(1) : +(dur * 0.08).toFixed(1);

        const newActivity = {
            type: selectedType,
            name: typeInfo.label,
            duration: dur,
            calories: cal,
            distance: dist,
        };

        addActivity(newActivity);
        setActivities(getTodayActivities());
        setShowAddModal(false);
        setDuration('30');
    };

    const finishTimerWorkout = () => {
        setIsTimerRunning(false);
        const typeInfo = activityTypes.find(t => t.type === timerType);
        const dur = Math.round(timerSeconds / 60);
        if (dur < 1) return;

        const cal = Math.round(dur * typeInfo.met * 1.2);
        const dist = timerType === 'cycling' ? +(dur * 0.4).toFixed(1) : +(dur * 0.08).toFixed(1);

        addActivity({
            type: timerType,
            name: `${typeInfo.label} Session`,
            duration: dur,
            calories: cal,
            distance: dist,
        });
        setActivities(getTodayActivities());
        setTimerSeconds(0);
    };

    const formatTimer = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Activity</h1>
                    <p className="header-subtitle">Track your workouts & movement</p>
                </div>
                <button className="header-icon-btn" onClick={() => setShowAddModal(true)} id="btn-add-activity">
                    <Plus size={20} style={{ color: 'var(--accent-blue)' }} />
                </button>
            </div>

            {/* Summary Cards */}
            <div className="metric-row">
                <div className="metric-item">
                    <div className="metric-icon" style={{ background: 'rgba(255, 145, 0, 0.12)' }}>
                        <Flame size={18} style={{ color: '#ff9100' }} />
                    </div>
                    <div className="metric-value" style={{ color: '#ff9100' }}>{Math.round(totalCalories + (steps?.calories || 0))}</div>
                    <div className="metric-label">Total Cal</div>
                </div>
                <div className="metric-item">
                    <div className="metric-icon" style={{ background: 'rgba(79, 140, 255, 0.12)' }}>
                        <Timer size={18} style={{ color: '#4f8cff' }} />
                    </div>
                    <div className="metric-value" style={{ color: '#4f8cff' }}>{totalDuration}</div>
                    <div className="metric-label">Minutes</div>
                </div>
                <div className="metric-item">
                    <div className="metric-icon" style={{ background: 'rgba(0, 230, 118, 0.12)' }}>
                        <MapPin size={18} style={{ color: '#00e676' }} />
                    </div>
                    <div className="metric-value" style={{ color: '#00e676' }}>{totalDistance.toFixed(1)}</div>
                    <div className="metric-label">KM</div>
                </div>
            </div>

            {/* Sensor Permission Section */}
            {!trackingActive && (
                <div className="card" style={{
                    border: sensorError ? '1px solid rgba(255, 71, 87, 0.3)' : '1px solid rgba(79, 140, 255, 0.3)',
                    background: sensorError ? 'rgba(255, 71, 87, 0.05)' : 'rgba(79, 140, 255, 0.05)',
                    marginBottom: 24
                }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: sensorError ? 'rgba(255, 71, 87, 0.1)' : 'rgba(79, 140, 255, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Footprints size={24} style={{ color: sensorError ? '#ff4757' : '#4f8cff' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>Real-time Step Tracking</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {sensorError ? sensorError : 'Enable sensors to track your movement automatically.'}
                            </div>
                        </div>
                        <button
                            className="btn btn-primary"
                            style={{ width: 'auto', padding: '8px 16px', fontSize: 13 }}
                            onClick={handleEnableSensors}
                        >
                            Enable
                        </button>
                    </div>
                </div>
            )}

            {trackingActive && (
                <div className="card" style={{ border: '1px solid rgba(0, 230, 118, 0.3)', background: 'rgba(0, 230, 118, 0.05)', marginBottom: 24 }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: 'rgba(0, 230, 118, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div className="live-dot" style={{ margin: 0 }} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>Tracking is Active</div>
                            <div style={{ fontSize: 40, fontWeight: 800, fontFamily: 'var(--font-display)', margin: '4px 0', letterSpacing: -1 }}>
                                {steps?.count || 0} <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: 0 }}>steps</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Live Workout Timer */}
            <div className="card" id="card-workout-timer" style={{ textAlign: 'center' }}>
                <div className="card-header">
                    <span className="card-title">Workout Timer</span>
                    {isTimerRunning && <span className="live-indicator"><span className="live-dot" />ACTIVE</span>}
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                    {activityTypes.map(at => (
                        <button
                            key={at.type}
                            className={`pill ${timerType === at.type ? 'active' : ''}`}
                            onClick={() => !isTimerRunning && setTimerType(at.type)}
                            style={timerType === at.type ? { background: `${at.color}18`, color: at.color, borderColor: `${at.color}40` } : {}}
                        >
                            <at.icon size={14} />
                            {at.label}
                        </button>
                    ))}
                </div>

                <div style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 800, letterSpacing: -2, margin: '16px 0', color: isTimerRunning ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                    {formatTimer(timerSeconds)}
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setTimerSeconds(0); setIsTimerRunning(false); }}
                        style={{ width: 'auto', padding: '10px 20px' }}
                        id="btn-reset-timer"
                    >
                        <RotateCcw size={16} /> Reset
                    </button>
                    <button
                        className={`btn ${isTimerRunning ? 'btn-danger' : 'btn-primary'} btn-sm`}
                        onClick={() => isTimerRunning ? finishTimerWorkout() : setIsTimerRunning(true)}
                        style={{ width: 'auto', padding: '10px 24px' }}
                        id="btn-toggle-timer"
                    >
                        {isTimerRunning ? <><Pause size={16} /> Finish</> : <><Play size={16} /> Start</>}
                    </button>
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="section">
                <div className="section-header">
                    <h3 className="section-title">Today's Activities</h3>
                    <span className="stat-badge stat-badge-blue">{activities.length} sessions</span>
                </div>

                {activities.length === 0 ? (
                    <div className="empty-state">
                        <Footprints />
                        <h3>No activities yet</h3>
                        <p>Start a workout or add an activity to track your day</p>
                    </div>
                ) : (
                    <div className="activity-timeline">
                        {activities.map((activity, i) => {
                            const typeInfo = activityTypes.find(t => t.type === activity.type) || activityTypes[0];
                            return (
                                <div className="activity-item" key={activity.id || i} style={{ animationDelay: `${i * 0.1}s` }}>
                                    <div className="activity-icon" style={{ background: `${typeInfo.color}18` }}>
                                        <typeInfo.icon size={20} style={{ color: typeInfo.color }} />
                                    </div>
                                    <div className="activity-info">
                                        <div className="activity-name">{activity.name}</div>
                                        <div className="activity-detail">{formatDuration(activity.duration)} • {activity.distance} km</div>
                                    </div>
                                    <div className="activity-value">
                                        <div className="activity-cal" style={{ color: '#ff9100' }}>{activity.calories}</div>
                                        <div className="activity-cal-unit">kcal</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Activity Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <h3 className="modal-title">Add Activity</h3>

                        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                            {activityTypes.map(at => (
                                <button
                                    key={at.type}
                                    className={`pill ${selectedType === at.type ? 'active' : ''}`}
                                    onClick={() => setSelectedType(at.type)}
                                    style={selectedType === at.type ? { background: `${at.color}18`, color: at.color, borderColor: `${at.color}40` } : {}}
                                >
                                    <at.icon size={14} />
                                    {at.label}
                                </button>
                            ))}
                        </div>

                        <div className="input-group">
                            <label className="input-label">Duration (minutes)</label>
                            <input
                                className="input-field"
                                type="number"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                placeholder="30"
                                id="input-activity-duration"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)} id="btn-cancel-activity">Cancel</button>
                            <button className="btn btn-primary" onClick={handleAddActivity} id="btn-save-activity">Add Activity</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
