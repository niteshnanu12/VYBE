import React, { useState, useEffect, useRef } from 'react';
import { UtensilsCrossed, Droplets, Plus, Coffee, Sun, Sunset, Moon as MoonIcon, Apple, Beef, Wheat, Droplet, ChevronRight } from 'lucide-react';
import ProgressRing from './ProgressRing.jsx';
import { getTodayNutrition, saveNutrition, addMeal, getTodayHydration, saveHydration } from '../utils/storage.js';
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

export default function Nutrition() {
    const [nutrition, setNutrition] = useState(getTodayNutrition());
    const [hydration, setHydration] = useState(getTodayHydration());
    const [tab, setTab] = useState('food');
    const [showAddMealModal, setShowAddMealModal] = useState(false);
    const [mealForm, setMealForm] = useState({ name: '', type: 'lunch', calories: '', protein: '', carbs: '', fats: '' });
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

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
    };

    const handleQuickAdd = (food) => {
        const updated = addMeal({ ...food, type: 'snack' });
        setNutrition(updated);
    };

    const handleWaterToggle = (index) => {
        const newGlasses = index + 1 <= hydration.glasses ? index : index + 1;
        const updated = { ...hydration, glasses: newGlasses, ml: newGlasses * 250 };
        saveHydration(updated);
        setHydration(updated);
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

                    {/* Meal Log */}
                    <div className="section">
                        <div className="section-header">
                            <h3 className="section-title">Today's Meals</h3>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowAddMealModal(true)} style={{ width: 'auto' }} id="btn-add-meal">
                                <Plus size={14} /> Add
                            </button>
                        </div>

                        {nutrition.meals.length === 0 ? (
                            <div className="empty-state">
                                <UtensilsCrossed />
                                <h3>No meals logged</h3>
                                <p>Tap quick add or log a custom meal</p>
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
                            {hydration.ml} ml / {hydration.goalMl} ml
                        </div>

                        <div style={{ marginTop: 8 }}>
                            <span className="stat-badge" style={{
                                background: hydrationProgress >= 100 ? 'rgba(0,230,118,0.12)' : 'rgba(0,212,255,0.12)',
                                color: hydrationProgress >= 100 ? '#00e676' : '#00d4ff'
                            }}>
                                {hydrationProgress >= 100 ? '✅ Goal completed!' : `${Math.round(hydrationProgress)}% of daily goal`}
                            </span>
                        </div>
                    </div>

                    {/* Water Glasses Grid */}
                    <div className="card" id="card-water-glasses">
                        <div className="card-header">
                            <span className="card-title">Tap to log water</span>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>250ml per glass</span>
                        </div>
                        <div className="water-glasses">
                            {[...Array(hydration.goal)].map((_, i) => (
                                <button
                                    key={i}
                                    className={`water-glass ${i < hydration.glasses ? 'filled' : ''}`}
                                    onClick={() => handleWaterToggle(i)}
                                    id={`water-glass-${i}`}
                                >
                                    <Droplets size={20} />
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
        </div>
    );
}
