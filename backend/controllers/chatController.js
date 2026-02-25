const Farm = require('../models/Farm');
const Activity = require('../models/Activity');
const Recommendation = require('../models/Recommendation');
const Scheme = require('../models/Scheme');
const Officer = require('../models/Officer');
const Farmer = require('../models/Farmer');

// ─── Fetch all cross-section context for a farmer ───────────────────
async function gatherFarmerContext(farmerId) {
  const ctx = {};
  try {
    // Farmer profile
    const farmer = await Farmer.findById(farmerId).lean();
    if (farmer) {
      ctx.farmer = {
        name: farmer.name,
        phone: farmer.phone,
        state: farmer.state,
        district: farmer.district,
        experience_years: farmer.experience_years,
        preferred_language: farmer.preferred_language
      };
    }

    // Farms
    const farms = await Farm.find({ farmer: farmerId }).lean();
    ctx.farms = farms.map(f => ({
      name: f.name,
      land_size_acres: f.land_size_acres,
      soil_type: f.soil_type,
      irrigation_type: f.irrigation_type,
      primary_crops: f.primary_crops,
      state: f.state,
      district: f.district
    }));

    // Recent activities (last 15)
    const activities = await Activity.find({ farmer: farmerId })
      .sort({ date: -1 }).limit(15).lean();
    ctx.activities = activities.map(a => ({
      type: a.activity_type,
      note: a.note || a.text_note,
      date: a.date,
      amount: a.amount
    }));

    // Saved recommendations (up to 10)
    const recs = await Recommendation.find({ farmer: farmerId })
      .sort({ createdAt: -1 }).limit(10).lean();
    ctx.recommendations = recs.map(r => ({
      category: r.category,
      title: r.title,
      description: r.description,
      impact: r.impact
    }));

    // Available schemes for the farmer's state
    const state = farmer?.state;
    if (state) {
      const schemes = await Scheme.find({
        $or: [{ state }, { state: 'All India', category: 'national' }]
      }).limit(10).lean();
      ctx.schemes = schemes.map(s => ({
        name: s.name,
        category: s.category,
        description: s.description,
        highlights: s.highlights?.slice(0, 3),
        official_url: s.official_url
      }));
    }

    // Officers in the farmer's area
    if (state) {
      const officers = await Officer.find({ state }).limit(5).lean();
      ctx.officers = officers.map(o => ({
        name: o.name,
        designation: o.designation,
        specialization: o.specialization,
        phone: o.phone,
        district: o.district
      }));
    }
  } catch (err) {
    console.error('Context gather error:', err.message);
  }
  return ctx;
}

// ─── Build the Gemini prompt with full context ──────────────────────
function buildPrompt(userMessage, context, language, conversationHistory) {
  const farmerInfo = context.farmer
    ? `FARMER PROFILE:
- Name: ${context.farmer.name}
- State: ${context.farmer.state}, District: ${context.farmer.district}
- Experience: ${context.farmer.experience_years} years
- Language Preference: ${context.farmer.preferred_language}`
    : '';

  const farmInfo = context.farms?.length
    ? `\nFARMS (${context.farms.length}):\n${context.farms.map(f =>
      `- ${f.name}: ${f.land_size_acres} acres, Soil: ${f.soil_type || 'N/A'}, Irrigation: ${f.irrigation_type || 'N/A'}, Crops: ${f.primary_crops || 'N/A'}`
    ).join('\n')}`
    : '';

  const activityInfo = context.activities?.length
    ? `\nRECENT FARMING ACTIVITIES:\n${context.activities.slice(0, 8).map(a =>
      `- [${a.type}] ${a.note || ''} (${a.date ? new Date(a.date).toLocaleDateString('en-IN') : ''})`
    ).join('\n')}`
    : '';

  const recInfo = context.recommendations?.length
    ? `\nAI RECOMMENDATIONS ALREADY PROVIDED:\n${context.recommendations.slice(0, 5).map(r =>
      `- [${r.category}] ${r.title}: ${r.description?.substring(0, 100)}`
    ).join('\n')}`
    : '';

  const schemeInfo = context.schemes?.length
    ? `\nAVAILABLE GOVERNMENT SCHEMES:\n${context.schemes.slice(0, 6).map(s =>
      `- ${s.name} (${s.category}): ${s.description?.substring(0, 80)}... URL: ${s.official_url}`
    ).join('\n')}`
    : '';

  const officerInfo = context.officers?.length
    ? `\nLOCAL AGRICULTURAL OFFICERS:\n${context.officers.slice(0, 3).map(o =>
      `- ${o.name}, ${o.designation}, ${o.specialization}, Contact: ${o.phone}`
    ).join('\n')}`
    : '';

  const recentConvo = conversationHistory?.length
    ? `\nRECENT CONVERSATION:\n${conversationHistory.slice(-6).map(m =>
      `${m.role === 'user' ? 'Farmer' : 'Krishi Sakhi'}: ${m.text?.substring(0, 150)}`
    ).join('\n')}`
    : '';

  return `You are **Krishi Sakhi** (कृषि सखी), an expert AI agricultural advisor for Indian farmers. You have deep knowledge of Indian agriculture, crops, soil science, weather patterns, pest management, government schemes, market prices, and best farming practices.

RESPOND IN: ${language || 'English'}

═══ FARMER'S COMPLETE DATA FROM THE APP ═══
${farmerInfo}
${farmInfo}
${activityInfo}
${recInfo}
${schemeInfo}
${officerInfo}
${recentConvo}
═══ END OF CONTEXT ═══

INSTRUCTIONS:
1. Use the farmer's actual data above to give PERSONALIZED answers
2. Reference their specific farms, crops, location, and activities when relevant
3. If asked about schemes, provide scheme names, key benefits, AND official URLs from the data above
4. If asked about officers, share their name, designation, and contact details
5. Include practical, actionable advice with specific numbers (quantities, timing, costs)
6. If asked about weather, provide seasonal advice based on their state and current month
7. For market/price questions, give crop-specific advice for their region
8. Structure longer answers with bullet points or numbered steps for clarity
9. If you don't have enough information, suggest which section of the app they can use (Weather, Market, Detect, Officers, Schemes)
10. Be warm, supportive, and encouraging — farmers are your partners
11. For crop disease questions, describe symptoms and suggest both organic and chemical remedies
12. Always mention relevant government schemes when giving advice about finances or subsidies

FARMER'S QUESTION: "${userMessage}"

Provide a detailed, helpful, and actionable response:`;
}

// ─── Smart Fallback Logic (When Gemini Fails) ──────────────────────
function getSmartFallback(userMessage, context, language) {
  const lo = userMessage.toLowerCase();
  const lang = (language || 'English').toLowerCase();
  const isMal = lang.includes('malayalam');

  // Personalized context strings
  const farmCount = context.farms?.length || 0;
  const cropsList = context.farms?.flatMap(f => 
    typeof f.primary_crops === 'string' 
      ? f.primary_crops.split(',').map(c => c.trim()).filter(Boolean)
      : (Array.isArray(f.primary_crops) ? f.primary_crops : [])
  ) || [];
  const uniqueCrops = [...new Set(cropsList)];
  const schemes = context.schemes?.map(s => s.name).slice(0, 3) || [];
  const officers = context.officers?.map(o => o.name).slice(0, 2) || [];

  let response = "";

  // 1. Context-Aware Welcome/Generic
  if (farmCount > 0) {
    response += isMal 
      ? `നിങ്ങളുടെ **${farmCount}** ഫാമുകളെക്കുറിച്ചുള്ള വിവരങ്ങൾ എന്റെ പക്കലുണ്ട്. `
      : `I have information about your **${farmCount}** farms. `;
  }

  // 2. Keyword Matching
  if (lo.includes('scheme') || lo.includes('pm-kisan') || lo.includes('government') || lo.includes('വില') || lo.includes('പദ്ധതി')) {
    response += isMal
      ? `നിങ്ങൾക്ക് പ്രയോജനപ്പെടുത്താവുന്ന പ്രധാന പദ്ധതികൾ: **${schemes.join(', ') || 'PM-KISAN, PMFBY'}**. കൂടുതൽ വിവരങ്ങൾക്ക് **Schemes** പേജ് സന്ദർശിക്കുക.`
      : `Based on your profile, you can benefit from: **${schemes.join(', ') || 'PM-KISAN, PMFBY, KCC'}**. Check the **Schemes** section for official links.`;
  } 
  else if (lo.includes('price') || lo.includes('market') || lo.includes('വില') || lo.includes('വിപണി')) {
    response += isMal
      ? `വിപണി വിലകൾക്കും ട്രെൻഡുകൾക്കുമായി **Market** സെക്ഷൻ പരിശോധിക്കുക. നിങ്ങളുടെ ജില്ലയിലെ മണ്ടികളിലെ വിലകൾ അവിടെ ലഭ്യമാണ്.`
      : `You can check live prices and mandi trends in the **Market** section. It shows real-time data for your district.`;
  }
  else if (lo.includes('officer') || lo.includes('consult') || lo.includes('ഉദ്യോഗസ്ഥൻ')) {
    response += isMal
      ? `നിങ്ങളുടെ ഭാഗത്തുള്ള കൃഷി ഓഫീസർമാർ: **${officers.join(', ') || 'കൃഷി ഭവൻ ഉദ്യോഗസ്ഥർ'}**. **Officers** പേജിൽ ഇവരുമായി കൂടിക്കാഴ്ച ബുക്ക് ചെയ്യാം.`
      : `Agricultural officers near you include **${officers.join(', ') || 'local KVK experts'}**. You can book a consultation in the **Officers** section.`;
  }
  else if (lo.includes('weather') || lo.includes('rain') || lo.includes('മഴ')) {
    response += isMal
      ? `കാലാവസ്ഥാ പ്രവചനത്തിനായി **Weather** പേജ് സന്ദർശിക്കുക. അടുത്ത 5 ദിവസത്തെ വിവരങ്ങൾ അവിടെ ലഭ്യമാണ്.`
      : `For detailed 5-day forecasts, please visit the **Weather** section. It's best to check this before spraying or harvesting.`;
  }
  else if (uniqueCrops.some(c => lo.includes(c.toLowerCase()))) {
    const matchedCrop = uniqueCrops.find(c => lo.includes(c.toLowerCase()));
    response += isMal
      ? `നിങ്ങളുടെ **${matchedCrop}** കൃഷിയെക്കുറിച്ച് ചോദിച്ചതിന് നന്ദി. നല്ല വിളവിനായി ജൈവ വളങ്ങൾ ഉപയോഗിക്കുക. കൂടുതൽ സഹായത്തിന് **Detect** പേജ് ഉപയോഗിക്കാം.`
      : `Since you asked about **${matchedCrop}**, I recommend using organic mulch and ensuring proper drainage. You can also use the **Detect** page for health checks.`;
  }
  else {
    response += isMal
      ? `ഞാൻ നിങ്ങളുടെ **കൃഷി സഖി** ആണ്. ഫാമുകൾ, കൃഷി വിദ്യകൾ, സർക്കാർ പദ്ധതികൾ എന്നിവയെക്കുറിച്ച് എനിക്ക് നിങ്ങളെ സഹായിക്കാനാകും.`
      : `I'm your **Krishi Sakhi** farming guide. I can help with crops, weather, schemes, and expert consultations. Using your specific farm data, I'll provide the best advice!`;
  }

  // Append a helpful footer
  response += isMal
    ? `\n\n*(ശ്രദ്ധിക്കുക: നിലവിൽ ഞാൻ ഒരു ലളിതമായ മറുപടിയാണ് നൽകുന്നത്, കൂടുതൽ വിവരങ്ങൾക്ക് ബന്ധപ്പെട്ട സെക്ഷനുകൾ നോക്കുക)*`
    : `\n\n*(Note: I'm currently providing a smart-fallback response. For real-time analysis, check the specific app sections!)*`;

  return response;
}

// ─── POST /api/chatbot/gemini ───────────────────────────────────────
exports.chat = async (req, res) => {
  const { message, language, farmer_id, conversation_history } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

  // Gather full cross-section context
  let context = {};
  if (farmer_id) context = await gatherFarmerContext(farmer_id);

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
      return res.status(500).json({ success: false, message: 'Gemini API key not configured' });
  }

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildPrompt(message, context, language || 'English', conversation_history);

  // Models to try in order
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash'
  ];

  let lastError = null;
  let reply = null;
  let successfulModel = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting Gemini chat with model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
      });
      
      const response = await result.response;
      reply = response.text();
      
      if (reply) {
        successfulModel = modelName;
        console.log(`✅ Success with model: ${modelName}`);
        break; 
      }
    } catch (err) {
      console.error(`❌ Model ${modelName} failed:`, err.message);
      lastError = err.message;
    }
  }

  if (reply) {
    return res.json({
      success: true,
      reply,
      is_fallback: false,
      model_used: successfulModel,
      context_used: {
        has_farms: (context.farms?.length || 0) > 0,
        has_activities: (context.activities?.length || 0) > 0,
        has_schemes: (context.schemes?.length || 0) > 0,
        has_officers: (context.officers?.length || 0) > 0,
        has_recommendations: (context.recommendations?.length || 0) > 0
      }
    });
  }

  // If ALL models failed, use the smart fallback
  console.error('All Gemini models failed. Using Smart Fallback. Last error:', lastError);
  const fallbackReply = getSmartFallback(message, context, language);
  
  res.json({
    success: true,
    reply: fallbackReply,
    is_fallback: true,
    error: lastError,
    context_used: {
      has_farms: (context.farms?.length || 0) > 0,
      has_activities: (context.activities?.length || 0) > 0,
      has_schemes: (context.schemes?.length || 0) > 0,
      has_officers: (context.officers?.length || 0) > 0,
      has_recommendations: (context.recommendations?.length || 0) > 0
    }
  });
};

// ─── GET /api/chatbot/suggestions ───────────────────────────────────
exports.getSuggestions = async (req, res) => {
  try {
    const { farmer_id } = req.query;
    let suggestions = [
      'What are the best farming practices for this season?',
      'Which government schemes can I benefit from?',
      'How do I improve my soil health?',
      'What is the current market price for my crops?',
      'How to protect crops from pests organically?',
      'What fertilizers should I use for rice cultivation?',
      'How to get a Kisan Credit Card?',
      'Tell me about PM-KISAN scheme benefits'
    ];

    if (farmer_id) {
      const farms = await Farm.find({ farmer: farmer_id }).lean();
      if (farms.length > 0) {
        const cropsList = farms.flatMap(f => 
          typeof f.primary_crops === 'string' 
            ? f.primary_crops.split(',').map(c => c.trim()).filter(Boolean)
            : (Array.isArray(f.primary_crops) ? f.primary_crops : [])
        );
        if (cropsList.length > 0) {
          suggestions.unshift(
            `What's the best time to harvest ${cropsList[0]}?`,
            `How to increase ${cropsList[0]} yield per acre?`,
            `What are common diseases in ${cropsList[0]}?`
          );
        }
      }
    }

    res.json({ success: true, data: suggestions.slice(0, 8) });
  } catch (error) {
    res.json({ success: true, data: ['How can I improve my farming?'] });
  }
};
