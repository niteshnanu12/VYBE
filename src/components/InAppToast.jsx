import React, { useState, useEffect } from 'react';
import { X, Droplets, Trophy, AlertTriangle, Moon, Footprints, Utensils, Activity, FileText, Bell, Zap } from 'lucide-react';
import { subscribeToToasts, dismissToast, getActiveToasts } from '../utils/notifications.js';

const TYPE_CONFIG = {
    info: { bg: 'rgba(79, 140, 255, 0.12)', border: 'rgba(79, 140, 255, 0.3)', icon: Bell, color: '#4f8cff' },
    success: { bg: 'rgba(0, 230, 118, 0.12)', border: 'rgba(0, 230, 118, 0.3)', icon: Trophy, color: '#00e676' },
    warning: { bg: 'rgba(255, 145, 0, 0.12)', border: 'rgba(255, 145, 0, 0.3)', icon: AlertTriangle, color: '#ff9100' },
    danger: { bg: 'rgba(255, 71, 87, 0.12)', border: 'rgba(255, 71, 87, 0.3)', icon: AlertTriangle, color: '#ff4757' },
    hydration: { bg: 'rgba(0, 212, 255, 0.12)', border: 'rgba(0, 212, 255, 0.3)', icon: Droplets, color: '#00d4ff' },
    milestone: { bg: 'rgba(255, 215, 64, 0.12)', border: 'rgba(255, 215, 64, 0.3)', icon: Trophy, color: '#ffd740' },
};

export default function InAppToast() {
    const [toasts, setToasts] = useState(getActiveToasts());

    useEffect(() => {
        const unsub = subscribeToToasts(setToasts);
        return unsub;
    }, []);

    const visibleToasts = toasts.filter(t => t.visible);

    if (visibleToasts.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: '92%',
            maxWidth: 420,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            pointerEvents: 'none',
        }}>
            {visibleToasts.map((toast, i) => {
                const config = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info;
                const IconComp = config.icon;

                return (
                    <div
                        key={toast.id}
                        style={{
                            background: 'rgba(18, 18, 26, 0.95)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: `1px solid ${config.border}`,
                            borderRadius: 16,
                            padding: '14px 16px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                            animation: toast.visible ? 'toastSlideIn 0.4s ease-out' : 'toastSlideOut 0.3s ease-in forwards',
                            boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${config.border}`,
                            pointerEvents: 'auto',
                        }}
                    >
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: config.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <span style={{ fontSize: 18 }}>{toast.emoji || ''}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: config.color, lineHeight: 1.3 }}>
                                {toast.title}
                            </div>
                            {toast.body && (
                                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.4 }}>
                                    {toast.body}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => dismissToast(toast.id)}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                padding: 4, color: 'var(--text-muted)', flexShrink: 0,
                            }}
                        >
                            <X size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
