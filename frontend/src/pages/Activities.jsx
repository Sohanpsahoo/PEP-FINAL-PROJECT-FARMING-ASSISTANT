import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { apiFetch } from '../utils/api';

const TYPE_COLORS = {
  sowing: { bg: 'from-green-400 to-emerald-500', light: 'bg-green-50 border-green-200 text-green-700', iconBg: 'bg-gradient-to-br from-green-100 to-emerald-100' },
  irrigation: { bg: 'from-blue-400 to-cyan-500', light: 'bg-blue-50 border-blue-200 text-blue-700', iconBg: 'bg-gradient-to-br from-blue-100 to-cyan-100' },
  fertilizer: { bg: 'from-teal-400 to-green-500', light: 'bg-teal-50 border-teal-200 text-teal-700', iconBg: 'bg-gradient-to-br from-teal-100 to-green-100' },
  pesticide: { bg: 'from-purple-400 to-indigo-500', light: 'bg-purple-50 border-purple-200 text-purple-700', iconBg: 'bg-gradient-to-br from-purple-100 to-indigo-100' },
  weeding: { bg: 'from-yellow-400 to-amber-500', light: 'bg-yellow-50 border-yellow-200 text-yellow-700', iconBg: 'bg-gradient-to-br from-yellow-100 to-amber-100' },
  harvesting: { bg: 'from-orange-400 to-red-500', light: 'bg-orange-50 border-orange-200 text-orange-700', iconBg: 'bg-gradient-to-br from-orange-100 to-red-100' },
  pest_issue: { bg: 'from-red-400 to-pink-500', light: 'bg-red-50 border-red-200 text-red-700', iconBg: 'bg-gradient-to-br from-red-100 to-pink-100' },
  disease_issue: { bg: 'from-rose-400 to-red-500', light: 'bg-rose-50 border-rose-200 text-rose-700', iconBg: 'bg-gradient-to-br from-rose-100 to-red-100' },
  other: { bg: 'from-gray-400 to-slate-500', light: 'bg-gray-50 border-gray-200 text-gray-700', iconBg: 'bg-gradient-to-br from-gray-100 to-slate-100' },
};

export default function Activities() {
  const [activities, setActivities] = useState([]);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    farm: '', text_note: '',
    date: new Date().toISOString().split('T')[0],
    activity_type: 'irrigation'
  });
  const [filters, setFilters] = useState({ type: '', date_from: '', date_to: '' });

  const ACTIVITY_TYPES = [
    { value: 'sowing', label: 'Sowing', icon: '🌱' },
    { value: 'irrigation', label: 'Irrigation', icon: '💧' },
    { value: 'fertilizer', label: 'Fertilizer Application', icon: '🌿' },
    { value: 'pesticide', label: 'Pesticide Application', icon: '🚿' },
    { value: 'weeding', label: 'Weeding', icon: '🌾' },
    { value: 'harvesting', label: 'Harvesting', icon: '🌾' },
    { value: 'pest_issue', label: 'Pest Issue', icon: '🐛' },
    { value: 'disease_issue', label: 'Disease Issue', icon: '🦠' },
    { value: 'other', label: 'Other', icon: '📝' }
  ];

  useEffect(() => {
    const sessionRaw = localStorage.getItem('ammachi_session');
    const session = sessionRaw ? JSON.parse(sessionRaw) : null;
    if (session?.userId) {
      setCurrentUser(session);
      fetchFarmsForUser(session.userId);
    } else {
      window.location.hash = '#/login';
    }
  }, []);

  useEffect(() => {
    if (currentUser?.userId) fetchActivities(currentUser.userId);
  }, [currentUser, filters]);

  const fetchActivities = async (farmerId) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('farmer_id', farmerId);
      Object.entries(filters).forEach(([key, value]) => { if (value) params.append(key, value); });
      const response = await apiFetch(`/api/activities/?${params}`);
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmsForUser = async (farmerId) => {
    try {
      const response = await apiFetch(`/api/farms/?farmer_id=${farmerId}`);
      const data = await response.json();
      setFarms(data);
    } catch (error) {
      console.error('Error fetching farms:', error);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...formData, farmer: currentUser.userId };
      const response = await apiFetch('/api/activities/quick_add/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        fetchActivities(currentUser.userId);
        setFormData({ farm: '', text_note: '', date: new Date().toISOString().split('T')[0], activity_type: 'irrigation' });
        setShowAddForm(false);
        setSuccess('Activity logged successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errData = await response.json();
        setError(errData.message || 'Failed to log activity');
      }
    } catch (error) {
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (activityId) => {
    if (window.confirm('Delete this activity?')) {
      try {
        await apiFetch(`/api/activities/${activityId}/`, { method: 'DELETE' });
        fetchActivities(currentUser.userId);
      } catch (error) {
        console.error('Error deleting activity:', error);
      }
    }
  };

  const getTypeInfo = (type) => ACTIVITY_TYPES.find(a => a.value === type) || ACTIVITY_TYPES[8];
  const getTypeColor = (type) => TYPE_COLORS[type] || TYPE_COLORS.other;

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  return (
    <div className="flex bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 transition-all duration-300">

        {/* Gradient Hero Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 mb-8 overflow-hidden shadow-xl shadow-purple-500/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
          <div className="absolute bottom-0 left-20 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" style={{ animation: 'pulse 4s ease-in-out infinite' }}></div>
          <div className="absolute top-6 right-16 text-6xl opacity-15 animate-bounce" style={{ animationDuration: '3s' }}>📋</div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
                📊 Activity Tracking
              </h1>
              <p className="text-purple-100 text-lg">
                Log and track your farming activities
                {currentUser && (
                  <span className="ml-2 bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                    👨‍🌾 {currentUser.name} — {currentUser.district}, {currentUser.state}
                  </span>
                )}
              </p>
            </div>
            <button onClick={() => setShowAddForm(true)}
              className="px-7 py-3 bg-white text-purple-700 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 hover:scale-105 flex items-center gap-2 text-lg">
              <span className="text-2xl">+</span> Log Activity
            </button>
          </div>

          {/* Stats */}
          {activities.length > 0 && (
            <div className="relative z-10 grid grid-cols-3 gap-4 mt-6">
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                <div className="text-3xl font-extrabold text-white">{activities.length}</div>
                <div className="text-purple-100 text-sm font-medium">Total Activities</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                <div className="text-3xl font-extrabold text-white">{[...new Set(activities.map(a => a.activity_type))].length}</div>
                <div className="text-purple-100 text-sm font-medium">Activity Types</div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
                <div className="text-3xl font-extrabold text-white">{farms.length}</div>
                <div className="text-purple-100 text-sm font-medium">Farms</div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 font-medium">
              <option value="">🔍 All Activities</option>
              {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
            </select>
            <input type="date" value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 font-medium" />
            <input type="date" value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 font-medium" />
          </div>
        </div>

        {/* Quick Add Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100" style={{ animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <div className="p-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-t-3xl flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">✨ Log New Activity</h3>
                <button onClick={() => setShowAddForm(false)} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors text-lg">×</button>
              </div>

              <div className="p-6">
                {currentUser && (
                  <div className="mb-5 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-xl text-white shadow-lg shadow-purple-500/30">👨‍🌾</div>
                    <div>
                      <p className="font-bold text-purple-800">{currentUser.name}</p>
                      <p className="text-sm text-purple-600">📍 {currentUser.district}, {currentUser.state}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleQuickAdd} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">🏡 Farm (Optional)</label>
                    <select value={formData.farm} onChange={(e) => setFormData({ ...formData, farm: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10">
                      <option value="">Select Farm</option>
                      {farms.map(farm => <option key={farm.id} value={farm.id}>{farm.name} ({farm.land_size_acres} acres)</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📋 Activity Type</label>
                    <select value={formData.activity_type} onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10">
                      {ACTIVITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📅 Date</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📝 Description</label>
                    <textarea value={formData.text_note} onChange={(e) => setFormData({ ...formData, text_note: e.target.value })}
                      placeholder="e.g., 'Irrigated 2 acres of rice field'" rows={3} required
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowAddForm(false)}
                      className="px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                    <button type="submit" disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/30 transition-all transform hover:-translate-y-0.5">
                      {loading ? '⏳ Saving...' : '✨ Log Activity'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 rounded-2xl border border-emerald-200 font-medium flex items-center gap-2 shadow-sm" style={{ animation: 'slideUp 0.3s ease-out' }}>
            <span className="text-xl">✅</span> {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 text-red-700 rounded-2xl border border-red-200 font-medium flex items-center gap-2 shadow-sm" style={{ animation: 'slideUp 0.3s ease-out' }}>
            <span className="text-xl">⚠️</span> {error}
          </div>
        )}

        <div className="flex flex-col-reverse lg:flex-row gap-8">
          {/* Activities Timeline */}
          <div className="flex-1 space-y-4">
            {loading && activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-16">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Loading activities...</p>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center p-16 bg-white rounded-3xl border-2 border-dashed border-purple-200">
                <div className="text-6xl mb-4 animate-bounce" style={{ animationDuration: '2s' }}>📑</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No activities logged yet</h3>
                <p className="text-gray-500 mb-6">Start logging your farming activities!</p>
                <button onClick={() => setShowAddForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold shadow-lg shadow-purple-500/30 hover:shadow-xl transition-all hover:-translate-y-1">
                  + Log First Activity
                </button>
              </div>
            ) : (
              activities.map((activity, index) => {
                const typeInfo = getTypeInfo(activity.activity_type);
                const typeColor = getTypeColor(activity.activity_type);

                return (
                  <div key={activity.id}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-lg transition-all duration-300 group hover:-translate-y-1"
                    style={{ animation: `slideUp 0.4s ease-out ${index * 0.05}s both` }}>
                    {/* Icon with gradient */}
                    <div className={`flex-shrink-0 w-14 h-14 ${typeColor.iconBg} rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      {typeInfo.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-extrabold text-gray-800 text-lg">{typeInfo.label}</h4>
                          <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold border mt-1 ${typeColor.light}`}>
                            {typeInfo.icon} {typeInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">{formatDate(activity.date)}</span>
                          <button onClick={() => handleDelete(activity.id)}
                            className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50" title="Delete">
                            🗑️
                          </button>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-3 leading-relaxed">{activity.text_note}</p>

                      <div className="flex flex-wrap gap-2">
                        {activity.farm_name && (
                          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 text-sm font-bold rounded-full border border-amber-200">
                            🏡 {activity.farm_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Activity Summary */}
          <div className="w-full lg:w-80">
            <div className="bg-white/90 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-4">
              <h3 className="font-extrabold text-gray-800 mb-5 text-lg flex items-center gap-2">
                📊 Activity Summary
              </h3>
              <div className="space-y-2">
                {ACTIVITY_TYPES.map(type => {
                  const count = activities.filter(a => a.activity_type === type.value).length;
                  const typeColor = getTypeColor(type.value);
                  return count > 0 ? (
                    <div key={type.value} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group/item">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${typeColor.iconBg} rounded-lg flex items-center justify-center text-lg group-hover/item:scale-110 transition-transform`}>
                          {type.icon}
                        </div>
                        <span className="text-sm font-bold text-gray-700">{type.label}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-extrabold border ${typeColor.light}`}>{count}</span>
                    </div>
                  ) : null;
                })}
                {activities.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">No activities to summarize</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
