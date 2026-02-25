import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { apiFetch } from '../utils/api';

const CATEGORY_CONFIG = {
    crop: { icon: '🌾', label: 'Crop Planning', gradient: 'from-emerald-500 to-teal-500', light: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    soil: { icon: '🪨', label: 'Soil Health', gradient: 'from-amber-500 to-orange-500', light: 'bg-amber-50 border-amber-200 text-amber-700' },
    irrigation: { icon: '💧', label: 'Irrigation', gradient: 'from-blue-500 to-cyan-500', light: 'bg-blue-50 border-blue-200 text-blue-700' },
    pest: { icon: '🐛', label: 'Pest Control', gradient: 'from-red-500 to-rose-500', light: 'bg-red-50 border-red-200 text-red-700' },
    fertilizer: { icon: '🧪', label: 'Fertilizer', gradient: 'from-purple-500 to-indigo-500', light: 'bg-purple-50 border-purple-200 text-purple-700' },
    market: { icon: '📈', label: 'Market Strategy', gradient: 'from-pink-500 to-rose-500', light: 'bg-pink-50 border-pink-200 text-pink-700' },
    best_practice: { icon: '⭐', label: 'Best Practice', gradient: 'from-indigo-500 to-violet-500', light: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
    general: { icon: '💡', label: 'General', gradient: 'from-gray-500 to-slate-500', light: 'bg-gray-100 border-gray-200 text-gray-700' },
};

const IMPACT_CONFIG = {
    high: { label: '🔥 High Impact', color: 'bg-red-50 text-red-700 border-red-200' },
    medium: { label: '⚡ Medium Impact', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    low: { label: '💚 Low Impact', color: 'bg-green-50 text-green-700 border-green-200' },
};

export default function SmartRecommendationsPage() {
    const [recommendations, setRecommendations] = useState([]);
    const [farms, setFarms] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        try {
            const session = JSON.parse(localStorage.getItem('ammachi_session') || '{}');
            if (session.userId) {
                setCurrentUser(session);
            } else {
                window.location.hash = '#/login';
            }
        } catch (e) { }
    }, []);

    useEffect(() => {
        if (currentUser?.userId) {
            fetchRecommendations();
            fetchFarmData();
        }
    }, [currentUser]);

    const fetchRecommendations = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ farmer_id: currentUser.userId });
            if (activeFilter !== 'all' && activeFilter !== 'saved') params.append('category', activeFilter);
            if (activeFilter === 'saved') params.append('is_saved', 'true');

            const res = await apiFetch(`/api/recommendations/?${params}`);
            const data = await res.json();
            if (data.success) setRecommendations(data.data || []);
        } catch (err) {
            console.error('Failed to fetch recommendations:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.userId) fetchRecommendations();
    }, [activeFilter]);

    const fetchFarmData = async () => {
        try {
            const [farmsRes, activitiesRes] = await Promise.all([
                apiFetch(`/api/farms/?farmer=${currentUser.userId}`),
                apiFetch(`/api/activities/?farmer_id=${currentUser.userId}`)
            ]);
            const farmsData = await farmsRes.json();
            const activitiesData = await activitiesRes.json();
            setFarms(farmsData.results || farmsData || []);
            setActivities(Array.isArray(activitiesData) ? activitiesData : activitiesData.results || []);
        } catch (err) {
            console.error('Failed to fetch farm data:', err);
        }
    };

    const generateRecommendations = async () => {
        if (!currentUser?.userId) return;
        setGenerating(true);
        try {
            // Clear old recommendations first
            await apiFetch(`/api/recommendations/clear?farmer_id=${currentUser.userId}`, { method: 'DELETE' });

            const res = await apiFetch('/api/recommendations/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ farmer_id: currentUser.userId })
            });
            const data = await res.json();
            if (data.success) {
                setRecommendations(data.data || []);
                setSuccess('✨ Fresh AI-powered recommendations generated!');
                setTimeout(() => setSuccess(''), 4000);
            }
        } catch (err) {
            console.error('Failed to generate recommendations:', err);
        } finally {
            setGenerating(false);
        }
    };

    const toggleSave = async (recId, currentState) => {
        try {
            await apiFetch(`/api/recommendations/${recId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_saved: !currentState })
            });
            setRecommendations(prev => prev.map(r => r._id === recId || r.id === recId ? { ...r, is_saved: !currentState } : r));
        } catch (err) {
            console.error('Failed to toggle save:', err);
        }
    };

    const deleteRecommendation = async (recId) => {
        try {
            await apiFetch(`/api/recommendations/${recId}`, { method: 'DELETE' });
            setRecommendations(prev => prev.filter(r => (r._id || r.id) !== recId));
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const FILTERS = [
        { id: 'all', label: '📋 All' },
        { id: 'saved', label: '⭐ Saved' },
        { id: 'crop', label: '🌾 Crops' },
        { id: 'soil', label: '🪨 Soil' },
        { id: 'irrigation', label: '💧 Irrigation' },
        { id: 'pest', label: '🐛 Pest' },
        { id: 'fertilizer', label: '🧪 Fertilizer' },
        { id: 'best_practice', label: '⭐ Best Practices' },
    ];

    const categoryCounts = {};
    recommendations.forEach(r => {
        categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    });

    const highImpactCount = recommendations.filter(r => r.impact === 'high').length;
    const savedCount = recommendations.filter(r => r.is_saved).length;

    return (
        <div className="flex bg-gradient-to-br from-gray-50 via-indigo-50/20 to-gray-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 md:ml-64 p-4 md:p-8 transition-all duration-300">

                {/* ═══ Hero Header ═══ */}
                <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 mb-8 overflow-hidden shadow-xl shadow-indigo-600/20">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
                    <div className="absolute bottom-0 left-20 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" style={{ animation: 'pulse 4s ease-in-out infinite' }}></div>
                    <div className="absolute top-4 right-12 text-7xl opacity-10 animate-bounce" style={{ animationDuration: '3s' }}>🤖</div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
                                🤖 Smart Recommendations
                            </h1>
                            <p className="text-indigo-100 text-lg">
                                AI-powered farming advice based on your farm data & activities
                                {currentUser && (
                                    <span className="ml-2 bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                                        👨‍🌾 {currentUser.name}
                                    </span>
                                )}
                            </p>
                        </div>
                        <button onClick={generateRecommendations} disabled={generating}
                            className="px-7 py-3 bg-white text-indigo-700 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 hover:scale-105 flex items-center gap-2 text-lg disabled:opacity-70">
                            {generating ? (
                                <><span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span> Analyzing...</>
                            ) : (
                                <><span className="text-2xl">✨</span> Generate Recommendations</>
                            )}
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="relative z-10 grid grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                            <div className="text-3xl font-extrabold text-white">{recommendations.length}</div>
                            <div className="text-indigo-100 text-sm font-medium">Total</div>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                            <div className="text-3xl font-extrabold text-white">{highImpactCount}</div>
                            <div className="text-indigo-100 text-sm font-medium">🔥 High Impact</div>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                            <div className="text-3xl font-extrabold text-white">{farms.length}</div>
                            <div className="text-indigo-100 text-sm font-medium">🏡 Farms</div>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                            <div className="text-3xl font-extrabold text-white">{savedCount}</div>
                            <div className="text-indigo-100 text-sm font-medium">⭐ Saved</div>
                        </div>
                    </div>
                </div>

                {/* Farm Data Context */}
                {farms.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100 mb-6" style={{ animation: 'slideUp 0.3s ease-out' }}>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">📊 Your Farm Data (Used for Recommendations)</h3>
                        <div className="flex flex-wrap gap-3">
                            {farms.map((farm, i) => (
                                <div key={farm.id || i} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                                    <span className="text-lg">🏡</span>
                                    <div>
                                        <span className="font-bold text-gray-800 text-sm">{farm.name}</span>
                                        <div className="text-xs text-gray-500 flex gap-2">
                                            <span>🪨 {farm.soil_type}</span>
                                            <span>💧 {farm.irrigation_type}</span>
                                            <span>🌾 {farm.primary_crops}</span>
                                            <span>📐 {farm.land_size_acres} acres</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 rounded-2xl border border-emerald-200 font-bold flex items-center gap-2 shadow-sm" style={{ animation: 'slideUp 0.3s ease-out' }}>
                        <span className="text-xl">✅</span> {success}
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {FILTERS.map(f => (
                        <button key={f.id} onClick={() => setActiveFilter(f.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeFilter === f.id
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/20'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                                }`}>
                            {f.label}
                            {f.id !== 'all' && f.id !== 'saved' && categoryCounts[f.id] ? (
                                <span className="ml-1.5 px-1.5 py-0.5 bg-white/30 rounded-full text-xs">{categoryCounts[f.id]}</span>
                            ) : null}
                        </button>
                    ))}
                </div>

                {/* Recommendations Grid */}
                {loading || generating ? (
                    <div className="flex flex-col items-center justify-center p-16">
                        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-medium">{generating ? 'Gemini is analyzing your farm data...' : 'Loading recommendations...'}</p>
                        {generating && <p className="text-gray-400 text-sm mt-1">This may take a few seconds</p>}
                    </div>
                ) : recommendations.length === 0 ? (
                    <div className="text-center p-16 bg-white rounded-3xl border-2 border-dashed border-indigo-200">
                        <div className="text-6xl mb-4 animate-bounce" style={{ animationDuration: '2s' }}>🤖</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Recommendations Yet</h3>
                        <p className="text-gray-500 mb-6">Click "Generate Recommendations" to get AI-powered farming advice</p>
                        <button onClick={generateRecommendations}
                            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-all hover:-translate-y-1">
                            ✨ Generate Now
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {recommendations.map((rec, i) => {
                            const cat = CATEGORY_CONFIG[rec.category] || CATEGORY_CONFIG.general;
                            const impact = IMPACT_CONFIG[rec.impact] || IMPACT_CONFIG.medium;

                            return (
                                <div key={rec._id || rec.id || i}
                                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group"
                                    style={{ animation: `slideUp 0.4s ease-out ${i * 0.08}s both` }}>

                                    {/* gradient stripe */}
                                    <div className={`h-2 bg-gradient-to-r ${cat.gradient}`}></div>

                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                    {cat.icon}
                                                </div>
                                                <div>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${cat.light}`}>
                                                        {cat.label}
                                                    </span>
                                                    {rec.priority >= 8 && (
                                                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-extrabold bg-red-50 text-red-600 border border-red-200">
                                                            🎯 Priority
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${impact.color}`}>
                                                {impact.label}
                                            </span>
                                        </div>

                                        <h4 className="text-lg font-extrabold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">
                                            {rec.title}
                                        </h4>

                                        <p className="text-sm text-gray-600 leading-relaxed mb-4">
                                            {rec.description}
                                        </p>

                                        {/* Tags */}
                                        {rec.tags && rec.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-4">
                                                {rec.tags.map((tag, j) => (
                                                    <span key={j} className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                            <button onClick={() => toggleSave(rec._id || rec.id, rec.is_saved)}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1 hover:scale-105 ${rec.is_saved
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-amber-200 hover:text-amber-600'
                                                    }`}>
                                                {rec.is_saved ? '⭐ Saved' : '☆ Save'}
                                            </button>
                                            <button onClick={() => deleteRecommendation(rec._id || rec.id)}
                                                className="px-4 py-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold transition-all flex items-center gap-1 border border-transparent hover:border-red-200 hover:scale-105">
                                                🗑️ Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Category Breakdown */}
                {recommendations.length > 0 && (
                    <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100" style={{ animation: 'slideUp 0.6s ease-out' }}>
                        <h3 className="text-lg font-extrabold text-gray-800 mb-4 flex items-center gap-2">📊 Recommendation Breakdown</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(categoryCounts).map(([cat, count]) => {
                                const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.general;
                                return (
                                    <div key={cat} className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-lg text-white`}>
                                            {config.icon}
                                        </div>
                                        <div>
                                            <div className="text-xl font-extrabold text-gray-800">{count}</div>
                                            <div className="text-xs text-gray-500 font-medium">{config.label}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </main>

            <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
    );
}
