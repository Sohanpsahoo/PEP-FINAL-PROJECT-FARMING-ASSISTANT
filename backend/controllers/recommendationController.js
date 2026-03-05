const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const GeoCache = require("../models/GeoCache");
const Recommendation = require("../models/Recommendation");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const ML_API_URL = process.env.ML_API_URL || "http://localhost:8001";
const WEATHER_KEY = process.env.OPENWEATHER_API_KEY;

const MODEL_CHAIN = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
];

// ---------------------------------------------------------------------------
// Helper – fetch weather
// ---------------------------------------------------------------------------
async function fetchWeather(lat, lon) {
  const cacheKey = `weather_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const ONE_HOUR = 60 * 60 * 1000;

  const cached = await GeoCache.findOne({ key: cacheKey });
  if (cached && Date.now() - new Date(cached.updatedAt).getTime() < ONE_HOUR) {
    console.log("✅ Weather from cache");
    return cached.data;
  }

  try {
    console.log("🌤️  Fetching weather for:", lat, lon);
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${WEATHER_KEY}`;
    const { data } = await axios.get(url, { timeout: 8000 });

    const weather = {
      temperature: data.main.temp,
      humidity:    data.main.humidity,
      rainfall:    data.rain?.["1h"] ?? data.rain?.["3h"] ?? 0,
      description: data.weather?.[0]?.description ?? "",
      city:        data.name                ?? "Unknown",
      state:       data.sys?.state          ?? "Unknown",  // not always present
      country:     data.sys?.country        ?? "IN",
    };

    await GeoCache.findOneAndUpdate(
      { key: cacheKey },
      { key: cacheKey, data: weather, updatedAt: new Date() },
      { upsert: true }
    );

    console.log("✅ Weather fetched:", weather);
    return weather;
  } catch (err) {
    console.error("❌ Weather API error:", err.response?.data || err.message);
    return {
      temperature: 25, humidity: 60, rainfall: 100,
      description: "unavailable",
      city: "Unknown", state: "Unknown", country: "India",
    };
  }
}

// ---------------------------------------------------------------------------
// Helper – call ML model
// ---------------------------------------------------------------------------
async function callMLModel(payload) {
  try {
    const { data } = await axios.post(`${ML_API_URL}/predict`, payload, {
      timeout: 10000,
    });
    console.log("✅ ML result:", data);
    return data;
  } catch (err) {
    console.error("❌ ML API error:", err.message);
    throw new Error(`ML model unreachable: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Helper – Gemini explanation
// ---------------------------------------------------------------------------
async function getGeminiExplanation({ modelContext, farmerName }) {
  const { soil, weather, location, ml_recommendations, primary_crop } = modelContext;

  const prompt = `
You are an expert agricultural advisor specializing in crops grown in ${location.country},
specifically the ${location.state} region near ${location.city}.

A farmer named ${farmerName || "the farmer"} at coordinates
(${location.lat}, ${location.lon}) has submitted the following data:

SOIL ANALYSIS
- Nitrogen (N)    : ${soil.nitrogen_kg_ha} kg/ha
- Phosphorous (P) : ${soil.phosphorous_kg_ha} kg/ha
- Potassium (K)   : ${soil.potassium_kg_ha} kg/ha
- Soil pH         : ${soil.ph}

CURRENT LOCAL WEATHER — ${location.city}, ${location.state}
- Temperature : ${weather.temperature_c}°C
- Humidity    : ${weather.humidity_pct}%
- Rainfall    : ${weather.rainfall_mm} mm
- Condition   : ${weather.description || "N/A"}

ML MODEL RECOMMENDATIONS
${ml_recommendations.map((r) => `  ${r.rank}. ${r.crop.toUpperCase()} — confidence: ${r.confidence_pct}`).join("\n")}

YOUR TASK
1. Validate whether "${primary_crop}" is actually grown and commercially viable in ${location.state}, ${location.country}.
2. If NOT suitable for this region, recommend a better crop from the ML top-3 OR suggest a locally appropriate crop.
3. Consider local climate, seasonal patterns, and farming practices specific to ${location.state}.

Respond ONLY with this exact JSON (no markdown fences):
{
  "finalCrop": "the crop you recommend",
  "mlAgreed": true or false,
  "explanation": "2-3 sentences why this crop suits their soil, weather AND location",
  "regionalNote": "1 sentence about why this crop is suitable in ${location.state}",
  "soilInsights": "analysis of N/P/K balance and pH suitability",
  "growingTips": ["tip1 specific to ${location.state} climate", "tip2", "tip3"],
  "warnings": ["soil or weather risks"],
  "bestSowingTime": "sowing window for ${location.state}, ${location.country}",
  "estimatedYield": "typical yield range in ${location.state}",
  "nearbyMarkets": "common markets or mandis in ${location.state} for this crop"
}`.trim();

  let lastError = null;

  for (const modelName of MODEL_CHAIN) {
    try {
      console.log(`🤖 Trying model: ${modelName}`);
      const geminiModel = genAI.getGenerativeModel({ model: modelName });
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text().trim();

      if (!text) throw new Error("Empty response");

      console.log(`✅ Success with model: ${modelName}`);

      const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      return JSON.parse(cleaned);
    } catch (err) {
      const msg = err.message || "";

      const shouldTryNext =
        msg.includes("quota")             ||
        msg.includes("429")               ||
        msg.includes("RESOURCE_EXHAUSTED")||
        msg.includes("404")               ||
        msg.includes("not found")         ||
        msg.includes("not supported")     ||
        msg.includes("deprecated")        ||
        msg.includes("rate limit");

      console.warn(`⚠️  Model ${modelName} failed: ${msg.slice(0, 120)}`);
      lastError = err;

      if (!shouldTryNext) throw err;
    }
  }

  // All models exhausted — structured fallback
  console.error("❌ All Gemini models exhausted, using static fallback");
  return {
    finalCrop:    primary_crop,
    mlAgreed:     true,
    explanation:  `Based on your soil and weather in ${location.city}, ${primary_crop} is recommended.`,
    regionalNote: `${primary_crop} is commonly grown in ${location.state}.`,
    soilInsights: `N:${soil.nitrogen_kg_ha} P:${soil.phosphorous_kg_ha} K:${soil.potassium_kg_ha} pH:${soil.ph}`,
    growingTips:  ["Ensure proper irrigation", "Use recommended fertilizers", "Monitor for pests regularly"],
    warnings:     [],
    bestSowingTime: "Consult local agricultural office for best sowing window.",
    estimatedYield: "Varies based on local conditions.",
    nearbyMarkets:  `Check local mandis in ${location.state} for pricing.`,
  };
}

// ---------------------------------------------------------------------------
// POST /api/recommendations/crop
// ---------------------------------------------------------------------------
exports.getCropRecommendation = async (req, res, next) => {
  try {
    console.log("📥 Request body:", req.body);

    const { N, P, K, ph, lat, lon, farmId } = req.body;
    const farmerId = req.farmer?._id || req.body.farmerId;

    if ([N, P, K, ph].some((v) => v === undefined || v === null || isNaN(Number(v)))) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid values for N, P, K, and pH.",
      });
    }
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: "Location (lat, lon) is required to fetch weather data.",
      });
    }

    const weather = await fetchWeather(parseFloat(lat), parseFloat(lon));
    console.log("✅ Weather fetched:", weather);

    // Pass location + weather into ML payload so it builds full model_context
    const mlPayload = {
      N:           parseFloat(N),
      P:           parseFloat(P),
      K:           parseFloat(K),
      ph:          parseFloat(ph),
      temperature: weather.temperature,
      humidity:    weather.humidity,
      rainfall:    weather.rainfall,
      // location fields forwarded to FastAPI
      city:                weather.city    || "Unknown",
      state:               weather.state   || "Unknown",
      country:             weather.country || "India",
      lat:                 parseFloat(lat),
      lon:                 parseFloat(lon),
      weather_description: weather.description || "",
    };

    const mlResult = await callMLModel(mlPayload);
    console.log("✅ ML result:", mlResult);

    const farmerName = req.farmer?.name || req.body.farmerName || "Farmer";

    // Use the rich model_context returned by FastAPI for Gemini
    const geminiData = await getGeminiExplanation({
      modelContext: mlResult.model_context,
      farmerName,
    });
    console.log("✅ Gemini data:", geminiData);

    const saved = await Recommendation.create({
      farmer: farmerId,
      farm:   farmId || null,
      soilData: { N: mlPayload.N, P: mlPayload.P, K: mlPayload.K, ph: mlPayload.ph },
      weather: {
        temperature: weather.temperature,
        humidity:    weather.humidity,
        rainfall:    weather.rainfall,
        location:    weather.city,
      },
      recommendedCrop:  geminiData.finalCrop || mlResult.recommended_crop,
      confidence:       mlResult.confidence,
      alternativeCrops: mlResult.top3.slice(1).map((c) => c.crop),
      explanation:      geminiData.explanation,
      soilInsights:     geminiData.soilInsights,
      growingTips:      geminiData.growingTips,
      warnings:         geminiData.warnings,
      bestSowingTime:   geminiData.bestSowingTime,
      estimatedYield:   geminiData.estimatedYield,
    });

    return res.status(200).json({
      success: true,
      recommendation: {
        id:              saved._id,
        recommendedCrop: geminiData.finalCrop || mlResult.recommended_crop,
        mlCrop:          mlResult.recommended_crop,
        mlAgreed:        geminiData.mlAgreed,
        confidence:      mlResult.confidence,
        alternativeCrops: mlResult.top3.slice(1),
        weather,
        soilData:        mlPayload,
        location:        mlResult.model_context.location,
        ...geminiData,
      },
    });
  } catch (err) {
    console.error("❌ getCropRecommendation error:", err.message);
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/recommendations/history/:farmerId
// ---------------------------------------------------------------------------
exports.getRecommendationHistory = async (req, res, next) => {
  try {
    const { farmerId } = req.params;
    const recs = await Recommendation.find({ farmer: farmerId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return res.status(200).json({ success: true, recommendations: recs });
  } catch (err) {
    next(err);
  }
};

