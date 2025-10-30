#!/usr/bin/env node

import fs from 'fs/promises';
import yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const YAML_PATH = path.join(__dirname, '../public/locations.yaml');
const DELAY_MS = 1000; // Rate limit: 1 request per second for Nominatim

// Geocode a place name using Nominatim (OpenStreetMap)
async function geocodePlace(place) {
  try {
    console.log(`  Geocoding: ${place}`);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`,
      {
        headers: {
          'User-Agent': 'Interactive Travel Map CLI Geocoder'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const coords = {
        lat: parseFloat(parseFloat(data[0].lat).toFixed(6)),
        lon: parseFloat(parseFloat(data[0].lon).toFixed(6))
      };
      console.log(`  ✓ Found: ${coords.lat}, ${coords.lon}`);
      return coords;
    }

    console.log(`  ✗ No results found`);
    return null;
  } catch (err) {
    console.error(`  ✗ Error: ${err.message}`);
    return null;
  }
}

// Add delay between requests
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('Travel Map Geocoder');
  console.log('===================\n');

  try {
    // Read YAML file
    console.log(`Reading ${YAML_PATH}...`);
    const fileContent = await fs.readFile(YAML_PATH, 'utf8');
    const data = yaml.load(fileContent);

    if (!data || !data.locations) {
      throw new Error('Invalid YAML structure: missing locations array');
    }

    console.log(`Found ${data.locations.length} locations\n`);

    let geocodedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Process each location
    for (let i = 0; i < data.locations.length; i++) {
      const location = data.locations[i];
      console.log(`[${i + 1}/${data.locations.length}] ${location.name}`);

      // Skip if coords already exist
      if (location.coords && location.coords.lat && location.coords.lon) {
        console.log(`  → Already has coordinates, skipping\n`);
        skippedCount++;
        continue;
      }

      // Check if place field exists
      if (!location.place) {
        console.log(`  ✗ No 'place' field specified\n`);
        failedCount++;
        continue;
      }

      // Geocode the place
      const coords = await geocodePlace(location.place);

      if (coords) {
        location.coords = coords;
        geocodedCount++;
      } else {
        failedCount++;
      }

      // Rate limit delay
      if (i < data.locations.length - 1) {
        await delay(DELAY_MS);
      }
      console.log();
    }

    // Write back to YAML
    console.log('Writing updated YAML file...');
    const yamlOutput = yaml.dump(data, {
      indent: 2,
      lineWidth: -1,
      noRefs: true
    });
    await fs.writeFile(YAML_PATH, yamlOutput, 'utf8');

    // Summary
    console.log('\n===================');
    console.log('Summary:');
    console.log(`  ✓ Geocoded: ${geocodedCount}`);
    console.log(`  → Skipped: ${skippedCount}`);
    console.log(`  ✗ Failed: ${failedCount}`);
    console.log(`  Total: ${data.locations.length}`);

    if (failedCount > 0) {
      console.log('\n⚠️  Some locations could not be geocoded.');
      console.log('   Please check the place names and try again.');
      process.exit(1);
    } else {
      console.log('\n✓ All locations processed successfully!');
    }
  } catch (err) {
    console.error(`\n✗ Error: ${err.message}`);
    process.exit(1);
  }
}

main();
