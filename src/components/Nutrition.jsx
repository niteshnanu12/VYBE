import React, { useState, useEffect, useRef } from 'react';
import { UtensilsCrossed, Droplets, Plus, Coffee, Sun, Sunset, Moon as MoonIcon, Apple, Beef, Wheat, Droplet, ChevronRight, Settings, ChevronDown } from 'lucide-react';
import ProgressRing from './ProgressRing.jsx';
import { getNutritionForDate, saveNutrition, addMeal, getHydrationForDate, saveHydration, getSettings, saveSettings } from '../utils/storage.js';
import { checkHydrationMilestone, checkCalorieAlert } from '../utils/notifications.js';
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from 'chart.js';

Chart.register(ArcElement, Tooltip, Legend, DoughnutController);

const mealTypes = [
    { type: 'breakfast', label: 'Breakfast', icon: Coffee, emoji: '🥣' },
    { type: 'lunch', label: 'Lunch', icon: Sun, emoji: '🥗' },
    { type: 'snack', label: 'Snack', icon: Apple, emoji: '🍎' },
    { type: 'dinner', label: 'Dinner', icon: Sunset, emoji: '🍽️' },
];

const quickFoods = [
    { name: 'Oatmeal', calories: 300, protein: 10, carbs: 50, fats: 6, emoji: '🥣' },
    { name: 'Chicken Breast', calories: 280, protein: 45, carbs: 0, fats: 8, emoji: '🍗' },
    { name: 'Rice Bowl', calories: 400, protein: 10, carbs: 80, fats: 5, emoji: '🍚' },
    { name: 'Protein Shake', calories: 220, protein: 30, carbs: 10, fats: 5, emoji: '🥤' },
    { name: 'Salad', calories: 180, protein: 8, carbs: 15, fats: 8, emoji: '🥗' },
    { name: 'Banana', calories: 105, protein: 1, carbs: 27, fats: 0, emoji: '🍌' },
    { name: 'Eggs (2)', calories: 196, protein: 14, carbs: 1, fats: 14, emoji: '🥚' },
    { name: 'Greek Yogurt', calories: 150, protein: 15, carbs: 12, fats: 4, emoji: '🥛' },
];

const glassSizePresets = [
    { label: 'Small', ml: 150, emoji: '🥤' },
    { label: 'Medium', ml: 250, emoji: '🥛' },
    { label: 'Large', ml: 350, emoji: '🍶' },
    { label: 'Bottle', ml: 500, emoji: '🫗' },
];

export default function Nutrition({ selectedDate }) {
    const today = new Date().toISOString().split('T')[0];
    const isToday = selectedDate === today;

    const [nutrition, setNutrition] = useState(getNutritionForDate(selectedDate));
    const [hydration, setHydration] = useState(getHydrationForDate(selectedDate));
    const [tab, setTab] = useState('food');
    const [showAddMealModal, setShowAddMealModal] = useState(false);
    const [showHydrationSettings, setShowHydrationSettings] = useState(false);
    const [mealForm, setMealForm] = useState({ name: '', type: 'lunch', calories: '', protein: '', carbs: '', fats: '' });
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // Settings for hydration customization
    const [hydrationSettings, setHydrationSettings] = useState(() => {
        const s = getSettings();
        return {
            glassSize: s.glassSize || 250,
            waterGoal: s.waterGoal || 8,
            waterGoalMl: s.waterGoalMl || 2000,
        };
    });

    // Update data when date changes
    useEffect(() => {
        setNutrition(getNutritionForDate(selectedDate));
        setHydration(getHydrationForDate(selectedDate));
    }, [selectedDate]);

    useEffect(() => {
        if (tab === 'food' && chartRef.current && nutrition.calories > 0) {
            if (chartInstance.current) chartInstance.current.destroy();

            chartInstance.current = new Chart(chartRef.current, {
                type: 'doughnut',
                data: {
                    labels: ['Protein', 'Carbs', 'Fats'],
                    datasets: [{
                        data: [nutrition.protein * 4, nutrition.carbs * 4, nutrition.fats * 9],
                        backgroundColor: ['#4f8cff', '#00e676', '#ff9100'],
                        borderWidth: 0,
                        borderRadius: 4,
                        spacing: 3,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '72%',
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#1a1a25',
                            titleColor: '#f0f0f5',
                            bodyColor: '#8888a0',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderWidth: 1,
                            padding: 10,
                            cornerRadius: 8,
                            callbacks: {
                                label: (ctx) => `${ctx.label}: ${Math.round(ctx.raw)} cal`,
                            },
                        },
                    },
                },
            });
        }

        return () => {
            if (chartInstance.current) chartInstance.current.destroy();
        };
    }, [tab, nutrition]);

    const handleAddMeal = () => {
        const meal = {
            name: mealForm.name || 'Custom Meal',
            type: mealForm.type,
            calories: parseInt(mealForm.calories) || 0,
            protein: parseInt(mealForm.protein) || 0,
            carbs: parseInt(mealForm.carbs) || 0,
            fats: parseInt(mealForm.fats) || 0,
        };
        const updated = addMeal(meal);
        setNutrition(updated);
        setShowAddMealModal(false);
        setMealForm({ name: '', type: 'lunch', calories: '', protein: '', carbs: '', fats: '' });

        // Check calorie alerts
        checkCalorieAlert();
    };

    const handleQuickAdd = (food) => {
        const updated = addMeal({ ...food, type: 'snack' });
        setNutrition(updated);
    };

    const handleWaterToggle = (index) => {
        if (!isToday) return; // Don't allow editing historical data
        const newGlasses = index + 1 <= hydration.glasses ? index : index + 1;
        const currentGlassSize = hydrationSettings.glassSize;
        const updated = {
            ...hydration,
            glasses: newGlasses,
            ml: newGlasses * currentGlassSize,
            glassSize: currentGlassSize,
        };
        saveHydration(updated);
        setHydration(updated);

        // Check hydration milestones and trigger alerts
        checkHydrationMilestone(newGlasses);
    };

    const handleSaveHydrationSettings = () => {
        const newGoalMl = hydrationSettings.waterGoal * hydrationSettings.glassSize;
        const updatedSettings = {
            ...getSettings(),
            glassSize: hydrationSettings.glassSize,
            waterGoal: hydrationSettings.waterGoal,
            waterGoalMl: newGoalMl,
        };
        saveSettings(updatedSettings);

        // Update current hydration with new settings
        const updatedHydration = {
            ...hydration,
            goal: hydrationSettings.waterGoal,
            goalMl: newGoalMl,
            glassSize: hydrationSettings.glassSize,
            ml: hydration.glasses * hydrationSettings.glassSize,
        };
        saveHydration(updatedHydration);
        setHydration(updatedHydration);
        setShowHydrationSettings(false);
    };

    const macros = [
        { name: 'Protein', value: nutrition.protein, goal: nutrition.goals.protein, unit: 'g', color: '#4f8cff', icon: Beef },
        { name: 'Carbs', value: nutrition.carbs, goal: nutrition.goals.carbs, unit: 'g', color: '#00e676', icon: Wheat },
        { name: 'Fats', value: nutrition.fats, goal: nutrition.goals.fats, unit: 'g', color: '#ff9100', icon: Droplet },
    ];

    const calProgress = Math.min((nutrition.calories / nutrition.goals.calories) * 100, 100);
    const hydrationProgress = Math.min((hydration.glasses / hydration.goal) * 100, 100);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Nutrition</h1>
                    <p className="header-subtitle">Track meals & hydration</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${tab === 'food' ? 'active' : ''}`} onClick={() => setTab('food')} id="tab-food">
                    🍽️ Food
                </button>
                <button className={`tab ${tab === 'water' ? 'active' : ''}`} onClick={() => setTab('water')} id="tab-water">
                    💧 Hydration
                </button>
            </div>

            {tab === 'food' ? (
                <>
                    {/* Calorie Ring */}
                    <div className="card" id="card-calorie-overview" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
                            <ProgressRing size={140} strokeWidth={10} progress={calProgress} color="#ff9100">
                                <span className="card-value" style={{ fontSize: 28, color: '#ff9100' }}>{nutrition.calories}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>/ {nutrition.goals.calories} kcal</span>
                            </ProgressRing>

                            {nutrition.calories > 0 && (
                                <div style={{ width: 110, height: 110 }}>
                                    <canvas ref={chartRef} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Macros */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        {macros.map((macro, i) => (
                            <div key={i} className="macro-item" style={{ flex: 1 }}>
                                <div className="macro-name">{macro.name}</div>
                                <div className="macro-value" style={{ color: macro.color }}>
                                    {macro.value}<span className="macro-unit">{macro.unit}</span>
                                </div>
                                <div className="macro-bar">
                                    <div className="macro-bar-fill" style={{ width: `${Math.min((macro.value / macro.goal) * 100, 100)}%`, background: macro.color }} />
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>of {macro.goal}{macro.unit}</div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Add */}
                    {isToday && (
                        <div className="section">
                            <div className="section-header">
                                <h3 className="section-title">Quick Add</h3>
                                <button className="section-link" onClick={() => setShowAddMealModal(true)} id="btn-custom-meal">
                                    Custom <ChevronRight size={14} style={{ display: 'inline' }} />
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                                {quickFoods.map((food, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleQuickAdd(food)}
                                        style={{
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-subtle)',
                                            borderRadius: 12,
                                            padding: '12px 4px',
                                            textAlign: 'center',
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer',
                                        }}
                                        className="quick-food-btn"
                                    >
                                        <div style={{ fontSize: 24, marginBottom: 4 }}>{food.emoji}</div>
                                        <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-secondary)', lineHeight: 1.2 }}>{food.name}</div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{food.calories} cal</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Meal Log */}
                    <div className="section">
                        <div className="section-header">
                            <h3 className="section-title">{isToday ? "Today's" : "Day's"} Meals</h3>
                            {isToday && (
                                <button className="btn btn-sm btn-secondary" onClick={() => setShowAddMealModal(true)} style={{ width: 'auto' }} id="btn-add-meal">
                                    <Plus size={14} /> Add
                                </button>
                            )}
                        </div>

                        {nutrition.meals.length === 0 ? (
                            <div className="empty-state">
                                <UtensilsCrossed />
                                <h3>No meals logged</h3>
                                <p>{isToday ? 'Tap quick add or log a custom meal' : 'No meals were logged on this day'}</p>
                            </div>
                        ) : (
                            nutrition.meals.map((meal, i) => (
                                <div className="food-log-item" key={meal.id || i}>
                                    <div className="food-log-icon">{mealTypes.find(m => m.type === meal.type)?.emoji || '🍽️'}</div>
                                    <div className="food-log-info">
                                        <div className="food-log-name">{meal.name}</div>
                                        <div className="food-log-detail">
                                            P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fats}g
                                            {meal.time && ` • ${meal.time}`}
                                        </div>
                                    </div>
                                    <div className="food-log-cal">{meal.calories}</div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                /* Water Tab */
                <>
                    <div className="card" id="card-hydration" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                            <ProgressRing size={160} strokeWidth={10} progress={hydrationProgress} color="#00d4ff">
                                <Droplets size={24} style={{ color: '#00d4ff', marginBottom: 4 }} />
                                <span className="card-value" style={{ fontSize: 32, color: '#00d4ff' }}>{hydration.glasses}</span>
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>of {hydration.goal} glasses</span>
                            </ProgressRing>
                        </div>

                        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                            {hydration.ml || 0} ml / {hydration.goalMl || (hydration.goal * (hydrationSettings.glassSize || 250))} ml
                        </div>

                        <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <span className="stat-badge" style={{
                                background: hydrationProgress >= 100 ? 'rgba(0,230,118,0.12)' : 'rgba(0,212,255,0.12)',
                                color: hydrationProgress >= 100 ? '#00e676' : '#00d4ff'
                            }}>
                                {hydrationProgress >= 100 ? '✅ Goal completed!' : `${Math.round(hydrationProgress)}% of daily goal`}
                            </span>
                            <span className="stat-badge" style={{
                                background: 'rgba(179, 136, 255, 0.12)',
                                color: '#b388ff',
                                fontSize: 11,
                            }}>
                                🥛 {hydrationSettings.glassSize}ml / glass
                            </span>
                        </div>
                    </div>

                    {/* Water Glasses Grid */}
                    <div className="card" id="card-water-glasses">
                        <div className="card-header">
                            <span className="card-title">Tap to log water</span>
                            <button
                                className="section-link"
                                onClick={() => setShowHydrationSettings(true)}
                                id="btn-hydration-settings"
                                style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', background: 'none', border: 'none' }}
                            >
                                <Settings size={14} /> Customize
                            </button>
                        </div>
                        <div className="water-glasses">
                            {[...Array(hydration.goal)].map((_, i) => (
                                <button
                                    key={i}
                                    className={`water-glass ${i < hydration.glasses ? 'filled' : ''}`}
                                    onClick={() => handleWaterToggle(i)}
                                    disabled={!isToday}
                                    id={`water-glass-${i}`}
                                >
                                    <Droplets size={20} />
                                    <span style={{ fontSize: 9, color: i < hydration.glasses ? '#fff' : 'var(--text-muted)' }}>
                                        {hydrationSettings.glassSize}ml
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Hydration Tips */}
                    <div className="card" id="card-hydration-tips">
                        <div className="card-header">
                            <span className="card-title">💧 Hydration Tips</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {[
                                'Drink water first thing in the morning',
                                'Carry a reusable water bottle',
                                'Set reminders every 2 hours',
                                'Drink before, during, and after exercise',
                                'Eat water-rich fruits and vegetables',
                            ].map((tip, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                                    <span style={{ width: 6, height: 6, borderRadius: 3, background: '#00d4ff', flexShrink: 0 }} />
                                    {tip}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Add Meal Modal */}
            {showAddMealModal && (
                <div className="modal-overlay" onClick={() => setShowAddMealModal(false)}>
                    <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <h3 className="modal-title">Log Meal</h3>

                        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                            {mealTypes.map(mt => (
                                <button
                                    key={mt.type}
                                    className={`pill ${mealForm.type === mt.type ? 'active' : ''}`}
                                    onClick={() => setMealForm({ ...mealForm, type: mt.type })}
                                >
                                    {mt.emoji} {mt.label}
                                </button>
                            ))}
                        </div>

                        <div className="input-group">
                            <label className="input-label">Meal Name</label>
                            <input className="input-field" placeholder="e.g. Grilled Chicken Salad" value={mealForm.name} onChange={e => setMealForm({ ...mealForm, name: e.target.value })} id="input-meal-name" />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="input-group">
                                <label className="input-label">Calories</label>
                                <input className="input-field" type="number" placeholder="350" value={mealForm.calories} onChange={e => setMealForm({ ...mealForm, calories: e.target.value })} id="input-meal-cal" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Protein (g)</label>
                                <input className="input-field" type="number" placeholder="25" value={mealForm.protein} onChange={e => setMealForm({ ...mealForm, protein: e.target.value })} id="input-meal-protein" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Carbs (g)</label>
                                <input className="input-field" type="number" placeholder="40" value={mealForm.carbs} onChange={e => setMealForm({ ...mealForm, carbs: e.target.value })} id="input-meal-carbs" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Fats (g)</label>
                                <input className="input-field" type="number" placeholder="12" value={mealForm.fats} onChange={e => setMealForm({ ...mealForm, fats: e.target.value })} id="input-meal-fats" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                            <button className="btn btn-secondary" onClick={() => setShowAddMealModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleAddMeal} id="btn-save-meal">Add Meal</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hydration Settings Modal */}
            {showHydrationSettings && (
                <div className="modal-overlay" onClick={() => setShowHydrationSettings(false)}>
                    <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <h3 className="modal-title">🥛 Hydration Preferences</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                            Customize your daily water intake goal and glass size.
                        </p>

                        {/* Glass Size Presets */}
                        <div className="input-group">
                            <label className="input-label">Glass Size</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 6 }}>
                                {glassSizePresets.map(preset => (
                                    <button
                                        key={preset.ml}
                                        className={`pill ${hydrationSettings.glassSize === preset.ml ? 'active' : ''}`}
                                        onClick={() => setHydrationSettings({ ...hydrationSettings, glassSize: preset.ml })}
                                        style={{
                                            flexDirection: 'column',
                                            padding: '12px 6px',
                                            height: 'auto',
                                            textAlign: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <span style={{ fontSize: 20 }}>{preset.emoji}</span>
                                        <span style={{ fontSize: 11, fontWeight: 600 }}>{preset.label}</span>
                                        <span style={{ fontSize: 10, opacity: 0.7 }}>{preset.ml}ml</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Glass Size */}
                        <div className="input-group">
                            <label className="input-label">Custom Glass Size (ml)</label>
                            <input
                                className="input-field"
                                type="number"
                                value={hydrationSettings.glassSize}
                                onChange={e => setHydrationSettings({ ...hydrationSettings, glassSize: Math.max(50, parseInt(e.target.value) || 250) })}
                                min="50"
                                max="1000"
                                id="input-glass-size"
                            />
                        </div>

                        {/* Number of Glasses */}
                        <div className="input-group">
                            <label className="input-label">Glasses Per Day</label>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setHydrationSettings({ ...hydrationSettings, waterGoal: Math.max(1, hydrationSettings.waterGoal - 1) })}
                                    style={{ width: 48, padding: 8, justifyContent: 'center' }}
                                >-</button>
                                <input
                                    className="input-field"
                                    type="number"
                                    value={hydrationSettings.waterGoal}
                                    onChange={e => setHydrationSettings({ ...hydrationSettings, waterGoal: Math.max(1, parseInt(e.target.value) || 8) })}
                                    style={{ textAlign: 'center', flex: 1 }}
                                    id="input-water-goal"
                                />
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => setHydrationSettings({ ...hydrationSettings, waterGoal: Math.min(20, hydrationSettings.waterGoal + 1) })}
                                    style={{ width: 48, padding: 8, justifyContent: 'center' }}
                                >+</button>
                            </div>
                        </div>

                        {/* Total ml Preview */}
                        <div className="card" style={{
                            background: 'rgba(0, 212, 255, 0.06)',
                            border: '1px solid rgba(0, 212, 255, 0.2)',
                            textAlign: 'center',
                            padding: 16,
                            marginBottom: 20,
                        }}>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Daily Goal</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: '#00d4ff', fontFamily: 'var(--font-display)' }}>
                                {hydrationSettings.waterGoal * hydrationSettings.glassSize} ml
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {hydrationSettings.waterGoal} × {hydrationSettings.glassSize}ml glasses
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary" onClick={() => setShowHydrationSettings(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveHydrationSettings} id="btn-save-hydration-settings">
                                Save Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
