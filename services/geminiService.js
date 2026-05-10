const { GoogleGenerativeAI } = require('@google/generative-ai');
const { mapLocationInsightsResponse } = require('./insightsMapper');
const { HttpError } = require('../middleware/httpError');

/**
 * @param {string} location
 * @returns {Promise<ReturnType<typeof mapLocationInsightsResponse>>}
 */
const getLocationInsights = async (location) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new HttpError(503, 'Service is missing GEMINI_API_KEY configuration.', 'CONFIG');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const model = genAI.getGenerativeModel({ model: modelName });

  const escapedLocation = JSON.stringify(location);

  const prompt = `
You are a travel and location expert. Provide insights for the location: ${escapedLocation}.

Requirements:
1. Recommend only real, well-known places; do not invent venues.
2. Distances must be plausible approximations from the center of the named area.
3. Output must be valid JSON only (no markdown, no code fences, no commentary).
4. Include EXACTLY 4 items in "landmarks", EXACTLY 4 in "food_and_shopping", and EXACTLY 4 in "transport".

JSON shape (field names and types must match):
{
  "location": string (same as input),
  "landmarks": [ { "name": string, "distance": string, "description": string } ],
  "food_and_shopping": [ { "name": string, "type": string, "distance": string } ],
  "transport": [ { "name": string, "type": string, "distance": string } ]
}
`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    let responseText = result.response.text();
    responseText = responseText.trim();
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (_e) {
      throw new HttpError(502, 'The insights service returned malformed JSON.', 'UPSTREAM_PARSE');
    }

    const normalized = mapLocationInsightsResponse(parsed, location);

    const keys = ['landmarks', 'food_and_shopping', 'transport'];
    for (const key of keys) {
      const arr = normalized[key];
      if (!Array.isArray(arr) || arr.length === 0) {
        throw new HttpError(502, `The insights response did not include any "${key}" entries.`, 'UPSTREAM_SHAPE');
      }
    }

    return normalized;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    console.error('Gemini API Error:', error);
    throw new HttpError(502, 'Failed to get insights from the language model.', 'UPSTREAM');
  }
};

module.exports = {
  getLocationInsights,
};
