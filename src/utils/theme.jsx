// ===== VYBE - Theme System =====

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = {
    DARK: 'dark',
    LIGHT: 'light',
    SYSTEM: 'system',
};

// Light theme CSS variables
const lightThemeVars = {
    '--bg-primary': '#f5f5fa',
    '--bg-secondary': '#eeeef4',
    '--bg-card': '#ffffff',
    '--bg-card-hover': '#f4f4fa',
    '--bg-elevated': '#f0f0f6',
    '--bg-input': '#f5f5fa',
    '--text-primary': '#1a1a2e',
    '--text-secondary': '#6b6b80',
    '--text-muted': '#9999ac',
    '--text-accent': '#3b6fdb',
    '--border-subtle': 'rgba(0, 0, 0, 0.06)',
    '--border-light': 'rgba(0, 0, 0, 0.1)',
    '--border-accent': 'rgba(59, 111, 219, 0.25)',
    '--shadow-sm': '0 1px 4px rgba(0, 0, 0, 0.05)',
    '--shadow-md': '0 4px 16px rgba(0, 0, 0, 0.07)',
    '--shadow-lg': '0 8px 32px rgba(0, 0, 0, 0.09)',
    '--shadow-glow-blue': '0 0 24px rgba(59, 111, 219, 0.1)',
    '--shadow-glow-green': '0 0 24px rgba(0, 180, 90, 0.1)',
    '--gradient-card': 'linear-gradient(145deg, rgba(0, 0, 0, 0.01) 0%, rgba(0, 0, 0, 0.03) 100%)',
    '--gradient-dark': 'linear-gradient(180deg, #f5f5fa 0%, #eeeef4 100%)',
    '--nav-bg': 'rgba(245, 245, 250, 0.94)',
};

// Dark theme CSS variables (defaults already set in CSS)
const darkThemeVars = {
    '--bg-primary': '#0a0a0f',
    '--bg-secondary': '#12121a',
    '--bg-card': '#1a1a25',
    '--bg-card-hover': '#22222f',
    '--bg-elevated': '#252535',
    '--bg-input': '#16161f',
    '--text-primary': '#f0f0f5',
    '--text-secondary': '#8888a0',
    '--text-muted': '#55556a',
    '--text-accent': '#4f8cff',
    '--border-subtle': 'rgba(255, 255, 255, 0.06)',
    '--border-light': 'rgba(255, 255, 255, 0.1)',
    '--border-accent': 'rgba(79, 140, 255, 0.3)',
    '--shadow-sm': '0 2px 8px rgba(0, 0, 0, 0.3)',
    '--shadow-md': '0 4px 20px rgba(0, 0, 0, 0.4)',
    '--shadow-lg': '0 8px 40px rgba(0, 0, 0, 0.5)',
    '--shadow-glow-blue': '0 0 30px rgba(79, 140, 255, 0.15)',
    '--shadow-glow-green': '0 0 30px rgba(0, 230, 118, 0.15)',
    '--gradient-card': 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
    '--gradient-dark': 'linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)',
    '--nav-bg': 'rgba(10, 10, 15, 0.94)',
};

function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return THEMES.LIGHT;
    }
    return THEMES.DARK;
}

function applyThemeVars(resolvedTheme) {
    const vars = resolvedTheme === THEMES.LIGHT ? lightThemeVars : darkThemeVars;
    const root = document.documentElement;

    Object.entries(vars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });

    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute('content', resolvedTheme === THEMES.LIGHT ? '#f5f5fa' : '#0a0a0f');
    }

    document.body.setAttribute('data-theme', resolvedTheme);
}

export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        return localStorage.getItem('vt_theme') || THEMES.DARK;
    });

    const resolvedTheme = theme === THEMES.SYSTEM ? getSystemTheme() : theme;

    useEffect(() => {
        applyThemeVars(resolvedTheme);
    }, [resolvedTheme]);

    // Listen for system theme changes
    useEffect(() => {
        if (theme !== THEMES.SYSTEM) return;

        const mq = window.matchMedia('(prefers-color-scheme: light)');
        const handler = () => applyThemeVars(getSystemTheme());
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [theme]);

    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem('vt_theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
