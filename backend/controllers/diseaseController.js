const axios = require('axios');
const FormData = require('form-data');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Function to handle the disease detection logic
exports.detectDisease = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const { KINDWISE_API_KEY, GEMINI_API_KEY } = process.env;

    if (!KINDWISE_API_KEY) {
      console.error('KINDWISE_API_KEY is not defined in the environment');
      return res.status(500).json({ success: false, message: 'Server configuration error: Missing API Key' });
    }

    // --- STEP 1: Send Image to Kindwise API ---
    const base64Image = req.file.buffer.toString('base64');
    
    const kindwisePayload = {
      images: [`data:${req.file.mimetype};base64,${base64Image}`],
      similar_images: true
    };

    console.log('Sending request to Kindwise API via JSON Body...');
    
    const kindwiseResponse = await axios.post(
      'https://crop.kindwise.com/api/v1/identification?details=common_names,description,symptoms,treatment,prevention,cause',
      kindwisePayload,
      {
        headers: {
          'Api-Key': KINDWISE_API_KEY,
          'Content-Type': 'application/json'
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    const kindwiseResult = kindwiseResponse.data.result;
    
    // Parse Kindwise Output
    let plantName = 'Unknown Plant';
    let plantProbability = 0;
    
    if (kindwiseResult.crop && kindwiseResult.crop.suggestions.length > 0) {
        plantName = kindwiseResult.crop.suggestions[0].name;
        plantProbability = kindwiseResult.crop.suggestions[0].probability;
    }

    // Default assume healthy
    let isHealthy = true;
    let diseaseName = null;
    let diseaseProbability = 0;
    
    // Kindwise Health Assessment
    if (kindwiseResult.disease && kindwiseResult.disease.suggestions && kindwiseResult.disease.suggestions.length > 0) {
        // If the top disease is 'healthy' (Kindwise often returns 'healthy' as a finding)
        const topDisease = kindwiseResult.disease.suggestions[0];
        if (topDisease.name.toLowerCase() !== 'healthy') {
            isHealthy = false;
            diseaseName = topDisease.name;
            diseaseProbability = topDisease.probability;
        }
    } else if (kindwiseResult.is_healthy && kindwiseResult.is_healthy.probability < 0.5) {
        isHealthy = false;
        diseaseName = 'Unknown Disease / Poor Health';
    }

    // --- STEP 2: Use Gemini to Generate Remedies & Next Steps ---
    let detailedAnalysis = null;
    let remedies = null;
    let nextSteps = null;

    if (GEMINI_API_KEY && (!isHealthy || plantName !== 'Unknown Plant')) {
      try {
        console.log(`Generating AI insights for ${plantName} - ${isHealthy ? 'Healthy' : diseaseName}...`);
        
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        
        const modelsToTry = [
          'gemini-2.5-flash',
          'gemini-2.5-pro',
          'gemini-2.0-flash'
        ];

        let aiResponse = null;
        let successfulModel = null;

        let prompt;
        if (isHealthy) {
          prompt = `
You are an expert agronomist. I have a plant identified as "${plantName}". It appears to be healthy.
Please provide:
1. A brief overview of general care for this specific plant.
2. 3 short bullet points on how to maintain its health and prevent common diseases.
          `;
        } else {
          prompt = `
You are an expert agronomist. A farmer has uploaded a photo of a "${plantName}" crop. 
An AI image analysis tool has detected the disease "${diseaseName}" with a confidence of ${(diseaseProbability * 100).toFixed(1)}%.

Please provide a highly structured, informative response covering the following sections exactly:
[DESCRIPTION]
Describe what "${diseaseName}" is and how it affects the "${plantName}".

[REMEDIES]
List actionable, practical treatment methods (organic and chemical, if applicable) to cure or control this disease.

[NEXT_STEPS]
What immediate actions should the farmer take right now to prevent it from spreading to other crops?

Keep the response practical, concise, and formatted beautifully using Markdown. Do not include introductory conversational filler, just the requested sections.
          `;
        }

        for (const modelName of modelsToTry) {
          try {
            console.log(`Attempting Gemini disease insights with model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const aiResult = await model.generateContent(prompt);
            aiResponse = aiResult.response.text();
            
            if (aiResponse) {
              successfulModel = modelName;
              console.log(`✅ Success with model: ${modelName}`);
              break; 
            }
          } catch (err) {
            console.error(`❌ Model ${modelName} failed:`, err.message);
            // Log to error file for debugging
            require('fs').appendFileSync('gemini_error.txt', `\n[${new Date().toISOString()}] ${modelName} Error: ${err.message}\n`);
          }
        }

        if (!aiResponse) {
          throw new Error('All Gemini models failed to generate content.');
        }

        console.log("RAW GEMINI AI RESPONSE:", aiResponse);

        // Simple parsing since we asked for specific sections
        if (isHealthy) {
            detailedAnalysis = aiResponse;
        } else {
            // Split up the AI response based on the strict tags we requested
            const descSplit = aiResponse.split('[REMEDIES]');
            detailedAnalysis = descSplit[0] ? descSplit[0].replace(/\[DESCRIPTION\]/i, '').trim() : "No description provided.";
            
            if (descSplit.length > 1) {
                const remSplit = descSplit[1].split('[NEXT_STEPS]');
                remedies = remSplit[0].trim();
                nextSteps = remSplit[1] ? remSplit[1].trim() : null;
            } else {
                remedies = aiResponse;
            }
        }

      } catch (geminiError) {
        console.error('Gemini API Error details:', geminiError.message, geminiError.status, geminiError.stack);
        require('fs').writeFileSync('gemini_error.txt', geminiError.stack || geminiError.message);
        // We gracefully degrade if Gemini fails - the user still gets the Kindwise detection
        remedies = "Unable to fetch detailed remedies at this time. Please consult a local agricultural officer.";
      }
    }

    // --- STEP 3: Construct and Return the Unified Response ---
    res.json({
      success: true,
      result: {
        is_healthy: isHealthy,
        plant_identification: {
            scientific_name: plantName,
            probability: plantProbability
        },
        disease: isHealthy ? null : {
            suggestions: [
                {
                    name: diseaseName,
                    probability: diseaseProbability,
                    description: detailedAnalysis, // Supplied by Gemini
                    treatment: remedies,           // Supplied by Gemini
                    next_steps: nextSteps          // Supplied by Gemini
                }
            ]
        },
        health_status: isHealthy ? 'Plant appears healthy' : 'Disease detected',
        ai_healthy_advice: isHealthy ? detailedAnalysis : null
      }
    });

  } catch (error) {
    console.error('Error in disease detection:', error);
    
    // Better error output for Axios specifically
    let errorMessage = 'Failed to analyze crop image';
    if (error.response) {
       console.error('Kindwise API Response Error:', error.response.data);
       errorMessage = `API Error: ${error.response.status} - ${error.response.data.message || error.message}`;
    }

    res.status(500).json({ 
      success: false, 
      message: errorMessage 
    });
  }
};
