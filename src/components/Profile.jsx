import React, { useState, useEffect, useRef } from 'react';
import {
    User, Settings, Bell, Shield, Moon, Sun, Monitor, Palette, ChevronRight, LogOut,
    Target, Ruler, Weight, Heart, Calendar, Award, TrendingUp, Zap, Wifi, WifiOff,
    Info, HelpCircle, Share2, Star, Download, FileText, MessageSquare, Users,
    Mail, Copy, ExternalLink, Check, Camera, ChevronDown
} from 'lucide-react';
import ProgressRing from './ProgressRing.jsx';
import { getUser, clearUser, getSettings, saveSettings, calculateGrowthIndex, saveUser, getWeeklyGrowth } from '../utils/storage.js';
import { getScoreColor, getScoreLabel } from '../utils/algorithms.js';
import { useTheme, THEMES } from '../utils/theme.jsx';
import { downloadDailyReport, downloadWeeklyReport, shareReport, shareViaWhatsApp, shareViaEmail } from '../utils/export.js';
import { getConnectionStatus } from '../utils/sync.js';

export default function Profile({ user, onLogout, onNavigate, onUserUpdate }) {
    const [settings, setSettings] = useState(getSettings());
    const [growth, setGrowth] = useState(null);
    const [weeklyGrowth, setWeeklyGrowth] = useState([]);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [editSettings, setEditSettings] = useState(null);
    const [copiedLink, setCopiedLink] = useState(false);
    const { theme, setTheme } = useTheme();
    const syncStatus = getConnectionStatus();
    const fileInputRef = useRef(null);

    useEffect(() => {
        setGrowth(calculateGrowthIndex());
        setWeeklyGrowth(getWeeklyGrowth());
    }, []);

    const handleSaveSettings = () => {
        saveSettings(editSettings);
        setSettings(editSettings);
        setShowSettingsModal(false);
    };

    const handleLogout = () => {
        if (confirm('Are you sure you want to sign out?')) {
            clearUser();
            onLogout();
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.origin);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'VYBE',
                    text: 'Check out VYBE — Own Your Vybe! AI-powered fitness and lifestyle tracking 💪',
                    url: window.location.origin,
                });
            } catch (err) {
                if (err.name !== 'AbortError') console.error('Share failed:', err);
            }
        }
    };

    const handleProfileImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be smaller than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const updatedUser = { ...user, profileImage: event.target.result };
            saveUser(updatedUser);
            if (onUserUpdate) onUserUpdate(updatedUser);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveProfileImage = () => {
        const updatedUser = { ...user, profileImage: null };
        saveUser(updatedUser);
        if (onUserUpdate) onUserUpdate(updatedUser);
    };

    const daysSinceJoin = Math.max(1, Math.floor((Date.now() - new Date(user.joinDate).getTime()) / 86400000));
    const themeLabel = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System Default';

    return (
        <div>
            {/* Profile Header */}
            <div className="profile-header">
                {/* Profile Image with upload */}
                <div style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: 80,
                    minHeight: 80,
                    margin: '0 auto',
                }}>
                    {user.profileImage ? (
                        <img
                            src={user.profileImage}
                            alt="Profile"
                            className="profile-avatar"
                            style={{
                                objectFit: 'cover',
                                cursor: 'pointer',
                                width: 80,
                                height: 80,
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        />
                    ) : (
                        <div
                            className="profile-avatar"
                            style={{
                                cursor: 'pointer',
                                width: 80,
                                height: 80,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {user.avatar || user.name[0]}
                        </div>
                    )}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            position: 'absolute', bottom: 0, right: -4,
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'var(--gradient-primary)',
                            border: '2px solid var(--bg-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', padding: 0,
                        }}
                        id="btn-upload-photo"
                    >
                        <Camera size={13} style={{ color: 'white' }} />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfileImageUpload}
                        style={{ display: 'none' }}
                        id="input-profile-image"
                    />
                </div>

                {user.profileImage && (
                    <button
                        onClick={handleRemoveProfileImage}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'var(--accent-red)', fontSize: 12, marginTop: 8,
                            fontWeight: 500, letterSpacing: '0.2px',
                        }}
                        id="btn-remove-profile-image"
                    >
                        Remove Profile Image
                    </button>
                )}

                <div className="profile-name">{user.name}</div>
                <div className="profile-email">{user.email}</div>

                {/* Sync Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
                    {syncStatus.online ? (
                        <span className="stat-badge stat-badge-green" style={{ fontSize: 10 }}>
                            <Wifi size={10} /> Online
                            {syncStatus.cloudEnabled && ' • Cloud Sync'}
                        </span>
                    ) : (
                        <span className="stat-badge stat-badge-orange" style={{ fontSize: 10 }}>
                            <WifiOff size={10} /> Offline Mode
                        </span>
                    )}
                </div>

                <div className="profile-stats">
                    <div className="profile-stat">
                        <div className="profile-stat-value">{daysSinceJoin}</div>
                        <div className="profile-stat-label">Days Active</div>
                    </div>
                    <div className="profile-stat">
                        <div className="profile-stat-value" style={{ color: growth ? getScoreColor(growth.growthIndex) : 'var(--text-primary)' }}>
                            {growth?.growthIndex || 0}
                        </div>
                        <div className="profile-stat-label">Growth Score</div>
                    </div>
                    <div className="profile-stat">
                        <div className="profile-stat-value">7</div>
                        <div className="profile-stat-label">Streak</div>
                    </div>
                </div>
            </div>

            {/* Growth Overview */}
            {growth && (
                <div className="card" id="card-growth-overview" style={{ textAlign: 'center' }}>
                    <div className="card-header" style={{ justifyContent: 'center' }}>
                        <span className="card-title">Overall Growth Index</span>
                    </div>
                    <ProgressRing size={120} strokeWidth={8} progress={growth.growthIndex} color={getScoreColor(growth.growthIndex)}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: getScoreColor(growth.growthIndex) }}>
                            {growth.growthIndex}
                        </span>
                    </ProgressRing>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 12 }}>
                        {getScoreLabel(growth.growthIndex)} — Keep pushing! 🚀
                    </p>
                </div>
            )}

            {/* Weekly Growth Overview */}
            {weeklyGrowth.length > 0 && (
                <div className="card" id="card-weekly-growth" style={{ marginTop: 12 }}>
                    <div className="card-header">
                        <span className="card-title">📈 Weekly Growth</span>
                        <span className="stat-badge" style={{
                            background: 'rgba(0, 230, 118, 0.12)',
                            color: '#00e676',
                            fontSize: 11,
                        }}>
                            AVG: {Math.round(weeklyGrowth.reduce((s, d) => s + d.growthIndex, 0) / weeklyGrowth.length)}
                        </span>
                    </div>
                    <div className="weekly-bars" style={{ height: 90 }}>
                        {weeklyGrowth.map((day, i) => {
                            const color = getScoreColor(day.growthIndex);
                            return (
                                <div className="weekly-bar-col" key={i}>
                                    <span className="weekly-step-label" style={{
                                        color: day.isToday ? color : 'var(--text-muted)',
                                        fontWeight: day.isToday ? 700 : 500,
                                        fontSize: 11,
                                    }}>
                                        {day.growthIndex > 0 ? day.growthIndex : '—'}
                                    </span>
                                    <div
                                        className="weekly-bar"
                                        style={{
                                            height: `${Math.max(8, day.growthIndex)}%`,
                                            background: day.isToday
                                                ? `linear-gradient(180deg, ${color}, ${color}88)`
                                                : day.growthIndex > 0 ? `${color}50` : 'var(--bg-elevated)',
                                            marginTop: 'auto',
                                            transition: `height 1s ease ${i * 0.1}s`,
                                            boxShadow: day.isToday ? `0 0 10px ${color}40` : 'none',
                                        }}
                                    />
                                    <span className="weekly-label" style={{
                                        fontWeight: day.isToday ? 700 : 400,
                                        color: day.isToday ? color : 'var(--text-muted)',
                                    }}>{day.day}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{
                        marginTop: 12, padding: '10px 12px', borderRadius: 10,
                        background: 'var(--bg-elevated)', fontSize: 12, color: 'var(--text-secondary)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <span>📐 Formula</span>
                        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', opacity: 0.8 }}>
                            Activity×30% + Sleep×30% + Nutrition×20% + Hydration×20%
                        </span>
                    </div>
                </div>
            )}

            {/* Goals Section */}
            <div className="section">
                <div className="section-header">
                    <h3 className="section-title">Daily Goals</h3>
                    <button className="section-link" onClick={() => { setEditSettings({ ...settings }); setShowSettingsModal(true); }} id="btn-edit-goals">
                        Edit <ChevronRight size={14} style={{ display: 'inline' }} />
                    </button>
                </div>
                <div className="card" id="card-goals">
                    {[
                        { icon: Target, label: 'Step Goal', value: `${settings.stepGoal.toLocaleString()} steps`, color: '#4f8cff' },
                        { icon: Zap, label: 'Calorie Goal', value: `${settings.calorieGoal} kcal`, color: '#ff9100' },
                        { icon: Moon, label: 'Sleep Goal', value: `${settings.sleepGoal} hours`, color: '#b388ff' },
                        { icon: Heart, label: 'Water Goal', value: `${settings.waterGoal} glasses`, color: '#00d4ff' },
                    ].map((goal, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--border-subtle)' : 'none' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${goal.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <goal.icon size={18} style={{ color: goal.color }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 500 }}>{goal.label}</div>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: goal.color }}>{goal.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Body Stats */}
            <div className="section">
                <div className="section-header">
                    <h3 className="section-title">Body Stats</h3>
                </div>
                <div className="metric-row">
                    <div className="metric-item">
                        <Weight size={18} style={{ color: 'var(--text-secondary)', marginBottom: 4 }} />
                        <div className="metric-value">{settings.weight}</div>
                        <div className="metric-label">KG</div>
                    </div>
                    <div className="metric-item">
                        <Ruler size={18} style={{ color: 'var(--text-secondary)', marginBottom: 4 }} />
                        <div className="metric-value">{settings.height}</div>
                        <div className="metric-label">CM</div>
                    </div>
                    <div className="metric-item">
                        <Calendar size={18} style={{ color: 'var(--text-secondary)', marginBottom: 4 }} />
                        <div className="metric-value">{settings.age}</div>
                        <div className="metric-label">YEARS</div>
                    </div>
                </div>
            </div>

            {/* Main Settings */}
            <div className="section">
                <div className="section-header">
                    <h3 className="section-title">Settings</h3>
                </div>
                <div className="settings-list">
                    {/* Appearance Dropdown - inside settings */}
                    <div className="settings-item" style={{ cursor: 'default' }}>
                        <div className="settings-icon" style={{ background: 'rgba(179,136,255,0.12)' }}>
                            <Palette size={18} style={{ color: '#b388ff' }} />
                        </div>
                        <div className="settings-info">
                            <div className="settings-name">Appearance</div>
                            <div className="settings-desc">Theme & display</div>
                        </div>
                        <select
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            id="select-theme"
                            style={{
                                background: 'var(--bg-elevated)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 8,
                                padding: '6px 28px 6px 10px',
                                fontSize: 13,
                                fontWeight: 500,
                                fontFamily: 'inherit',
                                cursor: 'pointer',
                                outline: 'none',
                                appearance: 'none',
                                WebkitAppearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238888a0' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 8px center',
                            }}
                        >
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                            <option value="system">System Default</option>
                        </select>
                    </div>

                    <div className="settings-item" onClick={() => onNavigate?.('notifications')} style={{ cursor: 'pointer' }}>
                        <div className="settings-icon" style={{ background: 'rgba(79,140,255,0.12)' }}>
                            <Bell size={18} style={{ color: '#4f8cff' }} />
                        </div>
                        <div className="settings-info">
                            <div className="settings-name">Notifications</div>
                            <div className="settings-desc">Reminders & alerts</div>
                        </div>
                        <div className="settings-arrow"><ChevronRight size={16} /></div>
                    </div>

                    <div className="settings-item" onClick={() => setShowExportModal(true)} style={{ cursor: 'pointer' }}>
                        <div className="settings-icon" style={{ background: 'rgba(255,145,0,0.12)' }}>
                            <FileText size={18} style={{ color: '#ff9100' }} />
                        </div>
                        <div className="settings-info">
                            <div className="settings-name">Export Reports</div>
                            <div className="settings-desc">Download PDF health reports</div>
                        </div>
                        <div className="settings-arrow"><ChevronRight size={16} /></div>
                    </div>

                    <div className="settings-item" onClick={() => setShowShareModal(true)} style={{ cursor: 'pointer' }}>
                        <div className="settings-icon" style={{ background: 'rgba(0,230,118,0.12)' }}>
                            <Share2 size={18} style={{ color: '#00e676' }} />
                        </div>
                        <div className="settings-info">
                            <div className="settings-name">Share App</div>
                            <div className="settings-desc">Invite friends to VYBE</div>
                        </div>
                        <div className="settings-arrow"><ChevronRight size={16} /></div>
                    </div>

                    <div className="settings-item" style={{ cursor: 'pointer' }}>
                        <div className="settings-icon" style={{ background: 'rgba(0,230,118,0.12)' }}>
                            <Shield size={18} style={{ color: '#00e676' }} />
                        </div>
                        <div className="settings-info">
                            <div className="settings-name">Privacy & Security</div>
                            <div className="settings-desc">Data protection • GDPR compliant</div>
                        </div>
                        <div className="settings-arrow"><ChevronRight size={16} /></div>
                    </div>

                    <div className="settings-item" onClick={() => onNavigate?.('support')} style={{ cursor: 'pointer' }}>
                        <div className="settings-icon" style={{ background: 'rgba(0,212,255,0.12)' }}>
                            <HelpCircle size={18} style={{ color: '#00d4ff' }} />
                        </div>
                        <div className="settings-info">
                            <div className="settings-name">Help & Support</div>
                            <div className="settings-desc">FAQs and contact support</div>
                        </div>
                        <div className="settings-arrow"><ChevronRight size={16} /></div>
                    </div>

                    <div className="settings-item" style={{ cursor: 'pointer' }}>
                        <div className="settings-icon" style={{ background: 'rgba(255,215,64,0.12)' }}>
                            <Star size={18} style={{ color: '#ffd740' }} />
                        </div>
                        <div className="settings-info">
                            <div className="settings-name">Rate VYBE</div>
                            <div className="settings-desc">Share your feedback</div>
                        </div>
                        <div className="settings-arrow"><ChevronRight size={16} /></div>
                    </div>

                    <div className="settings-item" style={{ cursor: 'pointer' }}>
                        <div className="settings-icon" style={{ background: 'rgba(136,136,160,0.12)' }}>
                            <Info size={18} style={{ color: '#8888a0' }} />
                        </div>
                        <div className="settings-info">
                            <div className="settings-name">About</div>
                            <div className="settings-desc">Version 2.0.0</div>
                        </div>
                        <div className="settings-arrow"><ChevronRight size={16} /></div>
                    </div>
                </div>
            </div>

            {/* Logout */}
            <button className="btn btn-danger" onClick={handleLogout} style={{ marginTop: 8, marginBottom: 32 }} id="btn-logout">
                <LogOut size={18} /> Sign Out
            </button>

            {/* Edit Settings Modal */}
            {showSettingsModal && editSettings && (
                <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
                    <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <h3 className="modal-title">Edit Goals & Profile</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group">
                                <label className="input-label">Step Goal</label>
                                <input className="input-field" type="number" value={editSettings.stepGoal} onChange={e => setEditSettings({ ...editSettings, stepGoal: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Calorie Goal</label>
                                <input className="input-field" type="number" value={editSettings.calorieGoal} onChange={e => setEditSettings({ ...editSettings, calorieGoal: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Sleep Goal (hrs)</label>
                                <input className="input-field" type="number" value={editSettings.sleepGoal} onChange={e => setEditSettings({ ...editSettings, sleepGoal: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Water (glasses)</label>
                                <input className="input-field" type="number" value={editSettings.waterGoal} onChange={e => setEditSettings({ ...editSettings, waterGoal: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Weight (kg)</label>
                                <input className="input-field" type="number" value={editSettings.weight} onChange={e => setEditSettings({ ...editSettings, weight: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Height (cm)</label>
                                <input className="input-field" type="number" value={editSettings.height} onChange={e => setEditSettings({ ...editSettings, height: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Age</label>
                                <input className="input-field" type="number" value={editSettings.age} onChange={e => setEditSettings({ ...editSettings, age: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Gender</label>
                                <select className="input-field" value={editSettings.gender} onChange={e => setEditSettings({ ...editSettings, gender: e.target.value })}>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setShowSettingsModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveSettings} id="btn-save-settings">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Export Modal */}
            {showExportModal && (
                <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
                    <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <h3 className="modal-title">📊 Export Reports</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button className="settings-item" onClick={() => { downloadDailyReport(); setShowExportModal(false); }} style={{ cursor: 'pointer', background: 'var(--bg-card)' }}>
                                <div className="settings-icon" style={{ background: 'rgba(79,140,255,0.12)' }}>
                                    <FileText size={18} style={{ color: '#4f8cff' }} />
                                </div>
                                <div className="settings-info">
                                    <div className="settings-name">Daily Report PDF</div>
                                    <div className="settings-desc">Today's complete health summary</div>
                                </div>
                                <div className="settings-arrow"><Download size={16} /></div>
                            </button>

                            <button className="settings-item" onClick={() => { downloadWeeklyReport(); setShowExportModal(false); }} style={{ cursor: 'pointer', background: 'var(--bg-card)' }}>
                                <div className="settings-icon" style={{ background: 'rgba(0,230,118,0.12)' }}>
                                    <FileText size={18} style={{ color: '#00e676' }} />
                                </div>
                                <div className="settings-info">
                                    <div className="settings-name">Weekly Report PDF</div>
                                    <div className="settings-desc">7-day performance summary</div>
                                </div>
                                <div className="settings-arrow"><Download size={16} /></div>
                            </button>

                            <button className="settings-item" onClick={() => { shareViaWhatsApp(); setShowExportModal(false); }} style={{ cursor: 'pointer', background: 'var(--bg-card)' }}>
                                <div className="settings-icon" style={{ background: 'rgba(0,230,118,0.12)' }}>
                                    <Share2 size={18} style={{ color: '#25D366' }} />
                                </div>
                                <div className="settings-info">
                                    <div className="settings-name">Share via WhatsApp</div>
                                    <div className="settings-desc">Send your daily summary</div>
                                </div>
                                <div className="settings-arrow"><ExternalLink size={16} /></div>
                            </button>

                            <button className="settings-item" onClick={() => { shareViaEmail(); setShowExportModal(false); }} style={{ cursor: 'pointer', background: 'var(--bg-card)' }}>
                                <div className="settings-icon" style={{ background: 'rgba(79,140,255,0.12)' }}>
                                    <Mail size={18} style={{ color: '#4f8cff' }} />
                                </div>
                                <div className="settings-info">
                                    <div className="settings-name">Share via Email</div>
                                    <div className="settings-desc">Email your health report</div>
                                </div>
                                <div className="settings-arrow"><ExternalLink size={16} /></div>
                            </button>

                            <button className="settings-item" onClick={() => { shareReport('daily'); setShowExportModal(false); }} style={{ cursor: 'pointer', background: 'var(--bg-card)' }}>
                                <div className="settings-icon" style={{ background: 'rgba(179,136,255,0.12)' }}>
                                    <Share2 size={18} style={{ color: '#b388ff' }} />
                                </div>
                                <div className="settings-info">
                                    <div className="settings-name">Share PDF</div>
                                    <div className="settings-desc">Share report using native share</div>
                                </div>
                                <div className="settings-arrow"><ExternalLink size={16} /></div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share App Modal */}
            {showShareModal && (
                <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
                    <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <h3 className="modal-title">🔗 Share VYBE</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                            Invite your friends to track their fitness journey!
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button className="btn btn-secondary" onClick={handleCopyLink} id="btn-copy-link">
                                {copiedLink ? <><Check size={16} style={{ color: 'var(--accent-green)' }} /> Link Copied!</> : <><Copy size={16} /> Copy App URL</>}
                            </button>

                            {navigator.share && (
                                <button className="btn btn-primary" onClick={handleNativeShare} id="btn-native-share">
                                    <Share2 size={16} /> Share via...
                                </button>
                            )}

                            <button className="btn btn-secondary" onClick={() => { shareViaWhatsApp(); setShowShareModal(false); }}>
                                <span style={{ fontSize: 18 }}>💬</span> Share on WhatsApp
                            </button>

                            <button className="btn btn-secondary" onClick={() => {
                                const text = encodeURIComponent('Check out VYBE — Own Your Vybe! 💪 ' + window.location.origin);
                                window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
                                setShowShareModal(false);
                            }}>
                                <span style={{ fontSize: 18 }}>🐦</span> Share on Twitter
                            </button>

                            <button className="btn btn-secondary" onClick={() => { shareViaEmail(); setShowShareModal(false); }}>
                                <Mail size={16} /> Share via Email
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
