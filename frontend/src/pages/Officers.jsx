import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { apiFetch } from '../utils/api';
import { INDIAN_STATES } from '../utils/india-data';

const SPEC_ICONS = {
  'Crop Production': '🌾', 'Soil Health': '🪨', 'Plant Protection': '🛡️',
  'Horticulture': '🍎', 'Organic Farming': '🌱', 'Water Management': '💧',
  'Post-Harvest': '📦', 'Agricultural Marketing': '📈', 'Farm Mechanization': '🚜',
  'Seed Quality': '🌱', 'Rice Cultivation': '🌾', 'Spice Cultivation': '🌶️',
};

const GRADIENTS = [
  'from-emerald-500 to-teal-500', 'from-blue-500 to-indigo-500', 'from-purple-500 to-pink-500',
  'from-amber-500 to-orange-500', 'from-cyan-500 to-blue-500', 'from-rose-500 to-red-500',
  'from-indigo-500 to-violet-500', 'from-teal-500 to-cyan-500', 'from-orange-500 to-red-500',
  'from-green-500 to-emerald-500'
];

export default function Officers() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [success, setSuccess] = useState('');

  // Consultation modal
  const [showModal, setShowModal] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [consultForm, setConsultForm] = useState({
    subject: '',
    description: '',
    consultation_type: 'phone',
    preferred_date: '',
    preferred_time: '10:00',
    farmer_phone: '',
    farmer_location: ''
  });
  const [booking, setBooking] = useState(false);

  // My bookings tab
  const [activeTab, setActiveTab] = useState('officers');
  const [consultations, setConsultations] = useState([]);

  const states = Object.keys(INDIAN_STATES).sort();
  const districts = selectedState ? INDIAN_STATES[selectedState]?.sort() || [] : [];

  const SPECIALIZATIONS = [
    'All Specializations', 'Crop Production & Management', 'Soil Health & Fertility Management',
    'Plant Protection & Pest Management', 'Horticulture Development', 'Organic Farming & Certification',
    'Water Management & Irrigation', 'Post-Harvest Technology', 'Agricultural Marketing',
    'Farm Mechanization', 'Seed Quality & Certification', 'Rice Cultivation', 'Spice Cultivation'
  ];

  useEffect(() => {
    try {
      const session = JSON.parse(localStorage.getItem('ammachi_session') || '{}');
      if (session.userId) {
        setCurrentUser(session);
        if (session.state) setSelectedState(session.state);
        if (session.district) setSelectedDistrict(session.district);
      }
    } catch (e) { }
  }, []);

  // Fetch officers when state/district changes
  useEffect(() => {
    if (selectedState) fetchOfficers();
  }, [selectedState, selectedDistrict, selectedSpec]);

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedState) params.append('state', selectedState);
      if (selectedDistrict) params.append('district', selectedDistrict);
      if (selectedSpec && selectedSpec !== 'All Specializations') params.append('specialization', selectedSpec);

      const res = await apiFetch(`/api/officers/?${params}`);
      const data = await res.json();
      if (data.success) setOfficers(data.data || []);
      else setOfficers([]);
    } catch (err) {
      console.error('Failed to fetch officers:', err);
      setOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsultations = async () => {
    if (!currentUser?.userId) return;
    try {
      const res = await apiFetch(`/api/officers/consultations/list?farmer_id=${currentUser.userId}`);
      const data = await res.json();
      if (data.success) setConsultations(data.data || []);
    } catch (err) {
      console.error('Failed to fetch consultations:', err);
    }
  };

  const openConsultation = (officer) => {
    if (!currentUser?.userId) { alert('Please login first'); return; }
    setSelectedOfficer(officer);
    setConsultForm({
      subject: '',
      description: '',
      consultation_type: 'phone',
      preferred_date: '',
      preferred_time: '10:00',
      farmer_phone: currentUser.phone || '',
      farmer_location: `${currentUser.district || ''}, ${currentUser.state || ''}`
    });
    setShowModal(true);
  };

  const submitConsultation = async (e) => {
    e.preventDefault();
    if (!currentUser?.userId || !selectedOfficer) return;
    setBooking(true);
    try {
      const res = await apiFetch('/api/officers/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer: currentUser.userId,
          officer: selectedOfficer._id || selectedOfficer.id,
          subject: consultForm.subject,
          description: consultForm.description,
          consultation_type: consultForm.consultation_type,
          preferred_date: consultForm.preferred_date,
          preferred_time: consultForm.preferred_time,
          farmer_phone: consultForm.farmer_phone,
          farmer_location: consultForm.farmer_location
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setSuccess(`🎉 Consultation booked successfully with ${selectedOfficer.name}!`);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        alert('Failed to book consultation. Please try again.');
      }
    } catch (err) {
      console.error('Booking error:', err);
      alert('Failed to book consultation. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const cancelConsultation = async (id) => {
    try {
      await apiFetch(`/api/officers/consultations/${id}/cancel`, { method: 'PATCH' });
      setConsultations(prev => prev.map(c => (c._id || c.id) === id ? { ...c, status: 'cancelled' } : c));
    } catch (err) {
      console.error('Cancel error:', err);
    }
  };

  const getSpecIcon = (spec) => {
    for (const [key, icon] of Object.entries(SPEC_ICONS)) {
      if (spec?.includes(key)) return icon;
    }
    return '👨‍🌾';
  };

  const getRatingStars = (r) => '⭐'.repeat(Math.min(Math.floor(r || 4), 5));
  const availableCount = officers.filter(o => o.is_available).length;

  return (
    <div className="flex bg-gradient-to-br from-gray-50 via-teal-50/20 to-gray-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 transition-all duration-300">

        {/* ═══ Hero Header ═══ */}
        <div className="relative bg-gradient-to-r from-teal-600 via-emerald-600 to-green-600 rounded-3xl p-8 mb-8 overflow-hidden shadow-xl shadow-teal-600/20">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
          <div className="absolute bottom-0 left-20 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" style={{ animation: 'pulse 4s ease-in-out infinite' }}></div>
          <div className="absolute top-4 right-12 text-7xl opacity-10 animate-bounce" style={{ animationDuration: '3s' }}>👨‍🌾</div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
                🏛️ Agricultural Officers
              </h1>
              <p className="text-emerald-100 text-lg">
                Connect with government agricultural experts in your area
                {currentUser && (
                  <span className="ml-2 bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                    📍 {currentUser.district || currentUser.state || ''}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="relative z-10 grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
              <div className="text-3xl font-extrabold text-white">{officers.length}</div>
              <div className="text-emerald-100 text-sm font-medium">Total Officers</div>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
              <div className="text-3xl font-extrabold text-white">{availableCount}</div>
              <div className="text-emerald-100 text-sm font-medium">✅ Available</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/30 ring-2 ring-white/20">
              <div className="text-3xl font-extrabold text-white">🆓</div>
              <div className="text-emerald-100 text-sm font-bold">Free Consultation</div>
            </div>
          </div>
        </div>

        {/* ═══ Selectors ═══ */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-gray-100 mb-6" style={{ animation: 'slideUp 0.3s ease-out' }}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🗺️ State</label>
              <select value={selectedState}
                onChange={(e) => { setSelectedState(e.target.value); setSelectedDistrict(''); }}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 font-medium text-gray-800">
                <option value="">Select State</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">📍 District</label>
              <select value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedState}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 font-medium text-gray-800 disabled:opacity-50">
                <option value="">All Districts</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">🎓 Specialization</label>
              <select value={selectedSpec}
                onChange={(e) => setSelectedSpec(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 font-medium text-gray-800">
                {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Success toast */}
        {success && (
          <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 rounded-2xl border border-emerald-200 font-bold flex items-center gap-2 shadow-sm" style={{ animation: 'slideUp 0.3s ease-out' }}>
            <span className="text-xl">✅</span> {success}
          </div>
        )}

        {/* ═══ Tabs ═══ */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'officers', label: '🏛️ Officers Directory' },
            { id: 'bookings', label: '📋 My Consultations' }
          ].map(tab => (
            <button key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id === 'bookings') fetchConsultations(); }}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === tab.id
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-lg shadow-teal-500/20'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-teal-300 hover:text-teal-600'
                }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ Officers Directory ═══ */}
        {activeTab === 'officers' && (
          <div style={{ animation: 'slideUp 0.4s ease-out' }}>
            {!selectedState ? (
              <div className="text-center p-16 bg-white rounded-3xl border-2 border-dashed border-teal-200">
                <div className="text-6xl mb-4 animate-bounce" style={{ animationDuration: '2s' }}>🗺️</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Select a State to View Officers</h3>
                <p className="text-gray-500">Choose your state and district above to see available agricultural officers</p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center p-16">
                <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">Loading officers...</p>
              </div>
            ) : officers.length === 0 ? (
              <div className="text-center p-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Officers Found</h3>
                <p className="text-gray-500">Try selecting a different district or specialization</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {officers.map((officer, i) => (
                  <div key={officer._id || officer.id || i}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group"
                    style={{ animation: `slideUp 0.4s ease-out ${i * 0.08}s both` }}>

                    {/* Gradient stripe */}
                    <div className={`h-2 bg-gradient-to-r ${GRADIENTS[i % GRADIENTS.length]}`}></div>

                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          {getSpecIcon(officer.specialization)}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-extrabold text-gray-800 leading-tight group-hover:text-teal-600 transition-colors">{officer.name}</h3>
                          <p className="text-sm font-bold text-teal-600 mt-0.5">{officer.designation}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs">{getRatingStars(officer.rating)}</span>
                            <span className="text-xs text-gray-400 font-medium">({officer.rating})</span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${officer.is_available ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                          {officer.is_available ? '🟢 Available' : '🔴 Busy'}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 mb-4 space-y-2.5">
                        <div className="flex items-center gap-2.5 text-sm">
                          <span className="w-6 text-center">🎓</span>
                          <span className="text-gray-700 font-medium">{officer.specialization}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm">
                          <span className="w-6 text-center">🏢</span>
                          <span className="text-gray-600">{officer.department}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm">
                          <span className="w-6 text-center">📍</span>
                          <span className="text-gray-600">{officer.district}, {officer.state}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm">
                          <span className="w-6 text-center">🏠</span>
                          <span className="text-gray-600 text-xs">{officer.office_address}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm">
                          <span className="w-6 text-center">⏰</span>
                          <span className="text-gray-600">{officer.available_hours}</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm">
                          <span className="w-6 text-center">💼</span>
                          <span className="text-gray-600">{officer.experience_years} years experience</span>
                        </div>
                        <div className="flex items-center gap-2.5 text-sm">
                          <span className="w-6 text-center">🗣️</span>
                          <span className="text-gray-600">{officer.languages}</span>
                        </div>
                      </div>

                      {/* Contact info */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200">📞 {officer.phone}</span>
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold border border-purple-200 truncate max-w-[200px]">✉️ {officer.email}</span>
                      </div>

                      {/* Fee badge */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-extrabold ${officer.consultation_fee === 'Free' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {officer.consultation_fee === 'Free' ? '🆓 Free Consultation' : `💰 ${officer.consultation_fee}`}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-3">
                        <button onClick={() => openConsultation(officer)} disabled={!officer.is_available}
                          className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-2xl font-bold shadow-lg shadow-teal-500/20 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:shadow-none">
                          📅 Book Consultation
                        </button>
                        <a href={`tel:${officer.phone}`}
                          className="px-5 py-3 bg-white border border-gray-200 hover:border-teal-300 hover:bg-teal-50 text-gray-700 rounded-2xl font-bold transition-all hover:-translate-y-0.5 flex items-center justify-center gap-1">
                          📱 Call
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ My Consultations ═══ */}
        {activeTab === 'bookings' && (
          <div style={{ animation: 'slideUp 0.4s ease-out' }}>
            {consultations.length === 0 ? (
              <div className="text-center p-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Consultations Yet</h3>
                <p className="text-gray-500">Book a consultation with an officer to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {consultations.map((c, i) => {
                  const statusColors = {
                    pending: 'bg-blue-50 text-blue-700 border-blue-200',
                    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    completed: 'bg-green-50 text-green-700 border-green-200',
                    cancelled: 'bg-red-50 text-red-600 border-red-200'
                  };
                  const typeIcons = { phone: '📞', video: '📹', visit: '🚜', office: '🏢' };
                  return (
                    <div key={c._id || c.id || i}
                      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all"
                      style={{ animation: `slideUp 0.4s ease-out ${i * 0.08}s both` }}>
                      <div className={`h-2 bg-gradient-to-r ${c.status === 'cancelled' ? 'from-red-400 to-rose-400' : 'from-teal-500 to-emerald-500'}`}></div>
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-lg font-extrabold text-gray-800">{c.subject}</h4>
                            <p className="text-sm text-teal-600 font-medium mt-0.5">
                              {c.officer?.name || 'Officer'} • {c.officer?.designation || ''}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${statusColors[c.status] || statusColors.pending}`}>
                            {c.status?.charAt(0).toUpperCase() + c.status?.slice(1)}
                          </span>
                        </div>

                        {c.description && <p className="text-sm text-gray-600 mb-3">{c.description}</p>}

                        <div className="bg-gray-50 rounded-xl p-3 space-y-2 mb-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">📅 Date:</span>
                            <span className="font-bold text-gray-800">{new Date(c.preferred_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">⏰ Time:</span>
                            <span className="font-bold text-gray-800">{c.preferred_time || '10:00 AM'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Type:</span>
                            <span className="font-bold text-gray-800">{typeIcons[c.consultation_type] || '📞'} {c.consultation_type}</span>
                          </div>
                        </div>

                        {c.status === 'pending' && (
                          <button onClick={() => cancelConsultation(c._id || c.id)}
                            className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-sm transition-colors border border-red-200">
                            ❌ Cancel Consultation
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ Consultation Modal ═══ */}
        {showModal && selectedOfficer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100" style={{ animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
              {/* Gradient header */}
              <div className="p-6 rounded-t-3xl text-white bg-gradient-to-r from-teal-500 via-emerald-500 to-green-500 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">📅 Book Consultation</h3>
                  <p className="text-emerald-100 text-sm mt-1">with {selectedOfficer.name}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors text-lg">×</button>
              </div>

              <form onSubmit={submitConsultation} className="p-6 space-y-5">
                {/* Officer info */}
                <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-xl text-white shadow-lg">
                      {getSpecIcon(selectedOfficer.specialization)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-gray-800">{selectedOfficer.name}</h4>
                      <p className="text-sm text-teal-600 font-medium">{selectedOfficer.designation}</p>
                      <p className="text-xs text-gray-500">{selectedOfficer.specialization}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">📝 Subject</label>
                  <input type="text" value={consultForm.subject} required
                    onChange={(e) => setConsultForm({ ...consultForm, subject: e.target.value })}
                    placeholder="e.g., Crop disease identification"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 font-medium" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">📋 Description</label>
                  <textarea value={consultForm.description} rows={3}
                    onChange={(e) => setConsultForm({ ...consultForm, description: e.target.value })}
                    placeholder="Describe your issue or question in detail..."
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10" />
                </div>

                {/* Consultation type selector */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">📞 Consultation Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'phone', icon: '📞', label: 'Phone' },
                      { id: 'video', icon: '📹', label: 'Video' },
                      { id: 'visit', icon: '🚜', label: 'Farm Visit' },
                      { id: 'office', icon: '🏢', label: 'Office' },
                    ].map(t => (
                      <button key={t.id} type="button"
                        onClick={() => setConsultForm({ ...consultForm, consultation_type: t.id })}
                        className={`p-3 rounded-xl text-center transition-all border ${consultForm.consultation_type === t.id
                          ? 'bg-teal-50 border-teal-300 text-teal-700 shadow-sm ring-2 ring-teal-200'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-teal-200'
                          }`}>
                        <div className="text-xl mb-1">{t.icon}</div>
                        <div className="text-xs font-bold">{t.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📅 Date</label>
                    <input type="date" value={consultForm.preferred_date} required
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setConsultForm({ ...consultForm, preferred_date: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 font-bold" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">⏰ Time</label>
                    <input type="time" value={consultForm.preferred_time}
                      onChange={(e) => setConsultForm({ ...consultForm, preferred_time: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 font-bold" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📱 Your Phone</label>
                    <input type="tel" value={consultForm.farmer_phone} required
                      onChange={(e) => setConsultForm({ ...consultForm, farmer_phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">📍 Your Location</label>
                    <input type="text" value={consultForm.farmer_location}
                      onChange={(e) => setConsultForm({ ...consultForm, farmer_location: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 font-medium" />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200">
                    Cancel
                  </button>
                  <button type="submit" disabled={booking}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-teal-500/30 transition-all hover:-translate-y-0.5 disabled:opacity-50">
                    {booking ? '⏳ Booking...' : '✅ Confirm Booking'}
                  </button>
                </div>
              </form>
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
