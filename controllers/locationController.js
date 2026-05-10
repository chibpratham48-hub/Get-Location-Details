const geminiService = require('../services/geminiService');
const { HttpError } = require('../middleware/httpError');

const MAX_LOCATION_LEN = parseInt(process.env.MAX_LOCATION_LENGTH || '280', 10);

const validationErrorResponse = (message) => ({
  error: message,
  code: 'VALIDATION_ERROR',
});

const getInsights = async (req, res) => {
  try {
    const { location: rawLocation } = req.body ?? {};
    const location = typeof rawLocation === 'string' ? rawLocation.trim() : '';

    if (!location) {
      return res.status(400).json(
        validationErrorResponse('Provide a non-empty "location" string in the JSON body.')
      );
    }

    if (location.length > MAX_LOCATION_LEN) {
      return res.status(400).json(
        validationErrorResponse(`Location must be at most ${MAX_LOCATION_LEN} characters.`)
      );
    }

    const insights = await geminiService.getLocationInsights(location);
    return res.status(200).json(insights);
  } catch (error) {
    if (error instanceof HttpError) {
      const body = {
        error: error.message,
        code: error.code || 'SERVICE_ERROR',
      };
      return res.status(error.statusCode).json(body);
    }
    console.error('Error in locationController:', error);
    return res.status(500).json({
      error: 'Internal server error.',
      code: 'INTERNAL',
    });
  }
};

module.exports = {
  getInsights,
};
