/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 * 
 * @param {number} lat1 - Latitude of first point in degrees
 * @param {number} lon1 - Longitude of first point in degrees
 * @param {number} lat2 - Latitude of second point in degrees
 * @param {number} lon2 - Longitude of second point in degrees
 * @returns {number} Distance in kilometers
 */
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (angle) => (angle * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats a distance in kilometers according to the requirements:
 * - If distance < 1 km: show exact rounded distance (e.g. "0.8 km", "0.5 km", "0.9 km")
 * - If distance >= 1 km: show approximate range (e.g. "Approx. 2-3 km", "Approx. 5-6 km")
 * 
 * @param {number} distKm - Distance in kilometers
 * @returns {string} Formatted distance string
 */
function formatDistance(distKm) {
  if (distKm < 1) {
    // Round to one decimal place
    const rounded = Math.round(distKm * 10) / 10;
    // Edge case: if it rounds up to exactly 1.0, return the 1-2 km range
    if (rounded >= 1.0) {
      return 'Approx. 1-2 km';
    }
    // Return exact rounded distance (e.g. 0.8 km)
    return `${rounded.toFixed(1)} km`;
  } else {
    // Show range e.g. 2.2 -> Approx. 2-3 km
    const floor = Math.floor(distKm);
    return `Approx. ${floor}-${floor + 1} km`;
  }
}

module.exports = {
  getHaversineDistance,
  formatDistance,
};
