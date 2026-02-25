require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No API Key');
    return;
  }
  
  const genAI = new GoogleGenerativeAI(apiKey.trim());
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-flash-latest'
  ];

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = "What are common diseases in Rice?";
      
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
      });
      
      const response = await result.response;
      console.log(modelName, "SUCCESS", response.text().substring(0, 50));
      return;
    } catch (err) {
      console.error(modelName, "FAILED:", err.message);
    }
  }
}

test();
