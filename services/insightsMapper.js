/**
 * Normalizes model output into a stable API response shape.
 */

const str = (v) => {
  if (v == null) return '';
  const s = String(v).trim();
  return s;
};

const takeFour = (arr) => (Array.isArray(arr) ? arr : []).slice(0, 4);

/**
 * @param {unknown} raw
 * @param {string} canonicalLocation - trimmed user input
 * @returns {{
 *   location: string,
 *   landmarks: Array<{ name: string, distance: string, description: string }>,
 *   food_and_shopping: Array<{ name: string, type: string, distance: string }>,
 *   transport: Array<{ name: string, type: string, distance: string }>
 * }}
 */
function mapLocationInsightsResponse(raw, canonicalLocation) {
  const r = raw && typeof raw === 'object' ? raw : {};

  const landmarks = takeFour(r.landmarks).map((item) => {
    const o = item && typeof item === 'object' ? item : {};
    return {
      name: str(o.name),
      distance: str(o.distance),
      description: str(o.description ?? o.summary ?? o.detail),
    };
  });

  const foodRaw = r.food_and_shopping ?? r.foodAndShopping ?? r.food_shopping;
  const food_and_shopping = takeFour(foodRaw).map((item) => {
    const o = item && typeof item === 'object' ? item : {};
    return {
      name: str(o.name),
      type: str(o.type ?? o.category ?? o.kind),
      distance: str(o.distance),
    };
  });

  const transportRaw = r.transport ?? r.transportation;
  const transport = takeFour(transportRaw).map((item) => {
    const o = item && typeof item === 'object' ? item : {};
    return {
      name: str(o.name),
      type: str(o.type ?? o.category ?? o.kind),
      distance: str(o.distance),
    };
  });

  return {
    location: str(r.location) || canonicalLocation,
    landmarks,
    food_and_shopping,
    transport,
  };
}

module.exports = {
  mapLocationInsightsResponse,
};
