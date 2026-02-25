import React, { useEffect, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { FaCheckCircle, FaExclamationTriangle, FaLeaf, FaCloud, FaTint, FaWind, FaLightbulb, FaSync } from 'react-icons/fa';
import TranslatedText from '../components/TranslatedText';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch } from '../utils/api';
import SmartRecommendations from '../components/SmartRecommendations';
import { INDIAN_STATES } from '../utils/india-data';

export default function Dashboard() {
  const { language } = useLanguage();
  const profile = (() => {
    try { return JSON.parse(localStorage.getItem('ammachi_profile') || '{}'); } catch { return {}; }
  })();
  const session = (() => {
    try { return JSON.parse(localStorage.getItem('ammachi_session') || '{}'); } catch { return {}; }
  })();

  const userId = session.userId || profile._id || profile.id;

  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [marketData, setMarketData] = useState([]);
  const [cropHealthData, setCropHealthData] = useState([]);
  const [highPriorityReminders, setHighPriorityReminders] = useState([]);

  function signOut() {
    localStorage.removeItem('ammachi_session');
    window.location.hash = '#/login';
  }

  const chartRef = useRef(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      if (userId) {
        const [farmerRes, farmsRes, activitiesRes, remindersRes, highPriorityRes] = await Promise.all([
          apiFetch(`/api/farmers/${userId}/`),
          apiFetch(`/api/farms/?farmer=${userId}`),
          apiFetch(`/api/activities/?farmer=${userId}&limit=5`),
          apiFetch(`/api/reminders/?farmer=${userId}&limit=3`),
          apiFetch(`/api/reminders/?farmer_id=${userId}&priority=high&is_completed=false`)
        ]);

        const farmer = await farmerRes.json();
        const farms = await farmsRes.json();
        const activities = await activitiesRes.json();
        const reminders = await remindersRes.json();
        const highPriority = await highPriorityRes.json();
        setHighPriorityReminders(Array.isArray(highPriority) ? highPriority : []);

        setDashboardData({
          farmer: {
            name: farmer.name || session.name || 'Farmer',
            crops: farms.results?.map(f => f.primary_crops).join(', ') || 'Rice, Coconut',
            state: farmer.state || session.state || 'Kerala',
            district: farmer.district || session.district || 'Ernakulam',
            experience_years: farmer.experience_years || 5
          },
          farms: {
            totalFarms: farms.count || 0,
            totalAcres: farms.results?.reduce((sum, f) => sum + parseFloat(f.land_size_acres || 0), 0) || 0,
            activeFarms: farms.results?.filter(f => f.is_active).length || 0
          },
          activities: {
            thisMonth: activities.count || 0,
            recent: activities.results || []
          },
          reminders: {
            upcoming: reminders.results || [],
            count: reminders.count || 0
          }
        });
      } else {
        setDashboardData(getFallbackDashboardData());
      }
    } catch (error) {
      console.warn('Error fetching dashboard data (using fallback):', error);
      setDashboardData(getFallbackDashboardData());
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackDashboardData = () => {
    return {
      farmer: {
        name: profile.name || session.name || 'Farmer',
        crops: profile.crops || ['Rice', 'Coconut', 'Pepper'],
        state: profile.state || session.state || 'Kerala',
        district: profile.district || session.district || 'Ernakulam'
      },
      cropHealth: [
        { crop: 'Rice', status: 'Leaf Blast', severity: 'moderate', date: new Date().toISOString() },
        { crop: 'Coconut', status: 'Healthy', severity: 'none', date: new Date().toISOString() }
      ],
      marketPrices: [
        { crop: 'Rice', price: 2850, change: { percentage: 5.2, direction: 'up' }, market: 'Ernakulam' },
        { crop: 'Coconut', price: 12, change: { percentage: -2.1, direction: 'down' }, market: 'Ernakulam' },
        { crop: 'Pepper', price: 58000, change: { percentage: 8.7, direction: 'up' }, market: 'Ernakulam' }
      ],
      weather: null
    };
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [userId]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    let chart;
    async function initChart() {
      try {
        let echarts;
        try {
          echarts = await new Function('return import("echarts")')();
        } catch (err) {
          if (!window.echarts) {
            await new Promise((resolve, reject) => {
              const s = document.createElement('script');
              s.src = 'https://cdn.jsdelivr.net/npm/echarts/dist/echarts.min.js';
              s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
            }).catch(() => { });
          }
          echarts = window.echarts;
        }
        if (!chartRef.current || !echarts) return;
        chart = (echarts.init ? echarts.init(chartRef.current) : window.echarts.init(chartRef.current));

        const chartData = marketData.length > 0 ? generateChartData(marketData) : getDefaultChartData();

        const option = {
          color: ['#1ea055', '#89d7a0', '#66c184'],
          tooltip: { trigger: 'axis', backgroundColor: 'rgba(4,36,22,0.95)', textStyle: { color: '#fff' } },
          legend: { show: true, data: chartData.legend, top: 0, left: 'center', itemGap: 24, textStyle: { color: '#066241' } },
          grid: { left: 40, right: 20, bottom: 20, top: 40 },
          xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], boundaryGap: false, axisLine: { lineStyle: { color: '#cfeee0' } }, axisLabel: { color: '#2b6b4a' } },
          yAxis: { type: 'value', axisLine: { lineStyle: { color: '#cfeee0' } }, axisLabel: { color: '#2b6b4a' }, splitLine: { lineStyle: { color: 'rgba(47,180,106,0.06)' } } },
          toolbox: { feature: { saveAsImage: {} } },
          series: chartData.series
        };
        chart.setOption(option);
      } catch (e) { }
    }
    initChart();
    const handleResize = () => { if (chart) chart.resize(); }
    window.addEventListener('resize', handleResize);
    return () => { window.removeEventListener('resize', handleResize); if (chart) chart.dispose && chart.dispose(); };
  }, [marketData]);

  const generateChartData = (marketPrices) => {
    const legend = marketPrices.map(item => item.crop);
    const series = marketPrices.map((item, index) => {
      const basePrice = item.price;
      const trendData = Array.from({ length: 7 }, (_, i) => {
        const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
        return Math.round(basePrice * (1 + variation));
      });

      const colors = ['#1ea055', '#89d7a0', '#66c184', '#2fb46a', '#4ade80'];

      return {
        name: item.crop,
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: trendData,
        areaStyle: { color: `rgba(47,180,106,${0.14 - index * 0.02})` },
        lineStyle: { color: colors[index] || '#1ea055', width: 3 - index * 0.5 }
      };
    });

    return { legend, series };
  };

  // Default chart data for fallback
  const getDefaultChartData = () => {
    return {
      legend: ['Rice', 'Coconut', 'Pepper'],
      series: [
        { name: 'Rice', type: 'line', smooth: true, showSymbol: false, data: [2850, 2860, 2840, 2850, 2870, 2880, 2890], areaStyle: { color: 'rgba(47,180,106,0.14)' }, lineStyle: { color: '#1ea055', width: 3 } },
        { name: 'Coconut', type: 'line', smooth: true, showSymbol: false, data: [11, 11.5, 11.8, 12, 11.9, 12.1, 12], areaStyle: { color: 'rgba(137,215,160,0.12)' }, lineStyle: { color: '#89d7a0', width: 2 } },
        { name: 'Pepper', type: 'line', smooth: true, showSymbol: false, data: [56000, 56500, 56300, 57000, 57200, 58000, 57800], areaStyle: { color: 'rgba(102,193,132,0.10)' }, lineStyle: { color: '#66c184', width: 2 } }
      ]
    };
  };

  // Weather state with API integration
  const [weather, setWeather] = useState({
    temp: 28,
    desc: 'Partly Cloudy',
    humidity: 75,
    wind: 12,
    icon: <FaCloud className="text-3xl text-emerald-600" />
  });

  // Update weather from dashboard data
  useEffect(() => {
    if (dashboardData?.weather) {
      setWeather({
        temp: dashboardData.weather.temp,
        desc: dashboardData.weather.desc,
        humidity: dashboardData.weather.humidity,
        wind: dashboardData.weather.wind,
        icon: getWeatherIcon(dashboardData.weather.desc)
      });
    }
  }, [dashboardData]);

  // Fetch weather data from API (kept as fallback if dashboard doesn't provide weather)
  useEffect(() => {
    if (!dashboardData?.weather) {
      const fetchWeatherData = async () => {
        try {
          // Determine lat/lon based on user location
          const state = dashboardData?.farmer?.state || 'Kerala';
          const district = dashboardData?.farmer?.district || 'Thiruvananthapuram';

          let lat = 8.5241, lon = 76.9366; // Default to Thiruvananthapuram

          // Try to look up coordinates from INDIAN_STATES if available
          if (INDIAN_STATES[state] && INDIAN_STATES[state][district]) {
            const loc = INDIAN_STATES[state][district];
            lat = loc.lat;
            lon = loc.lon;
          } else if (INDIAN_STATES['Kerala'] && INDIAN_STATES['Kerala'][district]) {
            // Fallback to searching inside Kerala if strict lookup fails
            const loc = INDIAN_STATES['Kerala'][district];
            lat = loc.lat;
            lon = loc.lon;
          }

          // Fetch current weather data
          const response = await apiFetch(`/api/weather/current?lat=${lat}&lon=${lon}`);

          if (!response.ok) {
            throw new Error(`Weather API returned status: ${response.status}`);
          }

          const data = await response.json();

          // Update weather state with real data
          setWeather({
            temp: Math.round(data.main?.temp || 28),
            desc: data.weather?.[0]?.description || 'Partly Cloudy',
            humidity: data.main?.humidity || 75,
            wind: Math.round(data.wind?.speed || 12),
            icon: getWeatherIcon(data.weather?.[0]?.main)
          });
        } catch (error) {
          console.error('Failed to fetch weather data:', error);
          // Keep the default weather data on error
        }
      };

      if (dashboardData && !dashboardData.weather) {
        fetchWeatherData();
      }
    }
  }, [dashboardData]);

  // Generate AI content when dashboard data and weather are loaded
  useEffect(() => {
    if (dashboardData && weather.temp && !isLoading) {
      generateAIDashboardContent();
    }
  }, [dashboardData, weather.temp, isLoading]);

  // Helper function to get weather icon based on condition
  const getWeatherIcon = (weatherCode) => {
    if (!weatherCode) return <FaCloud className="text-3xl text-emerald-600" />;
    const code = weatherCode.toLowerCase();
    if (code.includes('clear')) return <FaCloud className="text-3xl text-amber-500" />;
    if (code.includes('cloud')) return <FaCloud className="text-3xl text-emerald-600" />;
    if (code.includes('rain')) return <FaTint className="text-3xl text-blue-500" />;
    if (code.includes('snow')) return <FaCloud className="text-3xl text-gray-300" />;
    if (code.includes('thunder')) return <FaExclamationTriangle className="text-3xl text-amber-500" />;
    if (code.includes('mist') || code.includes('fog')) return <FaCloud className="text-3xl text-gray-400" />;
    return <FaCloud className="text-3xl text-emerald-600" />;
  };

  // AI-generated crop health insights
  const [recentScans, setRecentScans] = useState([
    {
      crop: 'Loading...',
      status: 'Analyzing crop health...',
      statusType: 'loading',
      date: new Date().toLocaleDateString(),
      icon: <FaSync className="animate-spin text-gray-400 mr-1" />
    }
  ]);

  // AI-generated farming tips
  const [tips, setTips] = useState([
    {
      title: 'Loading...',
      desc: 'Getting personalized farming tips...',
      color: '#f3f4f6',
      border: '#d1d5db'
    }
  ]);

  // Generate AI-powered dashboard content
  const generateAIDashboardContent = async () => {
    if (!session.userId) return;

    try {
      // Generate personalized farming tips based on current conditions
      const userState = dashboardData?.farmer?.state || 'Kerala';
      const userDistrict = dashboardData?.farmer?.district || 'Ernakulam';

      const tipsPrompt = `Generate exactly 2 practical farming tips for a farmer in ${userDistrict}, ${userState}. Current weather: ${weather.desc}, humidity: ${weather.humidity}%, temperature: ${weather.temp}°C. Farmer grows: ${dashboardData?.farmer?.crops || 'rice, coconut'}. Keep each tip under 60 words with a catchy title. 

IMPORTANT: Respond ONLY with valid JSON array format:
[{"title": "Short Catchy Title", "desc": "Practical farming advice under 60 words"}]

No markdown, no explanations, just the JSON array.`;

      const tipsResponse = await apiFetch('/api/chatbot/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: tipsPrompt,
          language: 'english',
          farmer_id: session.userId
        })
      });

      if (tipsResponse.ok) {
        const tipsData = await tipsResponse.json();
        try {
          let jsonText = tipsData.reply;

          // Extract JSON from markdown code blocks if present
          const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1];
          }

          // Try to parse the extracted JSON
          const parsedTips = JSON.parse(jsonText);
          if (Array.isArray(parsedTips) && parsedTips.length > 0) {
            setTips(parsedTips.map((tip, index) => ({
              ...tip,
              color: index % 2 === 0 ? '#fef9c3' : '#e0edff',
              border: index % 2 === 0 ? '#fde68a' : '#a5b4fc'
            })));
          } else {
            // If not an array, create fallback tips
            throw new Error('Invalid JSON structure');
          }
        } catch (parseError) {
          console.log('JSON parsing failed, creating fallback tips:', parseError);

          // Extract meaningful content from the response
          const tipText = tipsData.reply;

          // Try to extract individual tips from the text
          const lines = tipText.split('\n').filter(line => line.trim().length > 0);
          const extractedTips = [];

          let currentTitle = '';
          let currentDesc = '';

          for (const line of lines) {
            if (line.includes('title') || line.includes('Title')) {
              if (currentTitle && currentDesc) {
                extractedTips.push({
                  title: currentTitle,
                  desc: currentDesc,
                  color: extractedTips.length % 2 === 0 ? '#fef9c3' : '#e0edff',
                  border: extractedTips.length % 2 === 0 ? '#fde68a' : '#a5b4fc'
                });
              }
              currentTitle = line.replace(/["{},]/g, '').replace(/title\s*:\s*/i, '').trim();
              currentDesc = '';
            } else if (line.includes('desc') || line.includes('description')) {
              currentDesc = line.replace(/["{},]/g, '').replace(/desc\s*:\s*/i, '').replace(/description\s*:\s*/i, '').trim();
            }
          }

          // Add the last tip if exists
          if (currentTitle && currentDesc) {
            extractedTips.push({
              title: currentTitle,
              desc: currentDesc,
              color: extractedTips.length % 2 === 0 ? '#fef9c3' : '#e0edff',
              border: extractedTips.length % 2 === 0 ? '#fde68a' : '#a5b4fc'
            });
          }

          // If we extracted tips, use them; otherwise create a single fallback tip
          if (extractedTips.length > 0) {
            setTips(extractedTips);
          } else {
            setTips([
              {
                title: 'AI Farming Advice',
                desc: tipText.substring(0, 150).replace(/[{}"\[\]]/g, '') + '...',
                color: '#fef9c3',
                border: '#fde68a'
              }
            ]);
          }
        }
      }

      // Generate crop health insights
      const healthPrompt = `Analyze crop health for a farmer growing ${dashboardData?.farmer?.crops || 'rice, coconut'} in ${userState}. Current weather: ${weather.desc}, humidity: ${weather.humidity}%. Provide exactly 2 crop health insights with status.

IMPORTANT: Respond ONLY with valid JSON array format:
[{"crop": "CropName", "status": "Brief health status description", "statusType": "ok"}]

Use statusType: "ok" for healthy, "warn" for caution, "alert" for urgent. No markdown, just JSON array.`;

      const healthResponse = await apiFetch('/api/chatbot/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: healthPrompt,
          language: 'english',
          farmer_id: session.userId
        })
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        try {
          let jsonText = healthData.reply;

          // Extract JSON from markdown code blocks if present
          const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonText = jsonMatch[1];
          }

          const parsedHealth = JSON.parse(jsonText);
          if (Array.isArray(parsedHealth) && parsedHealth.length > 0) {
            setRecentScans(parsedHealth.map(scan => ({
              ...scan,
              date: new Date().toLocaleDateString(),
              icon: scan.statusType === 'ok' ?
                <FaCheckCircle className="text-emerald-600 mr-1" /> :
                scan.statusType === 'warn' ?
                  <FaExclamationTriangle className="text-amber-500 mr-1" /> :
                  <FaExclamationTriangle className="text-red-500 mr-1" />
            })));
          } else {
            throw new Error('Invalid health JSON structure');
          }
        } catch (parseError) {
          console.log('Health JSON parsing failed, using fallback:', parseError);
          // Fallback health data
          setRecentScans([
            {
              crop: 'Rice',
              status: 'Monitor for post-monsoon diseases',
              statusType: 'warn',
              date: new Date().toLocaleDateString(),
              icon: <FaExclamationTriangle className="text-amber-500 mr-1" />
            },
            {
              crop: 'Coconut',
              status: 'Good growing conditions',
              statusType: 'ok',
              date: new Date().toLocaleDateString(),
              icon: <FaCheckCircle className="text-emerald-600 mr-1" />
            }
          ]);
        }
      }

    } catch (error) {
      console.error('Error generating AI dashboard content:', error);
      // Set fallback content
      setTips([
        {
          title: 'General Farming Tips',
          desc: 'Ensure proper irrigation and monitor for pests.',
          color: '#fef9c3',
          border: '#fde68a'
        },
        {
          title: 'Weather Alert',
          desc: `Current humidity: ${weather.humidity}%. Adjust watering accordingly.`,
          color: '#e0edff',
          border: '#a5b4fc'
        }
      ]);
    }
  };

  // Update tips based on weather data
  useEffect(() => {
    const updatedTips = [...tips];

    // Update watering tip based on humidity
    if (weather.humidity > 70) {
      updatedTips[1] = {
        ...updatedTips[1],
        desc: `High humidity (${weather.humidity}%) - reduce watering to prevent fungal growth.`,
        color: '#e0edff',
        border: '#a5b4fc'
      };
    } else if (weather.humidity < 40) {
      updatedTips[1] = {
        ...updatedTips[1],
        desc: `Low humidity (${weather.humidity}%) - consider increasing watering frequency.`,
        color: '#fee2e2',
        border: '#fca5a5'
      };
    } else {
      updatedTips[1] = {
        ...updatedTips[1],
        desc: `Moderate humidity (${weather.humidity}%) - maintain regular watering schedule.`,
        color: '#e0edff',
        border: '#a5b4fc'
      };
    }

    // Add weather-specific tip based on conditions
    if (weather.desc.toLowerCase().includes('rain')) {
      updatedTips.push({
        title: 'Rain Alert',
        desc: 'Rainy conditions detected. Consider postponing outdoor activities like spraying or harvesting.',
        color: '#dbeafe',
        border: '#93c5fd'
      });
    } else if (weather.desc.toLowerCase().includes('clear') || weather.desc.toLowerCase().includes('sun')) {
      updatedTips.push({
        title: 'Sunny Day',
        desc: 'Good conditions for harvesting and drying crops. Ensure adequate irrigation.',
        color: '#fef3c7',
        border: '#fcd34d'
      });
    }

    setTips(updatedTips);
  }, [weather]);

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="w-full mb-8">
            <div className="bg-gradient-to-r from-emerald-600 to-green-700 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden flex items-center gap-6">
              <div className="flex-1 relative z-10">
                <h2 className="text-3xl md:text-4xl font-extrabold mb-2 flex items-center gap-3">
                  Welcome {dashboardData?.farmer?.name || profile.name || session.name || 'Yashasvi'}!
                  <span className="text-green-900 bg-white/30 rounded-full p-2">
                    <FaLeaf size={24} />
                  </span>
                  {isLoading && (
                    <span className="text-sm font-medium text-green-100 flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
                      <FaSync className="animate-spin" /> Loading...
                    </span>
                  )}
                </h2>
                <p className="text-green-50 text-lg mb-6 opacity-95 max-w-2xl">
                  {cropHealthData.length > 0 ?
                    <>
                      {cropHealthData.filter(scan => scan.status === 'Healthy' || !scan.status).length} <TranslatedText text="of" /> {cropHealthData.length} <TranslatedText text="recent scans show healthy crops" />
                    </> :
                    <TranslatedText text="Your crops are looking healthy today" />
                  }
                </p>
                {lastUpdated && (
                  <p className="text-sm text-green-200/80 mb-2 flex items-center gap-4">
                    <span><TranslatedText text="Last updated" />: {lastUpdated.toLocaleTimeString()}</span>
                    <button
                      onClick={handleRefresh}
                      className="text-white hover:text-green-200 transition-colors flex items-center gap-2 font-medium"
                      disabled={isLoading}
                    >
                      <FaSync className={isLoading ? 'animate-spin' : ''} /> <TranslatedText text="Refresh" />
                    </button>
                  </p>
                )}
                <div className="flex gap-4 mt-6">
                  <button className="bg-white text-emerald-700 hover:bg-green-50 px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2" onClick={() => window.location.hash = '#/detect'}>
                    <FaLeaf /> <TranslatedText text="Scan Leaf" />
                  </button>
                  <button className="bg-white/20 hover:bg-white/30 text-white border border-white/30 px-6 py-3 rounded-xl font-bold transition-all backdrop-blur-sm flex items-center gap-2" onClick={() => window.location.hash = '#/chat'}>
                    💬 <TranslatedText text="Ask AI" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Three Main Blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 text-gray-800">
            {/* Block 1: Crop Health */}
            <div className="bg-emerald-50/60 rounded-3xl p-6 md:p-8 shadow-sm border border-emerald-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6 text-emerald-800">
                <FaLeaf className="text-2xl" />
                <strong className="text-xl font-extrabold"><TranslatedText text="Crop Health" /></strong>
              </div>
              {recentScans.map((scan, idx) => (
                <div key={idx} className="flex flex-col gap-1 mb-5 pb-5 border-b border-emerald-200/50 last:border-0 last:pb-0 last:mb-0">
                  <div className="flex items-start justify-between">
                    <span className="font-extrabold text-gray-900 text-lg">{scan.crop}</span>
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap mt-1">{scan.date}</span>
                  </div>
                  <span className={`flex items-center font-bold text-sm ${scan.statusType === 'warn' ? 'text-amber-600' : scan.statusType === 'alert' ? 'text-red-600' : 'text-emerald-700'}`}>
                    {scan.icon} {scan.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Block 2: Today's Tips */}
            <div className="bg-amber-50/40 rounded-3xl p-6 md:p-8 shadow-sm border border-amber-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6 text-amber-600">
                <FaLightbulb className="text-2xl" />
                <strong className="text-xl font-extrabold text-amber-900"><TranslatedText text="Today's Tips" /></strong>
              </div>
              {tips.map((tip, idx) => (
                <div key={idx} style={{
                  background: tip.color,
                  borderColor: tip.border,
                }} className="border rounded-2xl p-5 mb-4 last:mb-0 shadow-sm transition-transform hover:-translate-y-0.5">
                  <div className="font-extrabold text-gray-900 mb-2 truncate">{tip.title}</div>
                  <div className="text-sm text-gray-800 leading-relaxed font-medium">{tip.desc}</div>
                </div>
              ))}
            </div>

            {/* Block 3: Weather */}
            <div className="bg-blue-50/50 rounded-3xl p-6 md:p-8 shadow-sm border border-blue-100/80 hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3 text-blue-700">
                    <FaCloud className="text-2xl" />
                    <strong className="text-xl font-extrabold text-blue-900"><TranslatedText text="Today's Weather" /></strong>
                  </div>
                  <button
                    onClick={() => window.location.hash = '#/weather'}
                    className="text-blue-600 text-sm font-bold hover:text-blue-800 transition-colors flex items-center bg-blue-100/50 px-3 py-1.5 rounded-full"
                  >
                    <TranslatedText text="View" />
                  </button>
                </div>
                <div className="flex items-end justify-between mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-gray-900 tracking-tighter">{weather.temp}°<span className="text-3xl font-bold text-gray-400">C</span></span>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-5xl text-blue-500 mb-2">{weather.icon}</div>
                    <span className="text-base text-blue-800 font-bold">{weather.desc}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-blue-200/60 mt-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl">
                    <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><FaTint className="text-lg" /></div>
                    <div>
                      <div className="text-xs text-blue-800/60 font-bold uppercase"><TranslatedText text="Humidity" /></div>
                      <div className="font-extrabold text-blue-900 text-lg">{weather.humidity}%</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/60 p-3 rounded-2xl">
                    <div className="bg-teal-100 p-2 rounded-xl text-teal-600"><FaWind className="text-lg" /></div>
                    <div>
                      <div className="text-xs text-teal-800/60 font-bold uppercase"><TranslatedText text="Wind" /></div>
                      <div className="font-extrabold text-teal-900 text-lg">{weather.wind} km/h</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* High Priority Reminders Section */}
          {highPriorityReminders.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-100 mt-8">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  🔴 High Priority Reminders
                  <span className="text-sm font-medium bg-red-100 text-red-600 px-2.5 py-0.5 rounded-full">{highPriorityReminders.length}</span>
                </h3>
                <button
                  onClick={() => window.location.hash = '#/reminders'}
                  className="text-emerald-600 font-bold text-sm hover:text-emerald-700 transition-colors"
                >
                  View All
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {highPriorityReminders.slice(0, 6).map(reminder => {
                  const due = new Date(reminder.due_date);
                  const today = new Date();
                  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
                  const overdue = due < today;

                  return (
                    <div
                      key={reminder.id || reminder._id}
                      className={`p-4 rounded-xl border-l-4 transition-all hover:shadow-md ${overdue ? 'border-l-red-500 bg-red-50/50 border border-red-100' : 'border-l-amber-500 bg-amber-50/30 border border-amber-100'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-gray-800 text-sm leading-tight flex-1">{reminder.title}</h4>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${overdue ? 'bg-red-100 text-red-600' : diffDays <= 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                          {overdue ? `${Math.abs(diffDays)}d overdue` : diffDays === 0 ? 'Today' : `${diffDays}d left`}
                        </span>
                      </div>
                      {reminder.description && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-1">{reminder.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium">
                          {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              await apiFetch(`/api/reminders/${reminder.id || reminder._id}/mark_completed/`, { method: 'POST' });
                              setHighPriorityReminders(prev => prev.filter(r => (r.id || r._id) !== (reminder.id || reminder._id)));
                            } catch (err) { console.error(err); }
                          }}
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          ✓ Complete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Smart Recommendations Section */}
          <SmartRecommendations dashboardData={dashboardData} weather={weather} />

          {/* Market Prices Section */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6 md:p-8 mt-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
                📈 <TranslatedText text="Market Prices" />
              </h3>
              <button
                onClick={() => window.location.hash = '#/market'}
                className="text-emerald-600 font-bold text-sm hover:text-emerald-800 transition-colors bg-emerald-100/50 px-4 py-2 rounded-full"
              >
                View All Markets
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {marketData.length > 0 ? marketData.map((item, index) => (
                <div key={index} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-2 h-full ${item.change?.direction === 'up' ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                  <div className="text-sm text-slate-500 font-extrabold uppercase tracking-wide mb-2">{item.crop}</div>
                  <div className="text-3xl font-black text-slate-800 mb-2">₹{item.price}</div>
                  <div className="flex justify-between items-end mt-4">
                    <div className={`text-sm font-extrabold flex items-center gap-1 ${item.change?.direction === 'up' ? 'text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg' : 'text-red-600 bg-red-50 px-2 py-1 rounded-lg'}`}>
                      {item.change?.direction === 'up' ? '↗' : '↘'} {item.change?.direction === 'up' ? '+' : ''}{item.change?.percentage}%
                    </div>
                    <div className="text-xs text-slate-400 font-bold uppercase text-right">
                      {item.market}
                    </div>
                  </div>
                </div>
              )) : (
                // Fallback data
                <>
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-emerald-400"></div>
                    <div className="text-sm text-slate-500 font-extrabold uppercase tracking-wide mb-2">Rice</div>
                    <div className="text-3xl font-black text-slate-800 mb-2">₹2850</div>
                    <div className="flex justify-between items-end mt-4">
                      <div className="text-sm font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">↗ +5.2%</div>
                      <div className="text-xs text-slate-400 font-bold uppercase text-right">Ernakulam</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-red-400"></div>
                    <div className="text-sm text-slate-500 font-extrabold uppercase tracking-wide mb-2">Coconut</div>
                    <div className="text-3xl font-black text-slate-800 mb-2">₹12</div>
                    <div className="flex justify-between items-end mt-4">
                      <div className="text-sm font-extrabold text-red-600 bg-red-50 px-2 py-1 rounded-lg flex items-center gap-1">↘ -2.1%</div>
                      <div className="text-xs text-slate-400 font-bold uppercase text-right">Ernakulam</div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-2 h-full bg-emerald-400"></div>
                    <div className="text-sm text-slate-500 font-extrabold uppercase tracking-wide mb-2">Pepper</div>
                    <div className="text-3xl font-black text-slate-800 mb-2">₹58000</div>
                    <div className="flex justify-between items-end mt-4">
                      <div className="text-sm font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">↗ +8.7%</div>
                      <div className="text-xs text-slate-400 font-bold uppercase text-right">Ernakulam</div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="w-full h-72 rounded-2xl overflow-hidden bg-white border border-slate-100 shadow-sm p-2" ref={chartRef} />
          </div>
        </div>
      </main>
    </div>

  );
}
