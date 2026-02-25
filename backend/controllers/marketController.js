const MarketPrice = require('../models/MarketPrice');
const Transaction = require('../models/Transaction');

// ─── State-wise popular crops (at least 10 per state) ────────────────
const STATE_CROPS = {
  'Andhra Pradesh':    ['Rice','Groundnut','Cotton','Chilli','Turmeric','Maize','Sugarcane','Tobacco','Mango','Banana','Onion','Tomato'],
  'Arunachal Pradesh': ['Rice','Maize','Ginger','Turmeric','Orange','Apple','Kiwi','Cardamom','Soyabean','Mustard','Millet','Potato'],
  'Assam':             ['Rice','Tea','Jute','Sugarcane','Potato','Mustard','Banana','Orange','Areca Nut','Ginger','Turmeric','Lemon'],
  'Bihar':             ['Rice','Wheat','Maize','Sugarcane','Potato','Onion','Lentil','Gram','Mustard','Banana','Litchi','Mango'],
  'Chhattisgarh':      ['Rice','Maize','Soyabean','Groundnut','Sugarcane','Wheat','Gram','Lentil','Tomato','Onion','Potato','Mustard'],
  'Goa':               ['Rice','Coconut','Cashew','Mango','Banana','Pineapple','Areca Nut','Sugarcane','Pepper','Watermelon','Cucumber','Brinjal'],
  'Gujarat':           ['Cotton','Groundnut','Wheat','Rice','Castor Seed','Cumin','Bajra','Sugarcane','Onion','Potato','Tomato','Mango'],
  'Haryana':           ['Wheat','Rice','Bajra','Cotton','Sugarcane','Mustard','Gram','Potato','Tomato','Onion','Barley','Maize'],
  'Himachal Pradesh':  ['Apple','Wheat','Maize','Rice','Barley','Potato','Ginger','Tomato','Pea','Plum','Walnut','Apricot'],
  'Jharkhand':         ['Rice','Wheat','Maize','Gram','Lentil','Potato','Tomato','Onion','Mustard','Sugarcane','Mango','Banana'],
  'Karnataka':         ['Rice','Ragi','Maize','Sugarcane','Cotton','Groundnut','Coconut','Coffee','Pepper','Cardamom','Tomato','Onion'],
  'Kerala':            ['Rice','Coconut','Pepper','Cardamom','Rubber','Ginger','Turmeric','Coffee','Tea','Banana','Cashew','Arecanut','Tapioca','Nutmeg'],
  'Madhya Pradesh':    ['Soyabean','Wheat','Rice','Gram','Maize','Cotton','Sugarcane','Lentil','Mustard','Onion','Garlic','Potato'],
  'Maharashtra':       ['Sugarcane','Cotton','Soyabean','Rice','Wheat','Onion','Gram','Groundnut','Banana','Mango','Grapes','Turmeric'],
  'Manipur':           ['Rice','Maize','Soyabean','Mustard','Potato','Ginger','Turmeric','Orange','Pineapple','Banana','Pea','Cabbage'],
  'Meghalaya':         ['Rice','Maize','Potato','Ginger','Turmeric','Orange','Pineapple','Banana','Areca Nut','Cashew','Jute','Tea'],
  'Mizoram':           ['Rice','Maize','Sugarcane','Ginger','Turmeric','Banana','Orange','Passion Fruit','Chilli','Sesame','Mustard','Potato'],
  'Nagaland':          ['Rice','Maize','Millet','Soyabean','Potato','Ginger','Turmeric','Chilli','Orange','Pineapple','Sugarcane','Mustard'],
  'Odisha':            ['Rice','Groundnut','Sugarcane','Jute','Mustard','Sesamum','Cotton','Maize','Turmeric','Onion','Potato','Mango'],
  'Punjab':            ['Wheat','Rice','Cotton','Maize','Sugarcane','Potato','Bajra','Barley','Mustard','Onion','Tomato','Pea'],
  'Rajasthan':         ['Bajra','Wheat','Barley','Maize','Gram','Mustard','Cumin','Groundnut','Cotton','Onion','Garlic','Guar'],
  'Sikkim':            ['Rice','Maize','Ginger','Turmeric','Cardamom','Orange','Potato','Buckwheat','Millet','Apple','Pea','Soyabean'],
  'Tamil Nadu':        ['Rice','Sugarcane','Coconut','Groundnut','Cotton','Banana','Mango','Turmeric','Maize','Tapioca','Onion','Chilli'],
  'Telangana':         ['Rice','Cotton','Maize','Chilli','Turmeric','Sugarcane','Soyabean','Groundnut','Mango','Orange','Onion','Tomato'],
  'Tripura':           ['Rice','Jute','Sugarcane','Potato','Mustard','Tea','Rubber','Banana','Pineapple','Orange','Ginger','Jackfruit'],
  'Uttar Pradesh':     ['Wheat','Rice','Sugarcane','Potato','Mustard','Gram','Maize','Bajra','Onion','Tomato','Mango','Banana'],
  'Uttarakhand':       ['Rice','Wheat','Sugarcane','Soyabean','Maize','Potato','Ginger','Turmeric','Apple','Walnut','Mandarin','Litchi'],
  'West Bengal':       ['Rice','Jute','Potato','Tea','Mustard','Sugarcane','Wheat','Maize','Sesame','Mango','Banana','Lentil'],
};

// ─── Realistic price ranges per commodity (₹ per quintal) ────────────
const PRICE_RANGES = {
  'Rice':        { min: 1800, max: 3500 },   'Wheat':       { min: 1800, max: 2800 },
  'Maize':       { min: 1500, max: 2500 },   'Sugarcane':   { min: 280, max: 400 },
  'Cotton':      { min: 5500, max: 7500 },   'Soyabean':    { min: 3500, max: 5000 },
  'Groundnut':   { min: 4500, max: 6500 },   'Mustard':     { min: 4000, max: 5500 },
  'Gram':        { min: 4000, max: 5500 },   'Lentil':      { min: 4500, max: 6000 },
  'Potato':      { min: 800, max: 2000 },    'Onion':       { min: 1000, max: 3500 },
  'Tomato':      { min: 800, max: 4000 },    'Banana':      { min: 1500, max: 3000 },
  'Mango':       { min: 2000, max: 6000 },   'Coconut':     { min: 1500, max: 3000 },
  'Pepper':      { min: 30000, max: 50000 }, 'Cardamom':    { min: 80000, max: 150000 },
  'Turmeric':    { min: 6000, max: 12000 },  'Ginger':      { min: 3000, max: 8000 },
  'Coffee':      { min: 15000, max: 30000 }, 'Tea':         { min: 15000, max: 25000 },
  'Rubber':      { min: 12000, max: 18000 }, 'Cashew':      { min: 8000, max: 14000 },
  'Jute':        { min: 3500, max: 5500 },   'Bajra':       { min: 1800, max: 2800 },
  'Barley':      { min: 1500, max: 2500 },   'Chilli':      { min: 8000, max: 18000 },
  'Cumin':       { min: 15000, max: 35000 }, 'Garlic':      { min: 5000, max: 15000 },
  'Apple':       { min: 5000, max: 12000 },  'Orange':      { min: 2000, max: 5000 },
  'Grapes':      { min: 3000, max: 8000 },   'Litchi':      { min: 3000, max: 8000 },
  'Pineapple':   { min: 1500, max: 4000 },   'Tapioca':     { min: 600, max: 1500 },
  'Areca Nut':   { min: 25000, max: 45000 }, 'Arecanut':    { min: 25000, max: 45000 },
  'Sesamum':     { min: 8000, max: 14000 },  'Sesame':      { min: 8000, max: 14000 },
  'Castor Seed': { min: 4500, max: 6500 },   'Ragi':        { min: 2500, max: 4000 },
  'Tobacco':     { min: 10000, max: 18000 }, 'Pea':         { min: 3000, max: 5000 },
  'Walnut':      { min: 20000, max: 40000 }, 'Millet':      { min: 2000, max: 3500 },
  'Guar':        { min: 4000, max: 6000 },   'Nutmeg':      { min: 40000, max: 80000 },
  'Plum':        { min: 3000, max: 7000 },   'Apricot':     { min: 5000, max: 12000 },
  'Cabbage':     { min: 500, max: 1500 },    'Brinjal':     { min: 800, max: 2500 },
  'Cucumber':    { min: 600, max: 1800 },    'Watermelon':  { min: 500, max: 1500 },
  'Kiwi':        { min: 10000, max: 25000 }, 'Jackfruit':   { min: 1000, max: 3000 },
  'Soyabean':    { min: 3500, max: 5000 },   'Buckwheat':   { min: 3000, max: 5000 },
  'Passion Fruit': { min: 5000, max: 12000 }, 'Mandarin':   { min: 2000, max: 5000 },
};

// ─── Helper: generate realistic price with small daily fluctuation ───
function generateRealisticPrice(commodity, dayOffset = 0) {
  const range = PRICE_RANGES[commodity] || { min: 1000, max: 3000 };
  const basePrice = range.min + (range.max - range.min) * 0.5;
  const volatility = (range.max - range.min) * 0.08;
  const seed = (commodity.charCodeAt(0) * 31 + dayOffset * 7) % 100;
  const fluctuation = (seed / 100 - 0.5) * 2 * volatility;
  const modal = Math.round(basePrice + fluctuation);
  const min = Math.round(modal * (0.85 + (seed % 10) * 0.005));
  const max = Math.round(modal * (1.05 + (seed % 10) * 0.005));
  return { min_price: min, max_price: max, modal_price: modal };
}

// ─── 1) Get crops for a state ────────────────────────────────────────
exports.getCrops = async (req, res) => {
  try {
    const { state } = req.query;
    if (!state) return res.status(400).json({ success: false, message: 'State is required' });

    const crops = STATE_CROPS[state] || STATE_CROPS['Kerala'];
    res.json({ success: true, data: crops });
  } catch (error) {
    console.error('getCrops error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── 2) Get live prices (generate + store) ───────────────────────────
exports.getPrices = async (req, res) => {
  try {
    const { state, district, commodity } = req.query;
    if (!state || !commodity) {
      return res.status(400).json({ success: false, message: 'State and commodity are required' });
    }

    // Check cache (within last 30 minutes)
    const cacheKey = { state, commodity };
    if (district) cacheKey.district = district;

    const cached = await MarketPrice.find({
      ...cacheKey,
      fetched_at: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
    }).sort({ arrival_date: -1 }).limit(5);

    if (cached.length > 0) {
      return res.json({ success: true, data: cached, source: 'cache' });
    }

    // Generate realistic prices for multiple varieties
    const varieties = ['FAQ', 'Standard', 'Premium'];
    const marketName = `${district || state} Market`;
    const now = new Date();
    const records = [];

    for (const variety of varieties) {
      const prices = generateRealisticPrice(commodity, variety.charCodeAt(0));
      const record = await MarketPrice.create({
        state,
        district: district || '',
        market: marketName,
        commodity,
        variety,
        grade: variety,
        ...prices,
        arrival_date: now,
        fetched_at: now
      });
      records.push(record);
    }

    res.json({ success: true, data: records, source: 'fresh' });
  } catch (error) {
    console.error('getPrices error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── 3) Get price history (7 days) ──────────────────────────────────
exports.getPriceHistory = async (req, res) => {
  try {
    const { state, commodity, days = 7 } = req.query;
    if (!state || !commodity) {
      return res.status(400).json({ success: false, message: 'State and commodity are required' });
    }

    // Check DB for existing history
    const history = await MarketPrice.find({
      state, commodity
    }).sort({ arrival_date: -1 }).limit(parseInt(days));

    if (history.length >= 3) {
      // Return actual DB data
      const chartData = history.reverse().map(h => ({
        date: h.arrival_date,
        min_price: h.min_price,
        max_price: h.max_price,
        modal_price: h.modal_price
      }));
      return res.json({ success: true, data: chartData });
    }

    // Generate synthetic 7-day history
    const chartData = [];
    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const prices = generateRealisticPrice(commodity, i);
      chartData.push({
        date: date.toISOString().split('T')[0],
        ...prices
      });
    }

    res.json({ success: true, data: chartData });
  } catch (error) {
    console.error('getPriceHistory error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── 4) Gemini-powered market insights ──────────────────────────────
exports.getInsights = async (req, res) => {
  try {
    const { commodity, state, district, modal_price, min_price, max_price } = req.body;
    if (!commodity || !state) {
      return res.status(400).json({ success: false, message: 'Commodity and state are required' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.json({
        success: true,
        data: {
          summary: `${commodity} is currently trading at ₹${modal_price}/quintal in ${district || state}. Market conditions appear stable.`,
          tips: [
            `Compare prices across nearby markets before selling ${commodity}.`,
            `Current price spread (₹${min_price} - ₹${max_price}) suggests moderate market activity.`,
            `Consider storage if prices are expected to rise in the coming weeks.`
          ],
          trend: 'stable',
          recommendation: 'hold'
        }
      });
    }

    const prompt = `You are an Indian agricultural market expert. Analyze the following data and provide insights in JSON format:

Crop: ${commodity}
State: ${state}
District: ${district || 'N/A'}
Current Modal Price: ₹${modal_price || 'N/A'}/quintal
Min Price: ₹${min_price || 'N/A'}/quintal
Max Price: ₹${max_price || 'N/A'}/quintal

Return a JSON object with these exact keys:
{
  "summary": "2-3 sentence market analysis",
  "tips": ["tip1", "tip2", "tip3", "tip4"],
  "trend": "rising" or "falling" or "stable",
  "recommendation": "buy" or "sell" or "hold",
  "forecast": "1-2 sentence price forecast for next 2 weeks"
}

Be specific with numbers and actionable advice for Indian farmers. Respond ONLY with valid JSON, no markdown.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      }
    );

    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from Gemini response
    let insights;
    try {
      const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      insights = JSON.parse(jsonStr);
    } catch {
      insights = {
        summary: text.substring(0, 300) || `${commodity} market analysis for ${state}.`,
        tips: [`Monitor ${commodity} prices in ${district || state} regularly.`],
        trend: 'stable',
        recommendation: 'hold'
      };
    }

    res.json({ success: true, data: insights });
  } catch (error) {
    console.error('getInsights error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate insights' });
  }
};

// ─── 5) Create transaction (buy/sell) ────────────────────────────────
exports.createTransaction = async (req, res) => {
  try {
    const { farmer, type, commodity, variety, market, state, district, quantity, unit, price_per_unit, total_price, notes } = req.body;

    if (!farmer || !type || !commodity || !quantity || !price_per_unit) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const transaction = await Transaction.create({
      farmer, type, commodity, variety, market, state, district,
      quantity, unit: unit || 'quintal',
      price_per_unit, total_price: total_price || (quantity * price_per_unit),
      notes
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    console.error('createTransaction error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── 6) List transactions for a farmer ───────────────────────────────
exports.listTransactions = async (req, res) => {
  try {
    const { farmer_id, type, status } = req.query;
    if (!farmer_id) return res.status(400).json({ success: false, message: 'farmer_id is required' });

    const query = { farmer: farmer_id };
    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('farmer', 'name phone');

    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('listTransactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
