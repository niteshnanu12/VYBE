import React, { useState, useEffect } from 'react';
import {
    Bell, BellOff, Trash2, Clock, Droplets, Moon, Footprints, Trophy, AlertTriangle,
    Zap, Settings, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Utensils,
    Activity, FileText, VolumeX, Volume2
} from 'lucide-react';
import {
    getNotificationLog, clearNotificationLog, requestNotificationPermission,
    getNotificationPermission, getActiveReminders, sendDailySummary,
    initializeNotifications, stopAllReminders
} from '../utils/notifications.js';
import { getSettings, saveSettings } from '../utils/storage.js';

export default function Notifications({ onClose }) {
    const [logs, setLogs] = useState(getNotificationLog());
    const [permission, setPermission] = useState(getNotificationPermission());
    const [settings, setSettings] = useState(getSettings());
    const [reminders, setReminders] = useState(getActiveReminders());
    const [showSettings, setShowSettings] = useState(false);
    const [tab, setTab] = useState('alerts'); // 'alerts', 'settings'

    // Refresh reminders status
    useEffect(() => {
        const interval = setInterval(() => {
            setReminders(getActiveReminders());
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleRequestPermission = async () => {
        const result = await requestNotificationPermission();
        setPermission(result);
    };

    const handleClear = () => {
        clearNotificationLog();
        setLogs([]);
    };

    const handleToggleReminder = (key, value) => {
        const updated = { ...settings, [key]: value };
        setSettings(updated);
        saveSettings(updated);

        // Restart notifications with updated settings
        stopAllReminders();
        initializeNotifications(updated);
        setTimeout(() => setReminders(getActiveReminders()), 100);
    };

    const handleUpdateInterval = (key, value) => {
        const updated = { ...settings, [key]: value };
        setSettings(updated);
        saveSettings(updated);

        // Restart notifications
        stopAllReminders();
        initializeNotifications(updated);
        setTimeout(() => setReminders(getActiveReminders()), 100);
    };

    const handleTestSummary = () => {
        sendDailySummary();
        setTimeout(() => setLogs(getNotificationLog()), 500);
    };

    const getNotifIcon = (tag) => {
        if (tag?.includes('hydration')) return <Droplets size={16} style={{ color: '#00d4ff' }} />;
        if (tag?.includes('sleep') || tag?.includes('winddown')) return <Moon size={16} style={{ color: '#b388ff' }} />;
        if (tag?.includes('step') || tag?.includes('milestone')) return <Trophy size={16} style={{ color: '#ffd740' }} />;
        if (tag?.includes('calorie')) return <Utensils size={16} style={{ color: '#ff9100' }} />;
        if (tag?.includes('workout')) return <Footprints size={16} style={{ color: '#00e676' }} />;
        if (tag?.includes('inactivity')) return <Activity size={16} style={{ color: '#ff6b9d' }} />;
        if (tag?.includes('summary')) return <FileText size={16} style={{ color: '#4f8cff' }} />;
        return <Bell size={16} style={{ color: 'var(--text-secondary)' }} />;
    };

    const getNotifTypeColor = (tag) => {
        if (tag?.includes('hydration')) return '#00d4ff';
        if (tag?.includes('sleep')) return '#b388ff';
        if (tag?.includes('milestone') || tag?.includes('step')) return '#ffd740';
        if (tag?.includes('calorie')) return '#ff9100';
        if (tag?.includes('workout')) return '#00e676';
        if (tag?.includes('inactivity')) return '#ff6b9d';
        if (tag?.includes('summary')) return '#4f8cff';
        return 'var(--text-muted)';
    };

    const timeAgo = (timestamp) => {
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const reminderItems = [
        {
            key: 'waterReminder',
            icon: Droplets,
            label: 'Hydration Reminders',
            detail: reminders.hydration?.label || 'Every 2 hours',
            color: '#00d4ff',
            active: reminders.hydration?.active,
            enabled: settings.waterReminder !== false,
            settingsKey: 'waterReminder',
            intervalKey: 'waterReminderInterval',
            intervalOptions: [
                { label: '1h', value: 1 },
                { label: '1.5h', value: 1.5 },
                { label: '2h', value: 2 },
                { label: '3h', value: 3 },
            ],
            description: 'Smart time-based reminders that adapt to morning, afternoon, and evening. Includes 25%, 50%, 75%, and 100% goal milestone alerts.',
        },
        {
            key: 'sleepReminder',
            icon: Moon,
            label: 'Sleep Reminders',
            detail: reminders.sleep?.label || 'Bedtime alert',
            color: '#b388ff',
            active: reminders.sleep?.active,
            enabled: settings.sleepReminder !== false,
            settingsKey: 'sleepReminder',
            description: 'Wind-down alert 1 hour before bedtime, bedtime reminder at 30 minutes, and late-night warning if still awake.',
        },
        {
            key: 'workoutReminder',
            icon: Footprints,
            label: 'Workout Reminders',
            detail: reminders.workout?.label || 'Daily reminder',
            color: '#00e676',
            active: reminders.workout?.active,
            enabled: settings.workoutReminder !== false,
            settingsKey: 'workoutReminder',
            description: 'Morning workout motivation with your current step count if you\'ve already started moving.',
        },
        {
            key: 'inactivityAlert',
            icon: Activity,
            label: 'Inactivity Alerts',
            detail: reminders.inactivity?.label || 'After 2 hours',
            color: '#ff6b9d',
            active: reminders.inactivity?.active,
            enabled: settings.inactivityAlert !== false,
            settingsKey: 'inactivityAlert',
            description: 'Get reminded to move after long periods of inactivity. Only during active hours (8 AM - 9 PM).',
        },
        {
            key: 'calorieAlerts',
            icon: Utensils,
            label: 'Calorie Alerts',
            detail: reminders.calorieAlerts?.label || 'At 80/100/120%',
            color: '#ff9100',
            active: true,
            enabled: settings.calorieAlerts !== false,
            settingsKey: 'calorieAlerts',
            description: 'Warnings when you approach (80%), reach (100%), or exceed (120%) your daily calorie goal.',
        },
        {
            key: 'milestoneAlerts',
            icon: Trophy,
            label: 'Milestone Celebrations',
            detail: reminders.milestones?.label || 'Step milestones',
            color: '#ffd740',
            active: true,
            enabled: settings.milestoneAlerts !== false,
            settingsKey: 'milestoneAlerts',
            description: 'Celebrate 1K, 3K, 5K, 7.5K, 10K, 15K, and 20K step milestones with notifications.',
        },
        {
            key: 'dailySummary',
            icon: FileText,
            label: 'Daily Summary',
            detail: reminders.dailySummary?.label || 'Evening summary',
            color: '#4f8cff',
            active: reminders.dailySummary?.active,
            enabled: settings.dailySummary !== false,
            settingsKey: 'dailySummary',
            description: 'A comprehensive summary of your day\'s steps, hydration, and calories sent at 9 PM.',
        },
    ];

    const [expandedItem, setExpandedItem] = useState(null);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Notifications</h1>
                    <p className="header-subtitle">Alerts, reminders & preferences</p>
                </div>
                {logs.length > 0 && (
                    <button className="header-icon-btn" onClick={handleClear} id="btn-clear-notifs">
                        <Trash2 size={16} style={{ color: 'var(--accent-red)' }} />
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ marginBottom: 16 }}>
                <button className={`tab ${tab === 'alerts' ? 'active' : ''}`} onClick={() => setTab('alerts')} id="tab-alerts">
                    🔔 Alerts
                </button>
                <button className={`tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')} id="tab-settings">
                    ⚙️ Preferences
                </button>
            </div>

            {tab === 'alerts' && (
                <>
                    {/* Permission Banner */}
                    {permission !== 'granted' && (
                        <div className="card card-glow" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <BellOff size={24} style={{ color: 'var(--accent-orange)', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>Push notifications are off</div>
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                    Enable to get hydration reminders, sleep alerts, milestone celebrations, and daily summaries
                                </div>
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={handleRequestPermission} style={{ width: 'auto', whiteSpace: 'nowrap' }} id="btn-enable-notifs">
                                Enable
                            </button>
                        </div>
                    )}

                    {/* Active Reminders Overview */}
                    <div className="card" style={{ marginBottom: 16 }} id="card-active-reminders">
                        <div className="card-header">
                            <span className="card-title">Active Reminders</span>
                            <span className="stat-badge stat-badge-green" style={{ fontSize: 10 }}>
                                {reminderItems.filter(i => i.enabled).length}/{reminderItems.length} on
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {reminderItems.map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 8,
                                        background: `${item.color}15`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <item.icon size={14} style={{ color: item.color }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.detail}</div>
                                    </div>
                                    <div style={{
                                        width: 8, height: 8, borderRadius: 4,
                                        background: item.enabled && item.active ? '#00e676' : item.enabled ? '#ffd740' : 'var(--text-muted)',
                                        boxShadow: item.enabled && item.active ? '0 0 6px rgba(0, 230, 118, 0.4)' : 'none',
                                    }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quiet Hours */}
                    <div className="card" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }} id="card-quiet-hours">
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: 'rgba(179, 136, 255, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            {settings.quietHours !== false ? <VolumeX size={18} style={{ color: '#b388ff' }} /> : <Volume2 size={18} style={{ color: '#b388ff' }} />}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>Quiet Hours</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                {settings.quietHours !== false
                                    ? `${settings.quietHoursStart ?? 22}:00 - ${settings.quietHoursEnd ?? 7}:00 (no alerts)`
                                    : 'Disabled — you may receive alerts anytime'}
                            </div>
                        </div>
                        <button
                            onClick={() => handleToggleReminder('quietHours', settings.quietHours === false ? true : false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                        >
                            {settings.quietHours !== false
                                ? <ToggleRight size={28} style={{ color: '#b388ff' }} />
                                : <ToggleLeft size={28} style={{ color: 'var(--text-muted)' }} />}
                        </button>
                    </div>

                    {/* Notification Log */}
                    <div className="section-header">
                        <h3 className="section-title">Recent Notifications</h3>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{logs.length} total</span>
                    </div>

                    {logs.length === 0 ? (
                        <div className="empty-state">
                            <Bell />
                            <h3>No notifications yet</h3>
                            <p>Your alerts and reminders will appear here</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {logs.slice(0, 20).map((notif, i) => (
                                <div key={i} className="card" style={{ marginBottom: 0, padding: 14 }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: 8,
                                            background: `${getNotifTypeColor(notif.tag)}15`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            {getNotifIcon(notif.tag)}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {notif.title}
                                                {notif.suppressed && (
                                                    <span className="stat-badge" style={{ background: 'rgba(179,136,255,0.1)', color: '#b388ff', fontSize: 9 }}>
                                                        Quiet
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{notif.body}</div>
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                            {timeAgo(notif.timestamp)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {logs.length > 20 && (
                                <div style={{ textAlign: 'center', padding: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                                    + {logs.length - 20} older notifications
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {tab === 'settings' && (
                <>
                    <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                        Tap any reminder to expand its details. Toggle switches to enable or disable individual notifications.
                    </div>

                    {reminderItems.map((item, i) => {
                        const isExpanded = expandedItem === item.key;

                        return (
                            <div
                                key={item.key}
                                className="card"
                                style={{
                                    marginBottom: 8,
                                    border: item.enabled ? `1px solid ${item.color}25` : '1px solid var(--border-subtle)',
                                    transition: 'all 0.3s ease',
                                }}
                                id={`reminder-${item.key}`}
                            >
                                <div
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => setExpandedItem(isExpanded ? null : item.key)}
                                >
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10,
                                        background: `${item.color}15`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <item.icon size={18} style={{ color: item.color }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.detail}</div>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleToggleReminder(item.settingsKey, !item.enabled); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                                        id={`toggle-${item.key}`}
                                    >
                                        {item.enabled
                                            ? <ToggleRight size={28} style={{ color: item.color }} />
                                            : <ToggleLeft size={28} style={{ color: 'var(--text-muted)' }} />}
                                    </button>
                                    {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div style={{
                                        marginTop: 12, paddingTop: 12,
                                        borderTop: '1px solid var(--border-subtle)',
                                        animation: 'fadeIn 0.2s ease',
                                    }}>
                                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                                            {item.description}
                                        </p>

                                        {/* Interval selector for hydration */}
                                        {item.intervalKey && (
                                            <div>
                                                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
                                                    Reminder Interval
                                                </label>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    {item.intervalOptions.map(opt => (
                                                        <button
                                                            key={opt.value}
                                                            className={`pill ${settings[item.intervalKey] === opt.value || (!settings[item.intervalKey] && opt.value === 2) ? 'active' : ''}`}
                                                            onClick={() => handleUpdateInterval(item.intervalKey, opt.value)}
                                                            style={{ padding: '6px 14px' }}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Status indicator */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 6,
                                            marginTop: 10, fontSize: 11, color: 'var(--text-muted)',
                                        }}>
                                            <div style={{
                                                width: 6, height: 6, borderRadius: 3,
                                                background: item.enabled && item.active ? '#00e676' : item.enabled ? '#ffd740' : '#ff4757',
                                            }} />
                                            {item.enabled && item.active ? 'Running' : item.enabled ? 'Enabled (will start on next init)' : 'Disabled'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Quiet Hours Configuration */}
                    <div className="card" style={{ marginTop: 16 }} id="card-quiet-hours-config">
                        <div className="card-header">
                            <span className="card-title">🔇 Quiet Hours</span>
                            <button
                                onClick={() => handleToggleReminder('quietHours', settings.quietHours === false ? true : false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                            >
                                {settings.quietHours !== false
                                    ? <ToggleRight size={24} style={{ color: '#b388ff' }} />
                                    : <ToggleLeft size={24} style={{ color: 'var(--text-muted)' }} />}
                            </button>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                            Suppress non-urgent notifications during sleeping hours. Urgent alerts (like late-night sleep warnings) still come through.
                        </p>
                        {settings.quietHours !== false && (
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label className="input-label">Start</label>
                                    <select
                                        className="input-field"
                                        value={settings.quietHoursStart ?? 22}
                                        onChange={e => handleUpdateInterval('quietHoursStart', parseInt(e.target.value))}
                                        style={{ padding: '10px 12px' }}
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                                    <label className="input-label">End</label>
                                    <select
                                        className="input-field"
                                        value={settings.quietHoursEnd ?? 7}
                                        onChange={e => handleUpdateInterval('quietHoursEnd', parseInt(e.target.value))}
                                        style={{ padding: '10px 12px' }}
                                    >
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <option key={i} value={i}>{String(i).padStart(2, '0')}:00</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Test Button */}
                    <div style={{ marginTop: 20 }}>
                        <button className="btn btn-secondary" onClick={handleTestSummary} id="btn-test-summary" style={{ marginBottom: 8 }}>
                            <FileText size={16} /> Send Test Daily Summary
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
