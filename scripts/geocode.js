#!/usr/bin/env node

import fs from 'fs/promises';
import matter from 'gray-matter';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, '../static/locations');
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

// Recursively find all location folders (those containing index.md)
async function findLocationFolders(dir, relativePath = '') {
  const results = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      // Skip hidden files/folders
      if (entry.name.startsWith('.')) {
        continue;
      }

      if (entry.isDirectory()) {
        const fullPath = path.join(dir, entry.name);
        const indexPath = path.join(fullPath, 'index.md');
        const newRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

        try {
          await fs.access(indexPath);
          // This directory contains an index.md - it's a location
          results.push({ folder: newRelativePath, indexPath });
        } catch {
          // No index.md here, recurse into subdirectory
          const nested = await findLocationFolders(fullPath, newRelativePath);
          results.push(...nested);
        }
      }
    }
  } catch (err) {
    // Directory doesn't exist or can't be read, skip it
  }

  return results;
}

async function main() {
  console.log('Travel Map Geocoder');
  console.log('===================\n');

  // Get optional location slug from command line (can include slashes for nested)
  const targetSlug = process.argv[2];

  try {
    let locationFiles = [];

    if (targetSlug) {
      // Geocode single location (supports nested paths like "japan/tokyo-tower")
      const indexPath = path.join(CONTENT_DIR, targetSlug, 'index.md');
      try {
        await fs.access(indexPath);
        locationFiles.push({ folder: targetSlug, indexPath });
        console.log(`Geocoding single location: ${targetSlug}\n`);
      } catch {
        console.error(`Error: Location "${targetSlug}" not found at ${indexPath}`);
        process.exit(1);
      }
    } else {
      // Geocode all locations (recursively finds all index.md files)
      console.log(`Reading ${CONTENT_DIR}...`);
      locationFiles = await findLocationFolders(CONTENT_DIR);

      console.log(`Found ${locationFiles.length} locations\n`);
    }

    let geocodedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Process each location
    for (let i = 0; i < locationFiles.length; i++) {
      const { folder, indexPath } = locationFiles[i];

      // Read and parse the markdown file
      const fileContent = await fs.readFile(indexPath, 'utf-8');
      const { data: frontmatter, content } = matter(fileContent);

      console.log(`[${i + 1}/${locationFiles.length}] ${frontmatter.name || folder}`);

      // Skip if coords already exist
      if (frontmatter.coords && frontmatter.coords.lat && frontmatter.coords.lon) {
        console.log(`  → Already has coordinates, skipping\n`);
        skippedCount++;
        continue;
      }

      // Check if place field exists
      if (!frontmatter.place) {
        console.log(`  ✗ No 'place' field specified\n`);
        failedCount++;
        continue;
      }

      // Geocode the place
      const coords = await geocodePlace(frontmatter.place);

      if (coords) {
        // Update frontmatter with coordinates
        frontmatter.coords = coords;

        // Write back to file
        const updatedFile = matter.stringify(content, frontmatter);
        await fs.writeFile(indexPath, updatedFile, 'utf-8');

        geocodedCount++;
      } else {
        failedCount++;
      }

      // Rate limit delay
      if (i < locationFiles.length - 1) {
        await delay(DELAY_MS);
      }
      console.log();
    }

    // Summary
    console.log('===================');
    console.log('Summary:');
    console.log(`  ✓ Geocoded: ${geocodedCount}`);
    console.log(`  → Skipped: ${skippedCount}`);
    console.log(`  ✗ Failed: ${failedCount}`);
    console.log(`  Total: ${locationFiles.length}`);

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
