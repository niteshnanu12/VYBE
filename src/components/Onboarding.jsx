import React, { useState } from 'react';
import { Activity, Footprints, Moon, Droplets, UtensilsCrossed, TrendingUp, ChevronRight } from 'lucide-react';
import { setOnboarded, saveSettings, getSettings } from '../utils/storage.js';

const steps = [
    {
        icon: Activity,
        title: 'Welcome to VYBE',
        subtitle: 'Own Your Vybe — AI-powered fitness & lifestyle',
        description: 'Track steps, activity, sleep, nutrition, and hydration — all from your phone. No wearable needed.',
        color: '#4f8cff',
    },
    {
        icon: Footprints,
        title: 'Step & Activity Tracking',
        subtitle: 'Move more, live better',
        description: 'We use your phone\'s sensors to count steps and detect activities like walking, running, and cycling.',
        color: '#00e676',
    },
    {
        icon: Moon,
        title: 'Sleep & Recovery',
        subtitle: 'Understand your rest',
        description: 'Monitor sleep duration, quality, and get a daily recovery score to know when you\'re ready to push hard.',
        color: '#b388ff',
    },
    {
        icon: UtensilsCrossed,
        title: 'Nutrition & Hydration',
        subtitle: 'Fuel your body right',
        description: 'Log meals, track macros, and stay hydrated with smart reminders throughout the day.',
        color: '#ff9100',
    },
    {
        icon: TrendingUp,
        title: 'Growth Index',
        subtitle: 'See your progress',
        description: 'Our unique Growth Index combines all your health data into one score that tracks your overall improvement.',
        color: '#00d4ff',
    },
];

export default function Onboarding({ user, onComplete }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [profileForm, setProfileForm] = useState({
        name: user?.displayName || '',
        email: user?.email || '',
        dob: '',
        mobile: '',
        height: '170',
        weight: '70',
        gender: 'male',
        fitnessGoal: 'Maintenance',
        stepGoal: '10000',
    });

    const isLast = currentStep === steps.length;
    const isFeatureStep = currentStep < steps.length;

    const handleNext = () => {
        if (isLast) {
            if (!profileForm.name || !profileForm.email) {
                alert('Please provide your name and email to continue.');
                return;
            }

            const settings = getSettings();
            saveSettings({
                ...settings,
                weight: parseInt(profileForm.weight) || 70,
                height: parseInt(profileForm.height) || 170,
                gender: profileForm.gender,
                fitnessGoal: profileForm.fitnessGoal,
                stepGoal: parseInt(profileForm.stepGoal) || 10000,
            });
            setOnboarded();
            onComplete({
                id: user?.uid || 'local-user-' + Date.now().toString(),
                name: profileForm.name,
                email: profileForm.email,
                dob: profileForm.dob,
                mobile: profileForm.mobile,
                activated: true
            });
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const step = steps[currentStep];

    return (
        <div className="app-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, minHeight: '100vh' }}>
            {isFeatureStep ? (
                <div className="onboarding-step" key={currentStep} style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                    <div style={{
                        width: 80, height: 80,
                        borderRadius: 24,
                        background: `${step.color}18`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 32px',
                        border: `1px solid ${step.color}30`,
                    }}>
                        <step.icon size={36} style={{ color: step.color }} />
                    </div>
                    <h2>{step.title}</h2>
                    <p style={{ color: step.color, fontWeight: 600, fontSize: 14, marginBottom: 12 }}>{step.subtitle}</p>
                    <p>{step.description}</p>
                </div>
            ) : (
                <div style={{ width: '100%', maxWidth: 360, animation: 'fadeInUp 0.5s ease-out' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Set Up Your Profile</h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32 }}>Help us personalize your experience</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 12 }}>
                        <div className="input-group">
                            <label className="input-label">Full Name *</label>
                            <input className="input-field" type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="John Doe" required />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Email Address *</label>
                            <input className="input-field" type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} placeholder="john@example.com" required />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                        <div className="input-group">
                            <label className="input-label">Date of Birth</label>
                            <input className="input-field" type="date" value={profileForm.dob} onChange={e => setProfileForm({ ...profileForm, dob: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Mobile Number</label>
                            <input className="input-field" type="tel" value={profileForm.mobile} onChange={e => setProfileForm({ ...profileForm, mobile: e.target.value })} />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Height (cm)</label>
                            <input className="input-field" type="number" value={profileForm.height} onChange={e => setProfileForm({ ...profileForm, height: e.target.value })} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">Weight (kg)</label>
                            <input className="input-field" type="number" value={profileForm.weight} onChange={e => setProfileForm({ ...profileForm, weight: e.target.value })} />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Gender</label>
                            <select className="input-field" value={profileForm.gender} onChange={e => setProfileForm({ ...profileForm, gender: e.target.value })}>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Fitness Goal</label>
                            <select className="input-field" value={profileForm.fitnessGoal} onChange={e => setProfileForm({ ...profileForm, fitnessGoal: e.target.value })}>
                                <option value="Weight Loss">Weight Loss</option>
                                <option value="Muscle Gain">Muscle Gain</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Endurance">Endurance</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 8, margin: '40px 0 24px' }}>
                {[...Array(steps.length + 1)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            width: i === currentStep ? 24 : 8,
                            height: 8,
                            borderRadius: 4,
                            background: i === currentStep ? 'var(--accent-blue)' : i < currentStep ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                            transition: 'all 0.3s ease',
                        }}
                    />
                ))}
            </div>

            <button className="btn btn-primary" onClick={handleNext} style={{ maxWidth: 360 }} id="btn-onboarding-next">
                {isLast ? "Let's Go!" : 'Continue'}
                <ChevronRight size={18} />
            </button>

            {isFeatureStep ? (
                <button
                    className="btn btn-ghost"
                    onClick={() => setCurrentStep(steps.length)}
                    style={{ maxWidth: 360, marginTop: 8, fontSize: 13 }}
                    id="btn-skip"
                >
                    Skip Intro
                </button>
            ) : null}
        </div>
    );
}
