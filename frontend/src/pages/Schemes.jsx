import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { apiFetch } from '../utils/api';
import { INDIAN_STATES } from '../utils/india-data';

const CATEGORY_CONFIG = {
    national: { icon: '🇮🇳', label: 'National Scheme', gradient: 'from-orange-500 to-amber-500', light: 'bg-orange-50 text-orange-700 border-orange-200' },
    state: { icon: '🏛️', label: 'State Scheme', gradient: 'from-blue-500 to-indigo-500', light: 'bg-blue-50 text-blue-700 border-blue-200' },
};

const TAG_COLORS = [
    'bg-emerald-50 text-emerald-700', 'bg-blue-50 text-blue-700', 'bg-purple-50 text-purple-700',
    'bg-amber-50 text-amber-700', 'bg-rose-50 text-rose-700', 'bg-cyan-50 text-cyan-700',
    'bg-indigo-50 text-indigo-700', 'bg-teal-50 text-teal-700'
];

const GRADIENTS = [
    'from-orange-500 to-amber-500', 'from-blue-500 to-indigo-500', 'from-emerald-500 to-teal-500',
    'from-purple-500 to-pink-500', 'from-rose-500 to-red-500', 'from-cyan-500 to-blue-500',
    'from-indigo-500 to-violet-500', 'from-amber-500 to-yellow-500', 'from-teal-500 to-green-500',
    'from-pink-500 to-rose-500'
];

export default function Schemes() {
    const [schemes, setSchemes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedState, setSelectedState] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedScheme, setExpandedScheme] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const states = Object.keys(INDIAN_STATES).sort();

    useEffect(() => {
        try {
            const session = JSON.parse(localStorage.getItem('ammachi_session') || '{}');
            if (session.userId) {
                setCurrentUser(session);
                if (session.state) setSelectedState(session.state);
            }
        } catch (e) { }
    }, []);

    useEffect(() => {
        if (selectedState) fetchSchemes();
    }, [selectedState, activeFilter]);

    const fetchSchemes = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedState) params.append('state', selectedState);
            if (activeFilter !== 'all') params.append('category', activeFilter);

            const res = await apiFetch(`/api/schemes/?${params}`);
            const data = await res.json();
            if (data.success) setSchemes(data.data || []);
            else setSchemes([]);
        } catch (err) {
            console.error('Failed to fetch schemes:', err);
            setSchemes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) { fetchSchemes(); return; }
        setLoading(true);
        try {
            const res = await apiFetch(`/api/schemes/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data.success) setSchemes(data.data || []);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const nationalCount = schemes.filter(s => s.category === 'national').length;
    const stateCount = schemes.filter(s => s.category === 'state').length;
    const activeCount = schemes.filter(s => s.status === 'active').length;

    return (
        <div className="flex bg-gradient-to-br from-gray-50 via-orange-50/10 to-gray-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 md:ml-64 p-4 md:p-8 transition-all duration-300">

                {/* ═══ Hero ═══ */}
                <div className="relative bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-500 rounded-3xl p-8 mb-8 overflow-hidden shadow-xl shadow-orange-600/20">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
                    <div className="absolute bottom-0 left-20 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" style={{ animation: 'pulse 4s ease-in-out infinite' }}></div>
                    <div className="absolute top-4 right-12 text-7xl opacity-10 animate-bounce" style={{ animationDuration: '3s' }}>🏛️</div>

                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
                            🏛️ Government Schemes
                        </h1>
                        <p className="text-orange-100 text-lg">
                            Explore agricultural welfare schemes — National & State-specific
                            {selectedState && <span className="ml-2 bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">📍 {selectedState}</span>}
                        </p>
                    </div>

                    <div className="relative z-10 grid grid-cols-3 gap-4 mt-6">
                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                            <div className="text-3xl font-extrabold text-white">{schemes.length}</div>
                            <div className="text-orange-100 text-sm font-medium">Total Schemes</div>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                            <div className="text-3xl font-extrabold text-white">🇮🇳 {nationalCount}</div>
                            <div className="text-orange-100 text-sm font-medium">National</div>
                        </div>
                        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                            <div className="text-3xl font-extrabold text-white">🏛️ {stateCount}</div>
                            <div className="text-orange-100 text-sm font-medium">State ({selectedState || '—'})</div>
                        </div>
                    </div>
                </div>

                {/* ═══ State Selector + Search ═══ */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100 mb-6" style={{ animation: 'slideUp 0.3s ease-out' }}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">🗺️ Select State</label>
                            <select value={selectedState}
                                onChange={(e) => setSelectedState(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 font-medium text-gray-800">
                                <option value="">Choose a State</option>
                                {states.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">🔍 Search Schemes</label>
                            <div className="flex gap-2">
                                <input type="text" value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search by name, keyword (e.g., insurance, credit, organic)..."
                                    className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 font-medium" />
                                <button onClick={handleSearch}
                                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:shadow-xl transition-all hover:-translate-y-0.5">
                                    🔍
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ Filters ═══ */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {[
                        { id: 'all', label: '📋 All Schemes' },
                        { id: 'national', label: '🇮🇳 National' },
                        { id: 'state', label: '🏛️ State' },
                    ].map(f => (
                        <button key={f.id}
                            onClick={() => setActiveFilter(f.id)}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeFilter === f.id
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-600'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* ═══ Schemes List ═══ */}
                {!selectedState ? (
                    <div className="text-center p-16 bg-white rounded-3xl border-2 border-dashed border-orange-200">
                        <div className="text-6xl mb-4 animate-bounce" style={{ animationDuration: '2s' }}>🗺️</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Select a State to View Schemes</h3>
                        <p className="text-gray-500">Choose your state above to browse national & state-specific agricultural schemes</p>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center p-16">
                        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 font-medium">Loading government schemes...</p>
                    </div>
                ) : schemes.length === 0 ? (
                    <div className="text-center p-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No Schemes Found</h3>
                        <p className="text-gray-500">Try a different search term or clear filters</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {schemes.map((scheme, i) => {
                            const cat = CATEGORY_CONFIG[scheme.category] || CATEGORY_CONFIG.national;
                            const grad = GRADIENTS[i % GRADIENTS.length];
                            const isExpanded = expandedScheme === (scheme._id || scheme.id);

                            return (
                                <div key={scheme._id || scheme.id || i}
                                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 group"
                                    style={{ animation: `slideUp 0.4s ease-out ${i * 0.06}s both` }}>

                                    {/* Gradient stripe */}
                                    <div className={`h-2 bg-gradient-to-r ${scheme.category === 'national' ? 'from-orange-500 to-amber-500' : 'from-blue-500 to-indigo-500'}`}></div>

                                    <div className="p-6">
                                        {/* Header row */}
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${scheme.category === 'national' ? 'from-orange-500 to-amber-500' : 'from-blue-500 to-indigo-500'} flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                    {cat.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-extrabold text-gray-800 group-hover:text-orange-600 transition-colors leading-tight">
                                                        {scheme.name}
                                                    </h3>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${cat.light}`}>
                                                            {cat.label}
                                                        </span>
                                                        {scheme.launch_year && (
                                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                                                📅 {scheme.launch_year}
                                                            </span>
                                                        )}
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${scheme.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'}`}>
                                                            {scheme.status === 'active' ? '✅ Active' : scheme.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {scheme.official_url && (
                                                <a href={scheme.official_url} target="_blank" rel="noopener noreferrer"
                                                    className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2 whitespace-nowrap">
                                                    🔗 Official Website
                                                </a>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <p className="text-gray-600 leading-relaxed mb-4 text-sm">{scheme.description}</p>

                                        {/* Department */}
                                        {scheme.department && (
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                                                <span>🏢</span>
                                                <span className="font-medium">{scheme.department}</span>
                                            </div>
                                        )}

                                        {/* Highlights */}
                                        {scheme.highlights && scheme.highlights.length > 0 && (
                                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 mb-4 border border-amber-100">
                                                <h4 className="text-sm font-extrabold text-amber-800 mb-3 flex items-center gap-1">✨ Key Highlights</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {scheme.highlights.map((h, j) => (
                                                        <div key={j} className="flex items-start gap-2 text-sm">
                                                            <span className="text-amber-500 font-bold mt-0.5">▸</span>
                                                            <span className="text-gray-700">{h}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Expand button */}
                                        <button onClick={() => setExpandedScheme(isExpanded ? null : (scheme._id || scheme.id))}
                                            className="text-sm text-orange-600 font-bold hover:text-orange-700 flex items-center gap-1 mb-3 transition-colors">
                                            {isExpanded ? '▲ Show Less' : '▼ Show More Details'}
                                        </button>

                                        {/* Expanded details */}
                                        {isExpanded && (
                                            <div className="space-y-4 pt-4 border-t border-gray-100" style={{ animation: 'slideUp 0.3s ease-out' }}>
                                                {scheme.eligibility && (
                                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                                        <h5 className="text-sm font-extrabold text-blue-800 mb-1.5">👥 Eligibility</h5>
                                                        <p className="text-sm text-gray-700">{scheme.eligibility}</p>
                                                    </div>
                                                )}
                                                {scheme.benefits && (
                                                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                                        <h5 className="text-sm font-extrabold text-emerald-800 mb-1.5">💰 Benefits</h5>
                                                        <p className="text-sm text-gray-700">{scheme.benefits}</p>
                                                    </div>
                                                )}
                                                {scheme.official_url && (
                                                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                                        <h5 className="text-sm font-extrabold text-purple-800 mb-1.5">🔗 Official URL</h5>
                                                        <a href={scheme.official_url} target="_blank" rel="noopener noreferrer"
                                                            className="text-sm text-blue-600 hover:text-blue-700 underline break-all font-medium">
                                                            {scheme.official_url}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Tags */}
                                        {scheme.tags && scheme.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
                                                {scheme.tags.map((tag, j) => (
                                                    <span key={j} className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${TAG_COLORS[j % TAG_COLORS.length]}`}>
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
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
