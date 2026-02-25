const Scheme = require('../models/Scheme');

// ─── Comprehensive static scheme data ───────────────────────────────
const NATIONAL_SCHEMES = [
  {
    name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    category: 'national', state: 'All India',
    department: 'Ministry of Agriculture & Farmers Welfare',
    description: 'Direct income support of ₹6,000 per year to small and marginal farmer families, paid in three equal instalments of ₹2,000 every four months.',
    highlights: ['₹6,000/year direct transfer', '3 instalments of ₹2,000 each', 'Over 11 crore beneficiaries', 'No land size restriction since 2019', 'Linked to Aadhaar for verification'],
    eligibility: 'All farmer families with cultivable land regardless of size of land holding',
    benefits: 'Direct cash transfer of ₹6,000 per annum in 3 instalments',
    official_url: 'https://pmkisan.gov.in',
    launch_year: '2019', status: 'active',
    tags: ['income support', 'direct benefit', 'PM scheme']
  },
  {
    name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    category: 'national', state: 'All India',
    department: 'Ministry of Agriculture & Farmers Welfare',
    description: 'Comprehensive crop insurance scheme providing financial support to farmers suffering crop loss due to natural calamities, pest attacks, and diseases.',
    highlights: ['Premium: 2% for Kharif, 1.5% for Rabi', 'Coverage from sowing to post-harvest', 'Use of satellite imagery & drones for assessment', 'Claim settlement within 2 months', 'Covers all food & oilseed crops'],
    eligibility: 'All farmers growing notified crops in notified areas, both loanee and non-loanee',
    benefits: 'Full insured sum coverage against crop loss with minimal premium',
    official_url: 'https://pmfby.gov.in',
    launch_year: '2016', status: 'active',
    tags: ['crop insurance', 'risk management', 'disaster protection']
  },
  {
    name: 'PM Kisan Maandhan Yojana',
    category: 'national', state: 'All India',
    department: 'Ministry of Agriculture & Farmers Welfare',
    description: 'Pension scheme for small and marginal farmers providing ₹3,000 per month pension after the age of 60 years.',
    highlights: ['₹3,000/month pension after age 60', 'Contribution: ₹55-200/month based on age', 'Equal government contribution', 'Voluntary scheme', 'Covers small & marginal farmers'],
    eligibility: 'Small and marginal farmers aged 18-40 years with cultivable land up to 2 hectares',
    benefits: 'Monthly pension of ₹3,000 after attaining the age of 60 years',
    official_url: 'https://maandhan.in/shramyogi',
    launch_year: '2019', status: 'active',
    tags: ['pension', 'social security', 'old age']
  },
  {
    name: 'Soil Health Card Scheme',
    category: 'national', state: 'All India',
    department: 'Department of Agriculture, Cooperation & Farmers Welfare',
    description: 'Scheme to provide soil health cards to farmers with crop-wise recommendations of nutrients and fertilizers required for individual farms.',
    highlights: ['Free soil testing every 2 years', 'Crop-wise nutrient recommendations', 'GPS-based soil sampling', 'Over 23 crore cards issued', 'Reduces fertilizer wastage by 8-10%'],
    eligibility: 'All farmers across India',
    benefits: 'Free soil health card with detailed soil analysis and fertilizer recommendations',
    official_url: 'https://soilhealth.dac.gov.in',
    launch_year: '2015', status: 'active',
    tags: ['soil health', 'fertilizer', 'testing']
  },
  {
    name: 'Kisan Credit Card (KCC)',
    category: 'national', state: 'All India',
    department: 'Ministry of Finance / NABARD',
    description: 'Provides farmers with affordable credit for crop production, post-harvest expenses, and maintenance of farm assets at subsidized interest rates.',
    highlights: ['Interest rate: 4% with prompt repayment', 'Credit limit up to ₹3 lakh', 'Coverage for crop, dairy, fisheries', 'Personal accident insurance of ₹50,000', 'ATM-enabled smart card'],
    eligibility: 'All farmers, tenant farmers, sharecroppers, SHGs, and joint liability groups',
    benefits: 'Short-term crop loans at subsidized 4% interest rate',
    official_url: 'https://www.pmkisan.gov.in/KCC.aspx',
    launch_year: '1998', status: 'active',
    tags: ['credit', 'loans', 'finance']
  },
  {
    name: 'National Mission For Sustainable Agriculture (NMSA)',
    category: 'national', state: 'All India',
    department: 'Ministry of Agriculture & Farmers Welfare',
    description: 'Promotes sustainable agriculture through integrated farming, water use efficiency, soil health management, and climate change adaptation.',
    highlights: ['Rainfed area development', 'On-farm water management', 'Soil Health Management', 'Climate change adaptation', 'Subsidy up to 50% on micro-irrigation'],
    eligibility: 'All farmers, with priority to rain-fed and resource-poor farmers',
    benefits: 'Subsidies for micro-irrigation, organic farming, and capacity building',
    official_url: 'https://nmsa.dac.gov.in',
    launch_year: '2014', status: 'active',
    tags: ['sustainable', 'irrigation', 'organic']
  },
  {
    name: 'Paramparagat Krishi Vikas Yojana (PKVY)',
    category: 'national', state: 'All India',
    department: 'Ministry of Agriculture & Farmers Welfare',
    description: 'Promotes organic farming across India by forming cluster-based groups and providing financial support for organic certification and inputs.',
    highlights: ['₹50,000/hectare over 3 years', 'Organic certification support', 'Cluster-based approach (50 farmers)', 'PGS certification', 'Market linkage support'],
    eligibility: 'Farmer groups willing to adopt organic farming in clusters of 20-50 hectares',
    benefits: '₹50,000 per hectare for 3 years for organic farming adoption',
    official_url: 'https://pgsindia-ncof.gov.in/PKVY/index.aspx',
    launch_year: '2015', status: 'active',
    tags: ['organic farming', 'certification', 'cluster']
  },
  {
    name: 'e-NAM (National Agriculture Market)',
    category: 'national', state: 'All India',
    department: 'Ministry of Agriculture & Farmers Welfare',
    description: 'Pan-India electronic trading portal networking existing APMCs to create a unified national market for agricultural commodities.',
    highlights: ['1,361 mandis connected', 'Online transparent bidding', 'Direct payment to farmers', 'Real-time price discovery', 'Reduces intermediary costs'],
    eligibility: 'All farmers, traders, and commission agents in e-NAM connected mandis',
    benefits: 'Better price discovery and direct digital payment for produce',
    official_url: 'https://enam.gov.in',
    launch_year: '2016', status: 'active',
    tags: ['market', 'e-commerce', 'mandi']
  },
  {
    name: 'Pradhan Mantri Krishi Sinchai Yojana (PMKSY)',
    category: 'national', state: 'All India',
    department: 'Ministry of Agriculture & Ministry of Jal Shakti',
    description: 'Aims to provide irrigation to every farm (Har Khet Ko Pani) through water use efficiency and micro-irrigation promotion.',
    highlights: ['55% subsidy on micro-irrigation', '90% subsidy for drip (small farmers)', 'Per Drop More Crop component', 'Watershed development', 'Command area development'],
    eligibility: 'All farmers with focus on small and marginal farmers',
    benefits: 'Subsidized drip and sprinkler irrigation systems',
    official_url: 'https://pmksy.gov.in',
    launch_year: '2015', status: 'active',
    tags: ['irrigation', 'water', 'drip', 'sprinkler']
  },
  {
    name: 'Agriculture Infrastructure Fund (AIF)',
    category: 'national', state: 'All India',
    department: 'Ministry of Agriculture & Farmers Welfare',
    description: '₹1 lakh crore financing facility for post-harvest management infrastructure and community farming assets.',
    highlights: ['3% interest subvention', 'Credit guarantee up to ₹2 crore', '₹1 lakh crore fund', 'Cold storage, warehouses', 'FPOs and cooperatives eligible'],
    eligibility: 'Farmers, FPOs, PACS, agri-entrepreneurs, startups',
    benefits: 'Subsidized loans for farm infrastructure with 3% interest subvention',
    official_url: 'https://agriinfra.dac.gov.in',
    launch_year: '2020', status: 'active',
    tags: ['infrastructure', 'cold storage', 'warehouse', 'post-harvest']
  }
];

const STATE_SCHEMES = {
  'Andhra Pradesh': [
    { name: 'YSR Rythu Bharosa', description: 'Investment support of ₹13,500/year for farmer families for crop investment', highlights: ['₹13,500/year per farmer family', 'Covers tenant farmers', '₹7,500 at crop investment + ₹4,000 Kharif + ₹2,000 via PM-KISAN', 'Direct digital transfer'], official_url: 'https://ysrrythubharosa.ap.gov.in', launch_year: '2019', tags: ['income support', 'investment'] },
    { name: 'YSR Free Crop Insurance', description: 'Free crop insurance for all farmers without any premium payment', highlights: ['Zero premium for farmers', 'Covers all major crops', 'Automatic enrollment', 'State pays full premium'], official_url: 'https://www.apagrisnet.gov.in', launch_year: '2020', tags: ['insurance', 'free'] },
  ],
  'Assam': [
    { name: 'Chief Minister Samagra Gramya Unnayan Yojana', description: 'Holistic rural development including agriculture, fisheries, dairy and piggery', highlights: ['Multi-sector rural development', '₹10 lakh per village', 'Farm mechanization', 'Livelihood support'], official_url: 'https://cmsguy.assam.gov.in', launch_year: '2017', tags: ['rural development'] },
  ],
  'Bihar': [
    { name: 'Bihar Rajya Fasal Sahayata Yojana', description: 'State crop assistance scheme providing financial aid for crop damage exceeding 20%', highlights: ['₹7,500/hectare for 20% crop damage', '₹10,000/hectare for >20% damage', 'Maximum 2 hectares', 'Covers rice, wheat, maize, lentils'], official_url: 'https://pacsonline.bih.nic.in/fsy', launch_year: '2018', tags: ['crop assistance', 'disaster'] },
  ],
  'Gujarat': [
    { name: 'Kisan Suryoday Yojana', description: 'Provides daytime electricity to farmers for irrigation from 5 AM to 9 PM', highlights: ['16 hours electricity supply', 'Dedicated feeder for agriculture', 'Reduces diesel pump costs', 'Solar integration'], official_url: 'https://guj-epd.gov.in', launch_year: '2020', tags: ['electricity', 'irrigation'] },
  ],
  'Haryana': [
    { name: 'Meri Fasal Mera Byora', description: 'Portal for farmer crop registration and direct benefit transfer', highlights: ['Online crop declaration', 'MSP procurement linkage', 'Insurance enrollment', 'Direct subsidy transfer'], official_url: 'https://fasal.haryana.gov.in', launch_year: '2019', tags: ['registration', 'MSP'] },
  ],
  'Karnataka': [
    { name: 'Raitha Siri Scheme', description: 'Integrated farming system approach for sustainable agriculture in Karnataka', highlights: ['₹50,000 per farmer', 'Covers 5 components of farming', 'Training and capacity building', 'Smart agriculture focus'], official_url: 'https://raitamitra.karnataka.gov.in', launch_year: '2018', tags: ['integrated farming'] },
    { name: 'Karnataka Raita Suraksha Yojana', description: 'Comprehensive insurance coverage for farmers against crop loss and accidents', highlights: ['Free crop insurance', '₹5 lakh accident cover', 'Covers all seasons', 'Premium paid by state'], official_url: 'https://raitamitra.karnataka.gov.in', launch_year: '2019', tags: ['insurance', 'accident'] },
  ],
  'Kerala': [
    { name: 'Kerala State Paddy Cultivation Promotion', description: 'Special package for paddy cultivation with input subsidies and MSP bonus', highlights: ['MSP bonus of ₹13/kg', 'Free seeds and fertilizers', 'Mechanization support', 'Group farming encouraged'], official_url: 'https://www.keralaagriculture.gov.in', launch_year: '2016', tags: ['paddy', 'rice', 'MSP'] },
    { name: 'SUBHIKSHA Keralam', description: 'Mission to achieve food security through diversified agriculture', highlights: ['Vegetable self-sufficiency mission', 'Coconut development', 'Organic farming promotion', 'Fallow land cultivation'], official_url: 'https://www.keralaagriculture.gov.in', launch_year: '2020', tags: ['food security', 'organic'] },
  ],
  'Madhya Pradesh': [
    { name: 'Mukhyamantri Kisan Kalyan Yojana', description: 'Additional ₹4,000/year along with PM-KISAN for MP farmers', highlights: ['₹4,000/year additional to PM-KISAN', 'Total ₹10,000/year', '2 instalments of ₹2,000', 'Direct bank transfer'], official_url: 'https://mpkrishi.mp.gov.in', launch_year: '2020', tags: ['income support', 'PM-KISAN'] },
  ],
  'Maharashtra': [
    { name: 'Nanaji Deshmukh Krushi Sanjeevani Yojana', description: 'Climate-resilient agriculture project for drought-prone areas of Maharashtra', highlights: ['Climate-resilient farming', '15 drought-prone districts', 'World Bank funded', 'Farm pond scheme', 'Crop diversification'], official_url: 'https://mahapocra.gov.in', launch_year: '2018', tags: ['climate', 'drought', 'resilience'] },
    { name: 'Mahatma Jyotirao Phule Shetkari Karja Mukti Yojana', description: 'Crop loan waiver scheme for eligible farmers in Maharashtra', highlights: ['Loan waiver up to ₹2 lakh', 'Covers short-term crop loans', 'Incentives for timely repayment', 'Covers 50+ lakh farmers'], official_url: 'https://kvmy.mahaonline.gov.in', launch_year: '2019', tags: ['loan waiver', 'debt relief'] },
  ],
  'Odisha': [
    { name: 'KALIA (Krushak Assistance for Livelihood and Income Augmentation)', description: 'Comprehensive farmer support with financial assistance for cultivation and livelihood', highlights: ['₹10,000/year for cultivation', '₹12,500 for vulnerable farmers', 'Life insurance of ₹2 lakh', 'Interest-free crop loans'], official_url: 'https://kalia.odisha.gov.in', launch_year: '2019', tags: ['income support', 'insurance'] },
  ],
  'Punjab': [
    { name: 'Punjab Mandi Board Direct Payment', description: 'Direct MSP payment to farmers through digital platform', highlights: ['Direct digital MSP payment', 'Within 48 hours of sale', 'Linked to Aadhaar', 'Covers wheat and paddy'], official_url: 'https://www.mandiboard.punjab.gov.in', launch_year: '2020', tags: ['MSP', 'digital payment'] },
  ],
  'Rajasthan': [
    { name: 'Mukhyamantri Krishak Sathi Yojana', description: 'Accident insurance scheme for farmers and agricultural laborers', highlights: ['₹2 lakh accident death benefit', 'Covers farm accidents', 'Free enrollment', 'Includes agricultural laborers'], official_url: 'https://rajkisan.rajasthan.gov.in', launch_year: '2021', tags: ['accident insurance', 'safety'] },
  ],
  'Tamil Nadu': [
    { name: 'Tamil Nadu Mission on Sustainable Dryland Agriculture', description: 'Comprehensive scheme for dryland farming areas with focus on water conservation', highlights: ['Farm pond construction', 'Drought-resistant varieties', 'Micro-irrigation subsidy', 'Soil moisture conservation'], official_url: 'https://www.tn.gov.in/scheme/data_view/agriculture', launch_year: '2017', tags: ['dryland', 'water conservation'] },
    { name: 'Special Maize Initiative', description: 'Promotion of high-yield maize varieties with complete input support', highlights: ['Free hybrid seeds', 'Fertilizer and pesticide kit', 'Technical guidance', 'Market linkage'], official_url: 'https://www.tn.gov.in/scheme/data_view/agriculture', launch_year: '2020', tags: ['maize', 'productivity'] },
  ],
  'Telangana': [
    { name: 'Rythu Bandhu', description: 'Investment support of ₹10,000/acre/year for all farm-owning families', highlights: ['₹10,000/acre per year', '2 instalments of ₹5,000 each', 'No income cap', 'Pre-sowing distribution', 'Over 60 lakh beneficiaries'], official_url: 'https://rythubandhu.telangana.gov.in', launch_year: '2018', tags: ['investment support', 'direct benefit'] },
    { name: 'Rythu Bima (Farmer Insurance)', description: 'Free life and accident insurance for all farmer families in Telangana', highlights: ['₹5 lakh life insurance', 'State pays full premium', 'Covers 58 lakh farmers', 'No age restriction'], official_url: 'https://rythubima.telangana.gov.in', launch_year: '2018', tags: ['insurance', 'life cover'] },
  ],
  'Uttar Pradesh': [
    { name: 'UP Kisan Uday Yojana', description: 'Free solar pumps and energy-efficient pump sets for farmers', highlights: ['Free solar pump sets', 'Reduces electricity cost', '10 HP pump sets', 'Targets 10 lakh farmers'], official_url: 'https://upagriculture.com', launch_year: '2022', tags: ['solar', 'irrigation', 'energy'] },
  ],
  'West Bengal': [
    { name: 'Krishak Bandhu', description: 'Financial assistance of ₹10,000/year per acre for cultivating farmers', highlights: ['₹10,000/acre/year (max 2 instalments)', '₹2 lakh death benefit', 'Covers 72 lakh farmers', 'Direct bank transfer'], official_url: 'https://krishakbandhu.net', launch_year: '2019', tags: ['income support', 'death benefit'] },
  ],
};

// ─── Use Gemini to fetch additional scheme info if available ─────────
async function fetchSchemesFromGemini(state) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an expert on Indian government agricultural schemes. List 4 REAL government agricultural schemes specifically for ${state} state (not national schemes). 

For each scheme provide ACCURATE information:
- name: Official scheme name
- description: 2-3 sentence accurate description
- highlights: Array of 4-5 key benefits/features
- eligibility: Who can apply
- benefits: Main financial/material benefit
- official_url: REAL official government URL (must be a real .gov.in or state government URL)
- launch_year: Year launched
- tags: 2-3 relevant tags

Return ONLY a valid JSON array. No markdown, no explanation.
[
  {
    "name": "...",
    "description": "...",
    "highlights": ["...", "..."],
    "eligibility": "...",
    "benefits": "...",
    "official_url": "...",
    "launch_year": "...",
    "tags": ["...", "..."]
  }
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const schemes = JSON.parse(text);
    return Array.isArray(schemes) ? schemes : null;
  } catch (err) {
    console.error('Gemini scheme fetch error:', err.message);
    return null;
  }
}

// ─── 1) List schemes by state ───────────────────────────────────────
exports.listSchemes = async (req, res) => {
  try {
    const { state, category } = req.query;

    // Check if we have schemes in DB for this state
    const dbQuery = {};
    if (state && state !== 'All India') dbQuery.$or = [{ state }, { state: 'All India', category: 'national' }];
    if (category === 'national') dbQuery.category = 'national';
    if (category === 'state') dbQuery.category = 'state';

    let schemes = await Scheme.find(dbQuery).sort({ category: 1, launch_year: -1 });

    if (schemes.length === 0) {
      // Seed from static data + optional Gemini
      schemes = await seedSchemes(state);
    }

    // Filter by category if needed
    if (category === 'national') {
      schemes = schemes.filter(s => s.category === 'national');
    } else if (category === 'state') {
      schemes = schemes.filter(s => s.category === 'state');
    }

    res.json({ success: true, data: schemes });
  } catch (error) {
    console.error('listSchemes error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Seed schemes into DB ───────────────────────────────────────────
async function seedSchemes(state) {
  const toInsert = [];

  // Always add national schemes
  const existingNational = await Scheme.countDocuments({ category: 'national' });
  if (existingNational === 0) {
    for (const s of NATIONAL_SCHEMES) {
      toInsert.push(s);
    }
  }

  // Add state-specific schemes
  if (state && state !== 'All India') {
    const existingState = await Scheme.countDocuments({ state, category: 'state' });
    if (existingState === 0) {
      // Try static data first
      const staticSchemes = STATE_SCHEMES[state] || [];
      for (const s of staticSchemes) {
        toInsert.push({
          ...s,
          category: 'state',
          state,
          department: `${state} Department of Agriculture`,
          status: 'active',
        });
      }

      // If no static data, try Gemini
      if (staticSchemes.length === 0) {
        const geminiSchemes = await fetchSchemesFromGemini(state);
        if (geminiSchemes) {
          for (const s of geminiSchemes) {
            toInsert.push({
              ...s,
              category: 'state',
              state,
              department: s.department || `${state} Department of Agriculture`,
              status: 'active',
            });
          }
        }
      }
    }
  }

  if (toInsert.length > 0) {
    await Scheme.insertMany(toInsert);
  }

  // Fetch all
  const query = {};
  if (state && state !== 'All India') query.$or = [{ state }, { state: 'All India', category: 'national' }];
  return Scheme.find(query).sort({ category: 1, launch_year: -1 });
}

// ─── 2) Get single scheme details ───────────────────────────────────
exports.getScheme = async (req, res) => {
  try {
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) return res.status(404).json({ success: false, message: 'Scheme not found' });
    res.json({ success: true, data: scheme });
  } catch (error) {
    console.error('getScheme error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── 3) Search schemes ──────────────────────────────────────────────
exports.searchSchemes = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });

    const schemes = await Scheme.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ]
    }).limit(20);

    res.json({ success: true, data: schemes });
  } catch (error) {
    console.error('searchSchemes error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
