import React, { useState } from 'react';
import { Bell, BellOff, Trash2, Clock, Droplets, Moon, Footprints, Trophy, AlertTriangle } from 'lucide-react';
import { getNotificationLog, clearNotificationLog, requestNotificationPermission, getNotificationPermission } from '../utils/notifications.js';

export default function Notifications({ onClose }) {
    const [logs, setLogs] = useState(getNotificationLog());
    const [permission, setPermission] = useState(getNotificationPermission());

    const handleRequestPermission = async () => {
        const result = await requestNotificationPermission();
        setPermission(result);
    };

    const handleClear = () => {
        clearNotificationLog();
        setLogs([]);
    };

    const getNotifIcon = (tag) => {
        if (tag?.includes('hydration')) return <Droplets size={16} style={{ color: '#00d4ff' }} />;
        if (tag?.includes('sleep')) return <Moon size={16} style={{ color: '#b388ff' }} />;
        if (tag?.includes('step') || tag?.includes('milestone')) return <Trophy size={16} style={{ color: '#ffd740' }} />;
        if (tag?.includes('calorie')) return <AlertTriangle size={16} style={{ color: '#ff9100' }} />;
        if (tag?.includes('workout')) return <Footprints size={16} style={{ color: '#00e676' }} />;
        return <Bell size={16} style={{ color: 'var(--text-secondary)' }} />;
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

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Notifications</h1>
                    <p className="header-subtitle">Alerts & reminders</p>
                </div>
                {logs.length > 0 && (
                    <button className="header-icon-btn" onClick={handleClear} id="btn-clear-notifs">
                        <Trash2 size={16} style={{ color: 'var(--accent-red)' }} />
                    </button>
                )}
            </div>

            {/* Permission Banner */}
            {permission !== 'granted' && (
                <div className="card card-glow" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <BellOff size={24} style={{ color: 'var(--accent-orange)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>Notifications are off</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Enable to get hydration reminders, sleep alerts, and milestone celebrations</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handleRequestPermission} style={{ width: 'auto', whiteSpace: 'nowrap' }} id="btn-enable-notifs">
                        Enable
                    </button>
                </div>
            )}

            {/* Notification Settings Quick View */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                    <span className="card-title">Active Reminders</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                        { icon: Droplets, label: 'Hydration Reminders', detail: 'Every 2 hours', color: '#00d4ff', active: true },
                        { icon: Moon, label: 'Sleep Reminders', detail: 'Bedtime alert', color: '#b388ff', active: true },
                        { icon: Footprints, label: 'Workout Reminders', detail: 'Daily reminder', color: '#00e676', active: true },
                        { icon: Trophy, label: 'Milestone Alerts', detail: 'Achievement notifications', color: '#ffd740', active: true },
                    ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <item.icon size={14} style={{ color: item.color }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.detail}</div>
                            </div>
                            <div style={{
                                width: 8, height: 8, borderRadius: 4,
                                background: item.active ? '#00e676' : 'var(--text-muted)',
                            }} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Notification Log */}
            <div className="section-header">
                <h3 className="section-title">Recent Notifications</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{logs.length} notifications</span>
            </div>

            {logs.length === 0 ? (
                <div className="empty-state">
                    <Bell />
                    <h3>No notifications yet</h3>
                    <p>Your alerts and reminders will appear here</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {logs.map((notif, i) => (
                        <div key={i} className="card" style={{ marginBottom: 0, padding: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                                {getNotifIcon(notif.tag)}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>{notif.title}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{notif.body}</div>
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                    {timeAgo(notif.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
