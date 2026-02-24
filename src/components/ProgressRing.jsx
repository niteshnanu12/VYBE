import React from 'react';

export default function ProgressRing({
    size = 160,
    strokeWidth = 8,
    progress = 0,
    color = '#4f8cff',
    bgColor = 'rgba(255,255,255,0.06)',
    children
}) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

    return (
        <div className="progress-ring-container" style={{ width: size, height: size }}>
            <svg
                className="progress-ring"
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
            >
                <defs>
                    <linearGradient id={`ring-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} />
                        <stop offset="100%" stopColor={color} stopOpacity="0.6" />
                    </linearGradient>
                </defs>
                <circle
                    className="progress-ring-bg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={bgColor}
                    strokeWidth={strokeWidth}
                />
                <circle
                    className="progress-ring-fill"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#ring-gradient-${color.replace('#', '')})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        '--ring-circumference': circumference,
                        '--ring-offset': offset,
                        animation: 'ringProgress 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                    }}
                />
            </svg>
            <div className="progress-ring-content">
                {children}
            </div>
        </div>
    );
}
