require('dotenv').config();
const axios = require('axios');

async function listModels() {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  console.log('Using Key:', apiKey.substring(0, 10) + '...');
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await axios.get(url);
    console.log('Available Models:');
    response.data.models.forEach(m => {
      console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
    });
  } catch (err) {
    console.error('Failed to list models:', err.response ? err.response.data : err.message);
  }
}

listModels();
