import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Send, Image, Trophy, TrendingUp, Award, Users, Plus, Globe, Lock, UserCheck, Flame, MoreHorizontal } from 'lucide-react';
import { getUser } from '../utils/storage.js';
import { isFirebaseConfigured, createPost, getPosts, toggleLike, addComment } from '../utils/firebase.js';

// Local community data when Firebase is not configured
const DEMO_POSTS = [
    {
        id: '1', uid: 'demo1',
        userName: 'Sarah K.', avatar: 'S', avatarColor: '#ff6b9d',
        type: 'achievement',
        text: '🎉 Just hit my 30-day streak! Consistency is key! 💪',
        milestone: '30-Day Streak',
        likeCount: 24, commentCount: 5,
        likes: {}, comments: {},
        privacy: 'public',
        createdAt: Date.now() - 3600000,
    },
    {
        id: '2', uid: 'demo2',
        userName: 'Mike R.', avatar: 'M', avatarColor: '#4f8cff',
        type: 'fitness',
        text: 'Morning run done! 🏃‍♂️ 5K in 24 minutes — new personal best!',
        stats: { steps: 6500, calories: 380, distance: '5.0 km' },
        likeCount: 18, commentCount: 3,
        likes: {}, comments: {},
        privacy: 'public',
        createdAt: Date.now() - 7200000,
    },
    {
        id: '3', uid: 'demo3',
        userName: 'Priya D.', avatar: 'P', avatarColor: '#00e676',
        type: 'motivation',
        text: "Remember: progress, not perfection. Every step counts! 🌟\n\nDay 14 of my fitness journey and I'm already feeling the difference.",
        likeCount: 42, commentCount: 8,
        likes: {}, comments: {},
        privacy: 'public',
        createdAt: Date.now() - 14400000,
    },
    {
        id: '4', uid: 'demo4',
        userName: 'Alex T.', avatar: 'A', avatarColor: '#b388ff',
        type: 'achievement',
        text: '🏆 15,000 steps today! Who else is crushing their goals?',
        milestone: '15K Steps',
        likeCount: 31, commentCount: 6,
        likes: {}, comments: {},
        privacy: 'public',
        createdAt: Date.now() - 28800000,
    },
    {
        id: '5', uid: 'demo5',
        userName: 'Jordan L.', avatar: 'J', avatarColor: '#ff9100',
        type: 'fitness',
        text: "Recovery score: 92! 💚 Had an amazing night's sleep. Ready to push hard today!",
        stats: { recoveryScore: 92, sleepHours: 8.2 },
        likeCount: 15, commentCount: 2,
        likes: {}, comments: {},
        privacy: 'public',
        createdAt: Date.now() - 43200000,
    },
];

const LEADERBOARD = [
    { rank: 1, name: 'Sarah K.', avatar: 'S', color: '#ff6b9d', steps: 98420, streak: 30 },
    { rank: 2, name: 'Mike R.', avatar: 'M', color: '#4f8cff', steps: 87650, streak: 21 },
    { rank: 3, name: 'Priya D.', avatar: 'P', color: '#00e676', steps: 82100, streak: 14 },
    { rank: 4, name: 'You', avatar: null, color: '#ff9100', steps: 74320, streak: 7 },
    { rank: 5, name: 'Jordan L.', avatar: 'J', color: '#b388ff', steps: 69800, streak: 10 },
];

const CHALLENGES = [
    { id: 1, title: '10K Steps Challenge', desc: 'Hit 10,000 steps for 7 consecutive days', participants: 234, daysLeft: 5, progress: 57, icon: '🏃' },
    { id: 2, title: 'Hydration Hero', desc: 'Drink 8 glasses daily for 2 weeks', participants: 189, daysLeft: 10, progress: 35, icon: '💧' },
    { id: 3, title: 'Sleep Champion', desc: '8+ hours of sleep for 5 nights', participants: 156, daysLeft: 3, progress: 80, icon: '😴' },
];

export default function Community() {
    const [tab, setTab] = useState('feed');
    const [posts, setPosts] = useState(DEMO_POSTS);
    const [showNewPost, setShowNewPost] = useState(false);
    const [newPostText, setNewPostText] = useState('');
    const [newPostPrivacy, setNewPostPrivacy] = useState('public');
    const [likedPosts, setLikedPosts] = useState({});
    const [showComments, setShowComments] = useState(null);
    const [commentText, setCommentText] = useState('');
    const user = getUser();

    useEffect(() => {
        if (isFirebaseConfigured()) {
            getPosts().then(cloudPosts => {
                if (cloudPosts.length > 0) setPosts(cloudPosts);
            });
        }
    }, []);

    const handleLike = (postId) => {
        setLikedPosts(prev => ({ ...prev, [postId]: !prev[postId] }));
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return { ...p, likeCount: likedPosts[postId] ? p.likeCount - 1 : p.likeCount + 1 };
            }
            return p;
        }));
        if (isFirebaseConfigured() && user) {
            toggleLike(postId, user.id);
        }
    };

    const handlePost = () => {
        if (!newPostText.trim()) return;
        const newPost = {
            id: Date.now().toString(),
            uid: user?.id || 'local',
            userName: user?.name || 'You',
            avatar: user?.avatar || 'Y',
            avatarColor: '#4f8cff',
            type: 'motivation',
            text: newPostText,
            likeCount: 0,
            commentCount: 0,
            likes: {},
            comments: {},
            privacy: newPostPrivacy,
            createdAt: Date.now(),
        };
        setPosts([newPost, ...posts]);
        setNewPostText('');
        setShowNewPost(false);

        if (isFirebaseConfigured() && user) {
            createPost(user.id, newPost);
        }
    };

    const handleComment = (postId) => {
        if (!commentText.trim()) return;
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return { ...p, commentCount: p.commentCount + 1 };
            }
            return p;
        }));
        setCommentText('');
        setShowComments(null);
        if (isFirebaseConfigured() && user) {
            addComment(postId, user.id, commentText);
        }
    };

    const timeAgo = (timestamp) => {
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Community</h1>
                    <p className="header-subtitle">Connect, compete & celebrate</p>
                </div>
                <button className="header-icon-btn" onClick={() => setShowNewPost(true)} id="btn-new-post" style={{ background: 'var(--accent-blue)', border: 'none' }}>
                    <Plus size={20} style={{ color: 'white' }} />
                </button>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${tab === 'feed' ? 'active' : ''}`} onClick={() => setTab('feed')}>Feed</button>
                <button className={`tab ${tab === 'leaderboard' ? 'active' : ''}`} onClick={() => setTab('leaderboard')}>Leaderboard</button>
                <button className={`tab ${tab === 'challenges' ? 'active' : ''}`} onClick={() => setTab('challenges')}>Challenges</button>
            </div>

            {tab === 'feed' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {posts.map(post => (
                        <div key={post.id} className="card" style={{ marginBottom: 0 }}>
                            {/* Post Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: '50%',
                                    background: post.avatarColor || 'var(--gradient-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 16, fontWeight: 700, color: 'white', flexShrink: 0,
                                }}>
                                    {post.avatar}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{post.userName}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {timeAgo(post.createdAt)}
                                        {post.privacy === 'public' ? <Globe size={10} /> : post.privacy === 'friends' ? <UserCheck size={10} /> : <Lock size={10} />}
                                    </div>
                                </div>
                                {post.type === 'achievement' && (
                                    <span className="stat-badge stat-badge-green" style={{ fontSize: 10 }}>
                                        <Trophy size={12} /> {post.milestone}
                                    </span>
                                )}
                            </div>

                            {/* Post Content */}
                            <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 12, whiteSpace: 'pre-wrap' }}>{post.text}</p>

                            {/* Stats Badge */}
                            {post.stats && (
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                                    {post.stats.steps && (
                                        <span className="stat-badge stat-badge-blue" style={{ fontSize: 11 }}>👣 {post.stats.steps.toLocaleString()} steps</span>
                                    )}
                                    {post.stats.calories && (
                                        <span className="stat-badge stat-badge-orange" style={{ fontSize: 11 }}>🔥 {post.stats.calories} cal</span>
                                    )}
                                    {post.stats.distance && (
                                        <span className="stat-badge stat-badge-green" style={{ fontSize: 11 }}>📍 {post.stats.distance}</span>
                                    )}
                                    {post.stats.recoveryScore && (
                                        <span className="stat-badge stat-badge-green" style={{ fontSize: 11 }}>💚 Recovery: {post.stats.recoveryScore}</span>
                                    )}
                                    {post.stats.sleepHours && (
                                        <span className="stat-badge" style={{ fontSize: 11, background: 'rgba(179,136,255,0.12)', color: '#b388ff' }}>😴 {post.stats.sleepHours}h sleep</span>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                                <button
                                    onClick={() => handleLike(post.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                                        borderRadius: 20, background: likedPosts[post.id] ? 'rgba(255,71,87,0.12)' : 'transparent',
                                        fontSize: 13, fontWeight: 500, color: likedPosts[post.id] ? '#ff4757' : 'var(--text-secondary)',
                                        transition: 'all 0.2s ease', border: 'none', cursor: 'pointer',
                                    }}
                                >
                                    <Heart size={16} fill={likedPosts[post.id] ? '#ff4757' : 'none'} /> {post.likeCount}
                                </button>
                                <button
                                    onClick={() => setShowComments(showComments === post.id ? null : post.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                                        borderRadius: 20, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
                                        background: 'transparent', border: 'none', cursor: 'pointer',
                                    }}
                                >
                                    <MessageCircle size={16} /> {post.commentCount}
                                </button>
                                <button
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({ title: 'VYBE', text: post.text });
                                        }
                                    }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                                        borderRadius: 20, fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)',
                                        background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: 'auto',
                                    }}
                                >
                                    <Share2 size={16} />
                                </button>
                            </div>

                            {/* Comments section */}
                            {showComments === post.id && (
                                <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            className="input-field"
                                            placeholder="Write a comment..."
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleComment(post.id)}
                                            style={{ flex: 1, padding: '10px 14px', fontSize: 13 }}
                                        />
                                        <button onClick={() => handleComment(post.id)} style={{ background: 'var(--accent-blue)', borderRadius: 8, padding: '0 12px', border: 'none', cursor: 'pointer' }}>
                                            <Send size={16} style={{ color: 'white' }} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {tab === 'leaderboard' && (
                <div>
                    <div className="card" style={{ marginBottom: 16 }}>
                        <div className="card-header">
                            <span className="card-title">🏆 Weekly Step Leaders</span>
                        </div>
                        {LEADERBOARD.map((entry, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                                borderBottom: i < LEADERBOARD.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                            }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 13, fontWeight: 700,
                                    background: i === 0 ? '#ffd740' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--bg-elevated)',
                                    color: i < 3 ? '#1a1a2e' : 'var(--text-secondary)',
                                }}>
                                    {entry.rank}
                                </div>
                                <div style={{
                                    width: 36, height: 36, borderRadius: '50%',
                                    background: entry.name === 'You' ? 'var(--gradient-primary)' : entry.color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14, fontWeight: 700, color: 'white',
                                }}>
                                    {entry.name === 'You' ? (user?.avatar || 'Y') : entry.avatar}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: entry.name === 'You' ? 700 : 500, color: entry.name === 'You' ? 'var(--accent-blue)' : 'var(--text-primary)' }}>{entry.name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>🔥 {entry.streak} day streak</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>{entry.steps.toLocaleString()}</div>
                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>steps this week</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === 'challenges' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {CHALLENGES.map(challenge => (
                        <div key={challenge.id} className="card" style={{ marginBottom: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                                <div style={{ fontSize: 28 }}>{challenge.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 15, fontWeight: 600 }}>{challenge.title}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{challenge.desc}</div>
                                </div>
                            </div>
                            <div className="progress-bar-container" style={{ height: 8, marginBottom: 8 }}>
                                <div className="progress-bar-fill" style={{ width: `${challenge.progress}%`, background: 'var(--gradient-primary)' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                    <Users size={12} style={{ display: 'inline', verticalAlign: -2 }} /> {challenge.participants} participants
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                    {challenge.daysLeft}d left • {challenge.progress}%
                                </span>
                            </div>
                            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                                {challenge.progress > 0 ? 'Continue' : 'Join Challenge'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* New Post Modal */}
            {showNewPost && (
                <div className="modal-overlay" onClick={() => setShowNewPost(false)}>
                    <div className="modal-sheet" onClick={e => e.stopPropagation()}>
                        <div className="modal-handle" />
                        <h3 className="modal-title">Create Post</h3>

                        <textarea
                            className="input-field"
                            placeholder="Share your achievement, milestone, or motivation..."
                            value={newPostText}
                            onChange={e => setNewPostText(e.target.value)}
                            rows={4}
                            style={{ resize: 'none', marginBottom: 12 }}
                            id="input-post-text"
                        />

                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <button
                                className={`pill ${newPostPrivacy === 'public' ? 'active' : ''}`}
                                onClick={() => setNewPostPrivacy('public')}
                            >
                                <Globe size={12} /> Public
                            </button>
                            <button
                                className={`pill ${newPostPrivacy === 'friends' ? 'active' : ''}`}
                                onClick={() => setNewPostPrivacy('friends')}
                            >
                                <UserCheck size={12} /> Friends
                            </button>
                            <button
                                className={`pill ${newPostPrivacy === 'private' ? 'active' : ''}`}
                                onClick={() => setNewPostPrivacy('private')}
                            >
                                <Lock size={12} /> Private
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary" onClick={() => setShowNewPost(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handlePost} id="btn-publish-post">
                                <Send size={16} /> Post
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
