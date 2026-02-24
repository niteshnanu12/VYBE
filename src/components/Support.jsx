import React, { useState } from 'react';
import { Send, AlertCircle, CheckCircle, HelpCircle, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { getUser } from '../utils/storage.js';
import { isFirebaseConfigured, createSupportTicket } from '../utils/firebase.js';

const FAQS = [
    {
        q: 'How does step counting work?',
        a: 'VYBE uses your phone\'s built-in accelerometer and gyroscope to detect steps. The algorithm filters noise and validates each step with timing constraints (300-2000ms between steps).',
    },
    {
        q: 'Is my data secure?',
        a: 'Yes! All data is stored locally on your device first (offline-first). When cloud sync is enabled, data is encrypted and stored securely using Firebase with GDPR-compliant practices.',
    },
    {
        q: 'How is the Growth Index calculated?',
        a: 'Growth Index = Activity Consistency × 30% + Sleep Score × 30% + Nutrition Score × 20% + Hydration Score × 20%. It reflects your overall health discipline on a 0-100 scale.',
    },
    {
        q: 'Can I use VYBE without internet?',
        a: 'Absolutely! VYBE is built offline-first. All tracking works without internet. Data automatically syncs to the cloud when you reconnect.',
    },
    {
        q: 'How do I export my health data?',
        a: 'Go to Profile → tap Export Data. You can download daily or weekly PDF reports, share via WhatsApp or email, or copy a shareable link.',
    },
    {
        q: 'How accurate is the calorie calculation?',
        a: 'We use the MET (Metabolic Equivalent of Task) formula: Calories = Steps × Step Length × Body Weight × MET Value. MET values vary by activity intensity for more accurate estimates.',
    },
    {
        q: 'Do I need a wearable device?',
        a: 'No! VYBE works entirely with your smartphone\'s sensors. We plan to add optional wearable integration (Apple Watch, Fitbit) in future updates.',
    },
];

export default function Support() {
    const [tab, setTab] = useState('support');
    const [form, setForm] = useState({ subject: '', message: '', screenshot: null });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState(null);
    const user = getUser();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.subject.trim() || !form.message.trim()) return;

        setSending(true);

        const ticket = {
            name: user?.name || 'Anonymous',
            email: user?.email || 'N/A',
            subject: form.subject,
            message: form.message,
            hasScreenshot: !!form.screenshot,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
        };

        // Store locally
        const tickets = JSON.parse(localStorage.getItem('vt_support_tickets') || '[]');
        tickets.push(ticket);
        localStorage.setItem('vt_support_tickets', JSON.stringify(tickets));

        // Sync to Firebase if configured
        if (isFirebaseConfigured()) {
            await createSupportTicket(ticket);
        }

        // Simulate send delay
        await new Promise(r => setTimeout(r, 1000));

        setSending(false);
        setSent(true);
        setForm({ subject: '', message: '', screenshot: null });

        // Reset after 3 seconds
        setTimeout(() => setSent(false), 3000);
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Help & Support</h1>
                    <p className="header-subtitle">We're here to help</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${tab === 'support' ? 'active' : ''}`} onClick={() => setTab('support')}>
                    <MessageSquare size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
                    Support
                </button>
                <button className={`tab ${tab === 'faq' ? 'active' : ''}`} onClick={() => setTab('faq')}>
                    <HelpCircle size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
                    FAQ
                </button>
            </div>

            {tab === 'support' && (
                <div>
                    {sent ? (
                        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                            <CheckCircle size={48} style={{ color: 'var(--accent-green)', margin: '0 auto 16px' }} />
                            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Ticket Submitted!</h3>
                            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                                We'll get back to you as soon as possible. Thank you for your feedback!
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="card">
                                {/* Auto-filled user info */}
                                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="input-label">Name</label>
                                        <input className="input-field" value={user?.name || ''} disabled style={{ opacity: 0.6 }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="input-label">Email</label>
                                        <input className="input-field" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Subject *</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. Step counter not updating"
                                        value={form.subject}
                                        onChange={e => setForm({ ...form, subject: e.target.value })}
                                        required
                                        id="input-support-subject"
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Message *</label>
                                    <textarea
                                        className="input-field"
                                        placeholder="Describe your issue or feedback in detail..."
                                        value={form.message}
                                        onChange={e => setForm({ ...form, message: e.target.value })}
                                        rows={5}
                                        style={{ resize: 'vertical' }}
                                        required
                                        id="input-support-message"
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Screenshot (optional)</label>
                                    <label
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                            padding: '20px', borderRadius: 12, border: '2px dashed var(--border-light)',
                                            color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {form.screenshot ? (
                                            <>
                                                <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} />
                                                Screenshot attached
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle size={16} />
                                                Tap to attach a screenshot
                                            </>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={e => setForm({ ...form, screenshot: e.target.files[0] || null })}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>

                                <button type="submit" className="btn btn-primary" disabled={sending} id="btn-submit-ticket">
                                    {sending ? (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                            Sending...
                                        </span>
                                    ) : (
                                        <>
                                            <Send size={16} /> Submit Ticket
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Contact Info */}
                    <div className="card" style={{ marginTop: 16 }}>
                        <div className="card-header">
                            <span className="card-title">📬 Other Ways to Reach Us</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📧 Email: support@vitatrack.pro</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>🐦 Twitter: @VYBE</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>💬 Response time: Within 24 hours</div>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'faq' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {FAQS.map((faq, i) => (
                        <div
                            key={i}
                            className="card"
                            style={{ marginBottom: 0, cursor: 'pointer', padding: 16 }}
                            onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <HelpCircle size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                                <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{faq.q}</div>
                                {expandedFaq === i ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                            </div>
                            {expandedFaq === i && (
                                <div style={{
                                    marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)',
                                    fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                                    animation: 'fadeInUp 0.3s ease-out',
                                }}>
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
