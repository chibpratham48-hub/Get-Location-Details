const fs = require('fs');
const path = require('path');

// Target directories
const sourceDir = path.join(__dirname, '..', 'location insights');
const targetDir = path.join(__dirname, '..', 'data');
const targetFile = path.join(targetDir, 'locations.json');

console.log('Starting compilation of Bengaluru location database...');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Helper to normalize coordinate objects
function normalizeCoords(obj, fileName, context) {
  const latitude = obj.latitude !== undefined ? obj.latitude : obj.lat;
  const longitude = obj.longitude !== undefined ? obj.longitude : obj.lon;

  if (latitude === undefined || longitude === undefined) {
    console.warn(`Warning: Missing coordinate in ${fileName} [${context}]:`, obj);
  }

  // Create clean copy of object without the old lat/lon keys, standardizing on latitude/longitude
  const cleanObj = { ...obj };
  delete cleanObj.lat;
  delete cleanObj.lon;
  
  cleanObj.latitude = Number(latitude);
  cleanObj.longitude = Number(longitude);

  return cleanObj;
}

try {
  const files = fs.readdirSync(sourceDir);
  const compiledLocations = [];

  for (const file of files) {
    if (!file.endsWith('.js')) continue;

    const filePath = path.join(sourceDir, file);
    console.log(`Reading file: ${file}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');

    let locations;
    try {
      locations = JSON.parse(fileContent);
    } catch (err) {
      console.error(`Error: Failed to parse JSON in ${file}: ${err.message}`);
      process.exit(1);
    }

    if (!Array.isArray(locations)) {
      console.error(`Error: File ${file} does not contain a JSON array.`);
      process.exit(1);
    }

    for (const loc of locations) {
      if (!loc.location) {
        console.warn(`Warning: Object in ${file} missing "location" name:`, loc);
        continue;
      }

      // 1. Normalize top-level location
      const normalizedLoc = normalizeCoords(loc, file, `Location: ${loc.location}`);

      // 2. Normalize landmarks items
      if (Array.isArray(normalizedLoc.landmarks)) {
        normalizedLoc.landmarks = normalizedLoc.landmarks.map((item, idx) => 
          normalizeCoords(item, file, `${loc.location} -> landmark #${idx}`)
        );
      } else {
        normalizedLoc.landmarks = [];
      }

      // 3. Normalize food_and_shopping items
      if (Array.isArray(normalizedLoc.food_and_shopping)) {
        normalizedLoc.food_and_shopping = normalizedLoc.food_and_shopping.map((item, idx) => 
          normalizeCoords(item, file, `${loc.location} -> food_and_shopping #${idx}`)
        );
      } else {
        normalizedLoc.food_and_shopping = [];
      }

      // 4. Normalize transport items
      if (Array.isArray(normalizedLoc.transport)) {
        normalizedLoc.transport = normalizedLoc.transport.map((item, idx) => 
          normalizeCoords(item, file, `${loc.location} -> transport #${idx}`)
        );
      } else {
        normalizedLoc.transport = [];
      }

      compiledLocations.push(normalizedLoc);
    }
  }

  // Write compiled locations to file
  fs.writeFileSync(targetFile, JSON.stringify(compiledLocations, null, 2), 'utf8');
  console.log(`Successfully compiled ${compiledLocations.length} locations to ${targetFile}`);

} catch (err) {
  console.error(`Error during compilation: ${err.message}`);
  process.exit(1);
}
