// ===== VYBE - PDF Export & Report Generation =====

import jsPDF from 'jspdf';
import { getTodaySteps, getWeeklySteps, getTodaySleep, getWeeklySleep, getTodayNutrition, getTodayHydration, calculateGrowthIndex, getUser } from './storage.js';
import { getScoreLabel } from './algorithms.js';

/**
 * Generate a comprehensive PDF health report
 */
export function generateDailyReport() {
    const user = getUser();
    const steps = getTodaySteps();
    const sleep = getTodaySleep();
    const nutrition = getTodayNutrition();
    const hydration = getTodayHydration();
    const growth = calculateGrowthIndex();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const doc = new jsPDF();
    let y = 20;

    // Header
    doc.setFillColor(79, 140, 255);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('VYBE', 15, 20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Daily Health Report', 15, 28);
    doc.text(today, 15, 35);
    doc.text(`${user?.name || 'User'}`, 195, 20, { align: 'right' });
    doc.setFontSize(9);
    doc.text(`DOB: ${user?.dob || 'N/A'} | Height: ${user?.height || 'N/A'}cm | Weight: ${user?.weight || 'N/A'}kg`, 195, 28, { align: 'right' });
    const bmi = user?.weight && user?.height ? (user.weight / Math.pow(user.height / 100, 2)).toFixed(1) : 'N/A';
    doc.text(`BMI: ${bmi}`, 195, 35, { align: 'right' });

    y = 52;
    doc.setTextColor(30, 30, 46);

    // Growth Index
    doc.setFillColor(240, 240, 245);
    doc.roundedRect(15, y - 5, 180, 25, 3, 3, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Overall Growth Index', 20, y + 5);
    doc.setFontSize(20);
    doc.setTextColor(79, 140, 255);
    doc.text(`${growth.growthIndex}/100`, 190, y + 7, { align: 'right' });
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 120);
    doc.text(getScoreLabel(growth.growthIndex), 190, y + 14, { align: 'right' });

    y += 35;
    doc.setTextColor(30, 30, 46);

    // Section: Steps & Activity
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 140, 255);
    doc.text('👣 Steps & Activity', 15, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 80);

    const stepsData = [
        ['Steps', `${steps.count.toLocaleString()} / ${steps.goal.toLocaleString()}`],
        ['Calories Burned', `${steps.calories} kcal`],
        ['Distance', `${steps.distance} km`],
        ['Completion', `${Math.round((steps.count / steps.goal) * 100)}%`],
    ];

    stepsData.forEach(([label, value]) => {
        doc.text(label, 20, y);
        doc.text(value, 190, y, { align: 'right' });
        y += 6;
    });

    y += 8;

    // Section: Sleep & Recovery
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(179, 136, 255);
    doc.text('😴 Sleep & Recovery', 15, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 80);

    const sleepData = [
        ['Duration', `${sleep.duration || 0} hours`],
        ['Quality Score', `${sleep.quality || 0}/100`],
        ['Deep Sleep', `${sleep.deepSleep || 0} hrs`],
        ['REM Sleep', `${sleep.rem || 0} hrs`],
        ['Recovery Score', `${sleep.recoveryScore || 0}/100`],
        ['Bedtime', sleep.bedtime || 'N/A'],
        ['Wake Time', sleep.wakeTime || 'N/A'],
    ];

    sleepData.forEach(([label, value]) => {
        doc.text(label, 20, y);
        doc.text(value, 190, y, { align: 'right' });
        y += 6;
    });

    y += 8;

    // Section: Nutrition
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 145, 0);
    doc.text('🍽️ Nutrition', 15, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 80);

    const nutritionData = [
        ['Calories', `${nutrition.calories} / ${nutrition.goals.calories} kcal`],
        ['Protein', `${nutrition.protein}g / ${nutrition.goals.protein}g`],
        ['Carbs', `${nutrition.carbs}g / ${nutrition.goals.carbs}g`],
        ['Fats', `${nutrition.fats}g / ${nutrition.goals.fats}g`],
        ['Meals Logged', `${nutrition.meals.length}`],
    ];

    nutritionData.forEach(([label, value]) => {
        doc.text(label, 20, y);
        doc.text(value, 190, y, { align: 'right' });
        y += 6;
    });

    if (nutrition.meals.length > 0) {
        y += 3;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 120);
        nutrition.meals.forEach(meal => {
            doc.text(`• ${meal.name} — ${meal.calories} kcal (P:${meal.protein}g C:${meal.carbs}g F:${meal.fats}g)`, 25, y);
            y += 5;
        });
    }

    y += 8;

    // Section: Hydration
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 212, 255);
    doc.text('💧 Hydration', 15, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 80);

    const hydrationData = [
        ['Glasses', `${hydration.glasses} / ${hydration.goal}`],
        ['Volume', `${hydration.ml} / ${hydration.goalMl} ml`],
        ['Score', `${Math.round((hydration.glasses / hydration.goal) * 100)}%`],
    ];

    hydrationData.forEach(([label, value]) => {
        doc.text(label, 20, y);
        doc.text(value, 190, y, { align: 'right' });
        y += 6;
    });

    y += 10;

    // Growth Breakdown
    if (y < 250) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 230, 118);
        doc.text('📈 Growth Breakdown', 15, y);
        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 80);

        const growthData = [
            ['Activity Consistency', `${growth.activityConsistency}%`],
            ['Sleep Score', `${growth.sleepScore}%`],
            ['Nutrition Score', `${growth.nutritionScore}%`],
            ['Hydration Score', `${growth.hydrationScore}%`],
            ['Growth Index', `${growth.growthIndex}/100`],
        ];

        growthData.forEach(([label, value]) => {
            doc.text(label, 20, y);
            doc.text(value, 190, y, { align: 'right' });
            y += 6;
        });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 170);
    doc.text('Generated by VYBE — AI-Powered Fitness & Lifestyle Tracker', 105, 285, { align: 'center' });
    doc.text(`Report Date: ${new Date().toLocaleString()}`, 105, 290, { align: 'center' });

    return doc;
}

export function downloadDailyReport() {
    const doc = generateDailyReport();
    const filename = `VYBE_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    return filename;
}

export function getDailyReportBlob() {
    const doc = generateDailyReport();
    return doc.output('blob');
}

/**
 * Generate weekly summary report
 */
export function generateWeeklyReport() {
    const doc = new jsPDF();
    const user = getUser();
    const weeklySteps = getWeeklySteps();
    const weeklySleep = getWeeklySleep();
    const growth = calculateGrowthIndex();

    // Header
    doc.setFillColor(0, 230, 118);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('VYBE', 15, 20);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Weekly Performance Summary', 15, 28);
    doc.text(`${user?.name || 'User'}`, 195, 20, { align: 'right' });

    let y = 55;
    doc.setTextColor(30, 30, 46);

    // Weekly Steps
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Weekly Steps Overview', 15, y);
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 80);

    const totalSteps = weeklySteps.reduce((sum, d) => sum + d.steps, 0);
    const avgSteps = Math.round(totalSteps / 7);

    doc.text(`Total Steps: ${totalSteps.toLocaleString()}`, 20, y); y += 6;
    doc.text(`Daily Average: ${avgSteps.toLocaleString()}`, 20, y); y += 8;

    weeklySteps.forEach(day => {
        const bar = '█'.repeat(Math.round(day.steps / 1000));
        doc.text(`${day.day}: ${day.steps.toLocaleString()} ${bar}`, 25, y);
        y += 6;
    });

    y += 10;

    // Weekly Sleep
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 46);
    doc.text('😴 Weekly Sleep Overview', 15, y);
    y += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 80);

    const totalSleep = weeklySleep.reduce((sum, d) => sum + d.hours, 0);
    const avgSleep = (totalSleep / 7).toFixed(1);

    doc.text(`Total Sleep: ${totalSleep.toFixed(1)} hours`, 20, y); y += 6;
    doc.text(`Daily Average: ${avgSleep} hours`, 20, y); y += 8;

    weeklySleep.forEach(day => {
        doc.text(`${day.day}: ${day.hours}h (Quality: ${day.quality || 'N/A'})`, 25, y);
        y += 6;
    });

    y += 10;

    // Growth
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 46);
    doc.text('📈 Growth Summary', 15, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Growth Index: ${growth.growthIndex}/100 — ${getScoreLabel(growth.growthIndex)}`, 20, y);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 170);
    doc.text('Generated by VYBE', 105, 285, { align: 'center' });

    return doc;
}

export function downloadWeeklyReport() {
    const doc = generateWeeklyReport();
    const filename = `VYBE_Weekly_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    return filename;
}

/**
 * Share report via various methods
 */
export async function shareReport(type = 'daily') {
    const blob = type === 'weekly' ? generateWeeklyReport().output('blob') : getDailyReportBlob();
    const filename = `VYBE_${type}_Report.pdf`;
    const file = new File([blob], filename, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: `VYBE ${type === 'weekly' ? 'Weekly' : 'Daily'} Report`,
                text: 'Check out my health report from VYBE!',
                files: [file],
            });
            return { success: true, method: 'native_share' };
        } catch (err) {
            if (err.name !== 'AbortError') console.warn('Share failed:', err);
        }
    }

    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return { success: true, method: 'download' };
}

/**
 * Share via WhatsApp
 */
export function shareViaWhatsApp() {
    const growth = calculateGrowthIndex();
    const steps = getTodaySteps();
    const text = encodeURIComponent(
        `🏃 My VYBE Daily Summary:\n` +
        `👣 Steps: ${steps.count.toLocaleString()}\n` +
        `🔥 Calories: ${steps.calories} kcal\n` +
        `📈 Growth Index: ${growth.growthIndex}/100\n\n` +
        `Track your fitness at vitatrack.pro 💪`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

/**
 * Share via Email
 */
export function shareViaEmail() {
    const growth = calculateGrowthIndex();
    const steps = getTodaySteps();
    const subject = encodeURIComponent('My VYBE Health Report');
    const body = encodeURIComponent(
        `Hi!\n\nHere's my daily health summary from VYBE:\n\n` +
        `Steps: ${steps.count.toLocaleString()}\n` +
        `Calories Burned: ${steps.calories} kcal\n` +
        `Distance: ${steps.distance} km\n` +
        `Growth Index: ${growth.growthIndex}/100\n\n` +
        `Check out VYBE for AI-powered fitness tracking!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_self');
}
