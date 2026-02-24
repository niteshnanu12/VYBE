import React, { useState } from 'react';
import { Home, Activity, Moon, UtensilsCrossed, User, Users, MoreHorizontal } from 'lucide-react';

const primaryTabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'nutrition', label: 'Nutrition', icon: UtensilsCrossed },
    { id: 'profile', label: 'Profile', icon: User },
];

export default function BottomNav({ activeTab, onTabChange }) {
    // Map sub-pages to their parent tab highlight
    const activeHighlight = ['support', 'notifications'].includes(activeTab) ? 'profile' :
        activeTab === 'recovery' ? 'home' : activeTab;

    return (
        <nav className="bottom-nav" id="bottom-nav">
            {primaryTabs.map(tab => (
                <button
                    key={tab.id}
                    className={`nav-item ${activeHighlight === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                    id={`nav-${tab.id}`}
                    aria-label={tab.label}
                >
                    <tab.icon />
                    <span>{tab.label}</span>
                </button>
            ))}
        </nav>
    );
}
