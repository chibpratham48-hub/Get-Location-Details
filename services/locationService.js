const fs = require('fs');
const path = require('path');
const { getHaversineDistance, formatDistance } = require('../utils/haversine');

// Load locations from consolidated JSON
const locationsPath = path.join(__dirname, '..', 'data', 'locations.json');
let cachedLocations = [];

try {
  if (fs.existsSync(locationsPath)) {
    const rawData = fs.readFileSync(locationsPath, 'utf8');
    cachedLocations = JSON.parse(rawData);
    console.log(`Loaded ${cachedLocations.length} locations into memory cache.`);
  } else {
    console.error(`Warning: locations.json not found at ${locationsPath}. Run the compile script first.`);
  }
} catch (err) {
  console.error(`Error loading locations.json: ${err.message}`);
}

// Configurable maximum distance threshold (default: 50 km)
const MAX_DISTANCE_THRESHOLD_KM = parseFloat(process.env.MAX_DISTANCE_THRESHOLD_KM || '50');

/**
 * Finds the nearest location category and returns the formatted insights response.
 * 
 * @param {string} locationName - The query location text (e.g. "ecospace techpark, Bellandur, Bengaluru")
 * @param {number} userLat - The user's input latitude
 * @param {number} userLon - The user's input longitude
 * @returns {Object|null} Formatted insights response, or null if no location matches within the distance threshold
 */
function getInsights(locationName, userLat, userLon) {
  if (cachedLocations.length === 0) {
    throw new Error('Database is empty or failed to load.');
  }

  let nearestLoc = null;
  let minDistance = Infinity;

  // 1. Find nearest location category center (linear scan for speed & simplicity)
  for (const loc of cachedLocations) {
    const dist = getHaversineDistance(userLat, userLon, loc.latitude, loc.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearestLoc = loc;
    }
  }

  // 2. If the nearest location is beyond our threshold, count it as "not found" (HTTP 404)
  if (!nearestLoc || minDistance > MAX_DISTANCE_THRESHOLD_KM) {
    console.log(`Nearest location was too far (${minDistance.toFixed(2)} km). Max threshold is ${MAX_DISTANCE_THRESHOLD_KM} km.`);
    return null;
  }

  // Helper to deep clone and map items
  const mapItems = (items) => {
    return (items || []).map(item => {
      // Deep clone so we do not modify the cache
      const cloned = { ...item };
      
      const itemLat = Number(cloned.latitude);
      const itemLon = Number(cloned.longitude);

      if (!isNaN(itemLat) && !isNaN(itemLon)) {
        // Calculate distance from input coordinates to item coordinates
        const distToItem = getHaversineDistance(userLat, userLon, itemLat, itemLon);
        cloned.distance = formatDistance(distToItem);
      } else {
        cloned.distance = 'Distance unavailable';
      }

      // Remove coordinates from final response items
      delete cloned.latitude;
      delete cloned.longitude;
      
      return cloned;
    });
  };

  // 3. Construct and format final response
  return {
    location: locationName,
    location_category: nearestLoc.location,
    landmarks: mapItems(nearestLoc.landmarks),
    food_and_shopping: mapItems(nearestLoc.food_and_shopping),
    transport: mapItems(nearestLoc.transport),
  };
}

module.exports = {
  getInsights,
  // Export cachedLocations count for testing/debugging
  getLocationCount: () => cachedLocations.length,
};
