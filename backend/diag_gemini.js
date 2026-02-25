require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function diagnostic() {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  console.log('Testing with API KEY:', apiKey.substring(0, 8) + '...');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = [
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-2.0-flash-exp'
  ];

  for (const m of models) {
    try {
      console.log(`\n--- Testing model: ${m} ---`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Say hello");
      const text = result.response.text();
      console.log(`✅ SUCCESS [${m}]: ${text}`);
    } catch (err) {
      console.log(`❌ FAILED [${m}]: ${err.message}`);
      if (err.status) console.log(`   Status Code: ${err.status}`);
    }
  }
}

diagnostic();
