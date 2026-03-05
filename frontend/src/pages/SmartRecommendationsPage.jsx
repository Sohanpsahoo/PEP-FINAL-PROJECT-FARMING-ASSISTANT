import React, { useState, useEffect } from "react";
import { getCropRecommendation, getRecommendationHistory } from "../utils/api";
import {
  Leaf,
  FlaskConical,
  CloudRain,
  Lightbulb,
  AlertTriangle,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

const FIELD_META = {
  N: { label: "Nitrogen (N)", unit: "kg/ha", min: 0, max: 140, step: 1 },
  P: { label: "Phosphorous (P)", unit: "kg/ha", min: 0, max: 145, step: 1 },
  K: { label: "Potassium (K)", unit: "kg/ha", min: 0, max: 205, step: 1 },
  ph: { label: "Soil pH", unit: "", min: 0, max: 14, step: 0.1 },
};

const CROP_EMOJI = {
  rice: "🌾",
  wheat: "🌿",
  maize: "🌽",
  cotton: "🌸",
  sugarcane: "🎋",
  banana: "🍌",
  mango: "🥭",
  grapes: "🍇",
  apple: "🍎",
  coffee: "☕",
  default: "🌱",
};

function ConfidenceBadge({ value }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 70 ? "bg-green-100 text-green-700" :
    pct >= 40 ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700";
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${color}`}>
      {pct}% confidence
    </span>
  );
}

function ResultCard({ rec }) {
  const [expanded, setExpanded] = useState(false);
  const emoji = CROP_EMOJI[rec.recommendedCrop?.toLowerCase()] ?? CROP_EMOJI.default;

  return (
    <div className="bg-white rounded-2xl shadow-md border border-green-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-500 p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Recommended Crop</p>
            <h2 className="text-3xl font-bold capitalize mt-1">
              {emoji} {rec.recommendedCrop}
            </h2>
          </div>
          <ConfidenceBadge value={rec.confidence} />
        </div>
        <p className="mt-3 text-sm opacity-90 leading-relaxed">{rec.explanation}</p>
      </div>

      {/* Weather summary */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 bg-blue-50 text-center">
        {[
          { label: "Temp", value: `${rec.weather?.temperature}°C`, icon: "🌡️" },
          { label: "Humidity", value: `${rec.weather?.humidity}%`, icon: "💧" },
          { label: "Rainfall", value: `${rec.weather?.rainfall} mm`, icon: "🌧️" },
        ].map((w) => (
          <div key={w.label} className="p-3">
            <div className="text-lg">{w.icon}</div>
            <div className="text-xs text-gray-500">{w.label}</div>
            <div className="font-semibold text-sm text-gray-700">{w.value}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Soil insights */}
        <div className="flex gap-3">
          <FlaskConical className="text-purple-500 mt-0.5 shrink-0" size={18} />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Soil Insights</p>
            <p className="text-sm text-gray-700 mt-1">{rec.soilInsights}</p>
          </div>
        </div>

        {/* Sowing & yield */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex gap-2 bg-amber-50 rounded-xl p-3">
            <Calendar size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-700">Best Sowing Time</p>
              <p className="text-xs text-gray-600 mt-0.5">{rec.bestSowingTime}</p>
            </div>
          </div>
          <div className="flex gap-2 bg-green-50 rounded-xl p-3">
            <TrendingUp size={16} className="text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-green-700">Expected Yield</p>
              <p className="text-xs text-gray-600 mt-0.5">{rec.estimatedYield}</p>
            </div>
          </div>
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-green-600 font-medium hover:underline"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Show less" : "Show tips & warnings"}
        </button>

        {expanded && (
          <div className="space-y-3 pt-1">
            {/* Tips */}
            {rec.growingTips?.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <Lightbulb size={15} className="text-yellow-500" />
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Growing Tips
                  </p>
                </div>
                <ul className="space-y-1">
                  {rec.growingTips.map((tip, i) => (
                    <li key={i} className="text-xs text-gray-600 flex gap-2">
                      <span className="text-green-500 mt-0.5">✓</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {rec.warnings?.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <AlertTriangle size={15} className="text-orange-500" />
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Warnings
                  </p>
                </div>
                <ul className="space-y-1">
                  {rec.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-orange-700 flex gap-2">
                      <span className="mt-0.5">⚠</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alternatives */}
            {rec.alternativeCrops?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-1">Alternative Crops</p>
                <div className="flex gap-2 flex-wrap">
                  {rec.alternativeCrops.map((alt) => (
                    <span
                      key={alt.crop ?? alt}
                      className="text-xs bg-gray-100 text-gray-700 rounded-full px-3 py-1"
                    >
                      {CROP_EMOJI[alt.crop ?? alt] ?? "🌱"}{" "}
                      {alt.crop ?? alt}
                      {alt.confidence !== undefined && (
                        <span className="text-gray-400 ml-1">
                          ({Math.round(alt.confidence * 100)}%)
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function SmartRecommendationsPage() {
  const [form, setForm] = useState({ N: "", P: "", K: "", ph: "" });
  const [useMyLocation, setUseMyLocation] = useState(true);
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Auto-fetch geolocation
  useEffect(() => {
    if (!useMyLocation) return;
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => setGeoError("Could not detect location. Please enter manually.")
    );
  }, [useMyLocation]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const lat = useMyLocation ? coords?.lat : parseFloat(manualLat);
    const lon = useMyLocation ? coords?.lon : parseFloat(manualLon);

    if (!lat || !lon) {
      setError("Location is required. Allow browser location or enter manually.");
      return;
    }

    setLoading(true);
    try {
      const res = await getCropRecommendation({
        N: parseFloat(form.N),
        P: parseFloat(form.P),
        K: parseFloat(form.K),
        ph: parseFloat(form.ph),
        lat,
        lon,
      });
      if (res.success) {
        setResult(res.recommendation);
      } else {
        setError(res.message || "Something went wrong.");
      }
    } catch (err) {
      setError(err.message || "Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-600 text-white text-2xl mb-3">
            <Leaf size={28} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Smart Crop Recommendation</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your soil data – we'll fetch local weather and recommend the best crop using AI.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-md p-6 space-y-5 border border-green-100"
        >
          <p className="text-sm font-semibold text-gray-600 flex items-center gap-2">
            <FlaskConical size={16} className="text-purple-500" /> Soil Nutrients
          </p>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(FIELD_META).map(([key, meta]) => (
              <div key={key}>
                <label className="text-xs text-gray-500 font-medium block mb-1">
                  {meta.label} {meta.unit && <span className="text-gray-400">({meta.unit})</span>}
                </label>
                <input
                  type="number"
                  min={meta.min}
                  max={meta.max}
                  step={meta.step}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={`${meta.min}–${meta.max}`}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            ))}
          </div>

          {/* Location */}
          <div>
            <p className="text-sm font-semibold text-gray-600 flex items-center gap-2 mb-2">
              <CloudRain size={16} className="text-blue-500" /> Location (for weather)
            </p>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={useMyLocation}
                onChange={(e) => setUseMyLocation(e.target.checked)}
                className="accent-green-600"
              />
              Use my current location
            </label>

            {useMyLocation ? (
              <p className="text-xs mt-2 text-gray-400">
                {coords
                  ? `📍 Detected: ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}`
                  : geoError
                  ? `⚠️ ${geoError}`
                  : "Detecting location…"}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <input
                  type="number" step="any" placeholder="Latitude"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  required
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
                <input
                  type="number" step="any" placeholder="Longitude"
                  value={manualLon}
                  onChange={(e) => setManualLon(e.target.value)}
                  required
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Analysing…
              </>
            ) : (
              <>
                <Leaf size={18} /> Get Recommendation
              </>
            )}
          </button>
        </form>

        {/* Result */}
        {result && <ResultCard rec={result} />}
      </div>
    </div>
  );
}
