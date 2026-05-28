const locationService = require('../services/locationService');
const { HttpError } = require('../middleware/httpError');

const MAX_LOCATION_LEN = parseInt(process.env.MAX_LOCATION_LENGTH || '280', 10);

const validationErrorResponse = (message) => ({
  error: message,
  code: 'VALIDATION_ERROR',
});

const getInsights = async (req, res) => {
  try {
    const rawLocation = req.query?.location;
    const rawLatLon = req.query?.latlon;

    const location = typeof rawLocation === 'string' ? rawLocation.trim() : '';
    const latlon = typeof rawLatLon === 'string' ? rawLatLon.trim() : '';

    // 1. Validate "location" parameter
    if (!location) {
      return res.status(400).json(
        validationErrorResponse('Provide a non-empty "location" query parameter.')
      );
    }

    if (location.length > MAX_LOCATION_LEN) {
      return res.status(400).json(
        validationErrorResponse(`Location name must be at most ${MAX_LOCATION_LEN} characters.`)
      );
    }

    // 2. Validate "latlon" parameter
    if (!latlon) {
      return res.status(400).json(
        validationErrorResponse('Provide a non-empty "latlon" query parameter in the format "latitude,longitude".')
      );
    }

    const parts = latlon.split(',');
    if (parts.length !== 2) {
      return res.status(400).json(
        validationErrorResponse('Invalid "latlon" query parameter. It must be in the format "latitude,longitude".')
      );
    }

    const latStr = parts[0].trim();
    const lonStr = parts[1].trim();
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lonStr);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json(
        validationErrorResponse('Invalid "latlon" values. Both latitude and longitude must be valid numeric coordinates.')
      );
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json(
        validationErrorResponse('Invalid latitude. Latitude must be between -90 and 90 degrees.')
      );
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json(
        validationErrorResponse('Invalid longitude. Longitude must be between -180 and 180 degrees.')
      );
    }

    // 3. Fetch insights using geographical matching
    const insights = locationService.getInsights(location, latitude, longitude);

    if (!insights) {
      return res.status(404).json({
        error: 'No matching location found. The coordinates provided may be too far from our covered Bengaluru areas.',
        code: 'NOT_FOUND',
      });
    }

    return res.status(200).json(insights);
  } catch (error) {
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code || 'SERVICE_ERROR',
      });
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
