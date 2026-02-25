const Recommendation = require('../models/Recommendation');
const Farm = require('../models/Farm');
const Activity = require('../models/Activity');

// ─── 1) Generate AI recommendations from farm + activity data ────────
exports.generateRecommendations = async (req, res) => {
  try {
    const { farmer_id } = req.body;
    if (!farmer_id) return res.status(400).json({ success: false, message: 'farmer_id is required' });

    // Fetch the farmer's farms and recent activities
    const [farms, activities] = await Promise.all([
      Farm.find({ farmer: farmer_id }).lean(),
      Activity.find({ farmer: farmer_id }).sort({ date: -1 }).limit(20).lean()
    ]);

    if (farms.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No farms found. Please add a farm to get recommendations.'
      });
    }

    // Build context for Gemini
    const farmSummary = farms.map(f => ({
      name: f.name,
      size: f.land_size_acres,
      soil_type: f.soil_type,
      irrigation: f.irrigation_type,
      crops: f.primary_crops,
      district: f.district,
      state: f.state
    }));

    const activitySummary = activities.slice(0, 10).map(a => ({
      type: a.activity_type || a.type,
      note: a.note || a.text_note,
      date: a.date,
      amount: a.amount
    }));

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      // Return static recommendations if no API key
      return res.json({ success: true, data: generateStaticRecommendations(farmSummary, activitySummary) });
    }

    const prompt = `You are an expert Indian agricultural advisor. Based on this farmer's data, generate 8 specific, actionable farming recommendations.

FARM DATA:
${JSON.stringify(farmSummary, null, 2)}

RECENT ACTIVITIES:
${JSON.stringify(activitySummary, null, 2)}

Generate EXACTLY 8 recommendations in the following JSON array format. Each item must have these exact keys:
[
  {
    "category": "crop" or "soil" or "irrigation" or "pest" or "fertilizer" or "market" or "best_practice",
    "title": "Short actionable title",
    "description": "Detailed 2-3 sentence recommendation specific to this farmer's data, soil type, crops, and location",
    "impact": "high" or "medium" or "low",
    "priority": 1-10 (10 is highest priority),
    "tags": ["tag1", "tag2"]
  }
]

IMPORTANT RULES:
- Be VERY SPECIFIC to the farmer's soil type, crops, irrigation, and location
- Include at least 2 soil-quality recommendations
- Include at least 1 irrigation recommendation
- Include best practices for the specific crops they grow
- Mention specific quantities (kg/acre, ratios, timing) where possible
- For Indian farming contexts (seasons: Kharif, Rabi, Zaid)
- Respond ONLY with valid JSON array, no markdown`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2000 }
        })
      }
    );

    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let recommendations = [];
    try {
      const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      recommendations = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse Gemini response, using static fallback');
      recommendations = generateStaticRecommendations(farmSummary, activitySummary);
    }

    // Save recommendations to DB
    const savedRecs = [];
    for (const rec of recommendations) {
      const saved = await Recommendation.create({
        farmer: farmer_id,
        category: rec.category || 'general',
        title: rec.title,
        description: rec.description,
        impact: rec.impact || 'medium',
        priority: rec.priority || 5,
        tags: rec.tags || [],
        source_data: { farms: farmSummary, activities: activitySummary }
      });
      savedRecs.push(saved);
    }

    res.json({ success: true, data: savedRecs });
  } catch (error) {
    console.error('generateRecommendations error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate recommendations' });
  }
};

// ─── 2) List saved recommendations ──────────────────────────────────
exports.listRecommendations = async (req, res) => {
  try {
    const { farmer_id, category, is_saved } = req.query;
    if (!farmer_id) return res.status(400).json({ success: false, message: 'farmer_id is required' });

    const query = { farmer: farmer_id };
    if (category) query.category = category;
    if (is_saved === 'true') query.is_saved = true;

    const recs = await Recommendation.find(query).sort({ priority: -1, createdAt: -1 }).limit(50);
    res.json({ success: true, data: recs });
  } catch (error) {
    console.error('listRecommendations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── 3) Toggle save / read ──────────────────────────────────────────
exports.updateRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_saved, is_read } = req.body;
    const update = {};
    if (typeof is_saved === 'boolean') update.is_saved = is_saved;
    if (typeof is_read === 'boolean') update.is_read = is_read;

    const rec = await Recommendation.findByIdAndUpdate(id, update, { new: true });
    if (!rec) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rec });
  } catch (error) {
    console.error('updateRecommendation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── 4) Delete a recommendation ─────────────────────────────────────
exports.deleteRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    await Recommendation.findByIdAndDelete(id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    console.error('deleteRecommendation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── 5) Clear all recommendations for a farmer ─────────────────────
exports.clearRecommendations = async (req, res) => {
  try {
    const { farmer_id } = req.query;
    if (!farmer_id) return res.status(400).json({ success: false, message: 'farmer_id is required' });
    await Recommendation.deleteMany({ farmer: farmer_id });
    res.json({ success: true, message: 'All recommendations cleared' });
  } catch (error) {
    console.error('clearRecommendations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Static fallback recommendations ────────────────────────────────
function generateStaticRecommendations(farms, activities) {
  const mainFarm = farms[0] || {};
  const soil = mainFarm.soil_type || 'loamy';
  const crops = mainFarm.crops || 'Rice';
  const irrigation = mainFarm.irrigation || 'rain_fed';
  const district = mainFarm.district || '';

  return [
    {
      category: 'soil',
      title: `Soil Health Improvement for ${soil} soil`,
      description: `For your ${soil} soil in ${district}, apply organic compost at 5-8 tonnes/acre before the next sowing to improve nutrient content and water retention. Consider adding vermicompost for additional micronutrients.`,
      impact: 'high', priority: 9, tags: ['soil', 'organic', 'compost']
    },
    {
      category: 'soil',
      title: 'Soil Testing Recommendation',
      description: `Schedule a soil test at your nearest Krishi Vigyan Kendra (KVK) in ${district}. Test for pH, nitrogen, phosphorus, and potassium levels to optimize fertilizer application and save costs.`,
      impact: 'high', priority: 8, tags: ['soil', 'testing', 'KVK']
    },
    {
      category: 'crop',
      title: `Crop Rotation Strategy for ${crops}`,
      description: `After harvesting ${crops}, consider rotating with nitrogen-fixing legumes (e.g., Green Gram, Black Gram) in the next season. This replenishes soil nitrogen naturally and improves overall soil health.`,
      impact: 'high', priority: 8, tags: ['crop', 'rotation', 'yield']
    },
    {
      category: 'irrigation',
      title: `Irrigation Optimization for ${irrigation}`,
      description: irrigation === 'rain_fed'
        ? 'Consider installing micro-irrigation (drip/sprinkler) to reduce water use by 40-60%. Government subsidy up to 55% is available under PMKSY scheme.'
        : 'Optimize your irrigation schedule based on crop stage. Use soil moisture sensors to avoid over-watering which can lead to root rot and nutrient leaching.',
      impact: 'high', priority: 7, tags: ['irrigation', 'water']
    },
    {
      category: 'fertilizer',
      title: 'Balanced Fertilizer Application',
      description: `For your ${soil} soil growing ${crops}, use a balanced NPK ratio of 4:2:1. Apply nitrogen in split doses — 50% at sowing and 50% at tillering stage — for maximum uptake efficiency.`,
      impact: 'medium', priority: 6, tags: ['fertilizer', 'NPK']
    },
    {
      category: 'pest',
      title: 'Integrated Pest Management (IPM)',
      description: `For ${crops} in ${district}, implement IPM practices: use neem-based bio-pesticides as a first line of defense, install pheromone traps, and encourage natural predators like ladybugs and lacewings.`,
      impact: 'medium', priority: 6, tags: ['pest', 'organic', 'IPM']
    },
    {
      category: 'best_practice',
      title: 'Mulching for Moisture Retention',
      description: `Apply straw or dried leaf mulch between ${crops} rows at 10-15cm thickness. This reduces evaporation by up to 50%, suppresses weeds, and adds organic matter as it decomposes.`,
      impact: 'medium', priority: 5, tags: ['mulching', 'moisture']
    },
    {
      category: 'market',
      title: 'Post-Harvest Best Practices',
      description: `Dry ${crops} to the recommended 14% moisture content before storage. Use hermetic bags or metallic bins to prevent pest infestation. This can reduce post-harvest losses by up to 30%.`,
      impact: 'medium', priority: 5, tags: ['post-harvest', 'storage']
    }
  ];
}
