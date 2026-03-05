const { GoogleGenerativeAI } = require("@google/generative-ai");
const Farmer = require("../models/Farmer");
const Recommendation = require("../models/Recommendation");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Model fallback chain — only models confirmed working ──
const MODEL_CHAIN = [
  "gemini-2.0-flash",           // free tier: 1500/day — primary
  "gemini-2.0-flash-lite",      // free tier: 1500/day — lighter
  "gemini-2.5-flash",           // free tier: 20/day   — last resort
];

async function callGeminiWithFallback(systemText, history, message) {
  let lastError = null;

  for (const modelName of MODEL_CHAIN) {
    try {
      console.log(`🤖 Trying model: ${modelName}`);

      const geminiModel = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: {
          role: "user",
          parts: [{ text: systemText }],
        },
      });

      const chat = geminiModel.startChat({ history });
      const result = await chat.sendMessage(message);
      const text = result.response.text();

      if (!text) throw new Error("Empty response");

      console.log(`✅ Success with model: ${modelName}`);
      return { text, modelUsed: modelName };
    } catch (err) {
      const msg = err.message || "";

      // Retry on ANY of these — quota, not found, deprecated, rate limit
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

      if (!shouldTryNext) {
        // Auth / bad request — no point trying others
        throw err;
      }
    }
  }

  throw lastError || new Error("All Gemini models exhausted");
}

// ---------------------------------------------------------------------------
// POST /api/chatbot/gemini
// ---------------------------------------------------------------------------
exports.geminiChat = async (req, res, next) => {
  try {
    const { message, language, farmer_id, conversation_history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    let farmerInfo = "";
    let cropContext = "";

    if (farmer_id) {
      try {
        const farmer = await Farmer.findById(farmer_id).lean();
        if (farmer) {
          farmerInfo = `Farmer: ${farmer.name}, Location: ${farmer.village || ""}, ${farmer.district || ""}, ${farmer.state || "India"}`;
        }

        const latestRec = await Recommendation.findOne({ farmer: farmer_id })
          .sort({ createdAt: -1 })
          .lean();

        console.log("📋 Latest recommendation raw:", JSON.stringify(latestRec, null, 2));

        if (latestRec) {
          const crop       = latestRec.recommendedCrop   || latestRec.recommended_crop || null;
          const confidence = latestRec.confidence        ?? 0;
          const altCrops   = latestRec.alternativeCrops  || latestRec.alternative_crops || [];
          const soilN      = latestRec.soilData?.N       ?? "N/A";
          const soilP      = latestRec.soilData?.P       ?? "N/A";
          const soilK      = latestRec.soilData?.K       ?? "N/A";
          const soilPh     = latestRec.soilData?.ph      ?? "N/A";
          const temp       = latestRec.weather?.temperature ?? "N/A";
          const humidity   = latestRec.weather?.humidity    ?? "N/A";
          const rainfall   = latestRec.weather?.rainfall    ?? "N/A";
          const location   = latestRec.weather?.location    || "Unknown";
          const sowingTime = latestRec.bestSowingTime    || "N/A";
          const yieldEst   = latestRec.estimatedYield    || "N/A";
          const insights   = latestRec.soilInsights      || "N/A";
          const tips       = (latestRec.growingTips      || []).join("; ") || "N/A";
          const warnings   = (latestRec.warnings         || []).join("; ") || "None";

          if (crop) {
            cropContext = `
LATEST SMART CROP RECOMMENDATION (ML + Gemini verified):
- Recommended Crop : ${crop}
- Confidence       : ${Math.round(confidence * 100)}%
- Alternative Crops: ${altCrops.join(", ") || "None"}
- Soil (N/P/K/pH)  : ${soilN} / ${soilP} / ${soilK} / ${soilPh}
- Weather          : ${temp}°C, Humidity ${humidity}%, Rainfall ${rainfall}mm
- Location         : ${location}
- Best Sowing Time : ${sowingTime}
- Expected Yield   : ${yieldEst}
- Soil Insights    : ${insights}
- Growing Tips     : ${tips}
- Warnings         : ${warnings}`.trim();
          }
        }
      } catch (e) {
        console.error("❌ Context fetch error:", e.message);
      }
    }

    const systemText = `You are Krishi Sakhi, an expert AI farming assistant for Indian farmers.
${farmerInfo ? `\nFARMER PROFILE:\n${farmerInfo}` : ""}
${cropContext ? `\n${cropContext}` : "\nNo crop recommendation available yet. Give general farming advice."}

RESPONSE RULES:
1. Always respond in ${language || "English"}.
2. Use the crop recommendation data above for personalized advice.
3. For fertilizer/crop/soil questions, end response with <cards> JSON:

<cards>
[
  {
    "type": "fertilizer",
    "title": "Fertilizer Schedule",
    "icon": "🧪",
    "data": {
      "nitrogen": "X kg/ha — Apply in 2 splits",
      "phosphorous": "X kg/ha — Basal application",
      "potassium": "X kg/ha — Basal application",
      "organic": "5 tonnes/ha FYM before sowing"
    }
  },
  {
    "type": "schedule",
    "title": "Crop Calendar",
    "icon": "📅",
    "data": {
      "sowing": "Month range",
      "fertilizing": "Days after sowing",
      "irrigation": "Frequency",
      "harvest": "Month range"
    }
  },
  {
    "type": "warning",
    "title": "Soil Warnings",
    "icon": "⚠️",
    "items": ["warning 1", "warning 2"]
  },
  {
    "type": "tip",
    "title": "Pro Tips",
    "icon": "💡",
    "items": ["tip 1", "tip 2"]
  },
  {
    "type": "market",
    "title": "Market Info",
    "icon": "📈",
    "data": {
      "avgPrice": "₹X–₹Y/quintal",
      "bestMarket": "APMC Mandi, district",
      "season": "Peak price month"
    }
  }
]
</cards>

Only include relevant cards. Not every response needs cards.
4. Be concise, friendly, and practical.`;

    // ── Build valid Gemini history ──
    const rawHistory = (conversation_history || []).slice(-10);
    const validHistory = [];

    for (const m of rawHistory) {
      const role = m.role === "assistant" || m.sender === "bot" ? "model" : "user";
      const text = (m.text || m.content || "").trim();
      if (!text) continue;
      validHistory.push({ role, parts: [{ text }] });
    }

    while (validHistory.length > 0 && validHistory[0].role === "model") {
      validHistory.shift();
    }

    const cleanHistory = [];
    for (const msg of validHistory) {
      const last = cleanHistory[cleanHistory.length - 1];
      if (last && last.role === msg.role) continue;
      cleanHistory.push(msg);
    }

    const finalHistory = cleanHistory.filter(
      (m) => m.parts[0].text !== message
    );

    console.log(`📜 History length: ${finalHistory.length}`);

    // ── Call Gemini with fallback chain ──
    const { text: fullText, modelUsed } = await callGeminiWithFallback(
      systemText,
      finalHistory,
      message
    );

    // ── Parse <cards> ──
    let reply = fullText;
    let cards = null;

    const cardsMatch = fullText.match(/<cards>([\s\S]*?)<\/cards>/i);
    if (cardsMatch) {
      try {
        cards = JSON.parse(cardsMatch[1].trim());
        reply = fullText.replace(/<cards>[\s\S]*?<\/cards>/i, "").trim();
      } catch (e) {
        console.error("❌ Cards parse error:", e.message);
      }
    }

    return res.status(200).json({
      success: true,
      reply,
      cards,
      modelUsed,
      context_used: {
        hasCropRecommendation: !!cropContext,
        recommendedCrop: cropContext
          ? cropContext.match(/Recommended Crop\s*:\s*(.+)/)?.[1]?.trim()
          : null,
      },
    });
  } catch (err) {
    console.error("❌ Gemini chat error:", err.message);
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/chatbot/suggestions
// ---------------------------------------------------------------------------
exports.getSuggestions = async (req, res, next) => {
  try {
    const { farmer_id } = req.query;

    let suggestions = [
      "What fertilizer should I use for my recommended crop?",
      "Show me a crop calendar for this season",
      "How do I improve my soil health?",
      "What government schemes can I apply for?",
      "What are the market prices for my crop?",
      "How to protect crops from pests?",
    ];

    if (farmer_id) {
      try {
        const rec = await Recommendation.findOne({ farmer: farmer_id })
          .sort({ createdAt: -1 })
          .lean();

        const crop = rec?.recommendedCrop || rec?.recommended_crop;
        if (crop) {
          suggestions = [
            `Fertilizer schedule for ${crop}`,
            `Best practices for growing ${crop}`,
            `Market prices for ${crop}`,
            `Pest control for ${crop}`,
            "How to improve my soil health?",
            "What government schemes can I apply for?",
          ];
        }
      } catch (e) {
        console.error("❌ Suggestions fetch error:", e.message);
      }
    }

    return res.status(200).json({ success: true, data: suggestions });
  } catch (err) {
    next(err);
  }
};
